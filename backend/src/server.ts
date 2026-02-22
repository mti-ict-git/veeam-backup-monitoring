import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
import { loadConfig } from "./config";
import { TokenManager } from "./token";
import { VeeamClient } from "./veeamClient";
import {
  RepositoriesStatesResponse,
  VMsStatesResponse,
  JobState,
  VMProtectionResponse,
  BackupsResponse,
  RestoreTestLatestResponse,
  SureBackupStatusResponse,
} from "./types";
import { captureDashboard } from "./screenshot";
import { sendGroupMessage, sendImageWithCaption } from "./whatsapp";
import { startReportScheduler } from "./scheduler";

const config = loadConfig();
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: config.corsOrigin ?? "*",
  }),
);

const tokens = new TokenManager();
const veeam = new VeeamClient(tokens);

app.get("/api/veeam/jobs/states", async (_req, res) => {
  try {
    const data = await veeam.getJobsStates();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: "Upstream error" });
  }
});

app.get("/api/veeam/jobs/copy/states", async (_req, res) => {
  try {
    const data = await veeam.getBackupCopyJobsStates();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: "Upstream error" });
  }
});

app.get("/api/veeam/repositories/states", async (_req, res) => {
  try {
    const data = await veeam.getRepositoriesStates();
    const normalized: RepositoriesStatesResponse = {
      data: data.data.map((r) => {
        const cap = r.capacityGB ?? 0;
        let free = r.freeGB;
        let used = r.usedSpaceGB;
        if (cap && free !== undefined) {
          free = Math.max(0, Math.min(cap, free));
          used = Math.max(0, Math.min(cap, cap - free));
        } else if (cap && used !== undefined) {
          used = Math.max(0, Math.min(cap, used));
        }
        return {
          ...r,
          usedSpaceGB: used,
          freeGB: free,
        };
      }),
    };
    res.json(normalized);
  } catch (e) {
    res.status(502).json({ error: "Upstream error" });
  }
});

app.get("/api/veeam/debug/backups", async (_req, res) => {
  try {
    const backups = await veeam.getBackups();
    res.json(backups);
  } catch (e) {
    res.status(502).json({ error: "Upstream error" });
  }
});

app.get("/api/veeam/restore/tests/latest", async (_req, res) => {
  try {
    const data = await veeam.getRestoreTestLatest();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: "Upstream error" });
  }
});

app.get("/api/veeam/surebackup/status", async (_req, res) => {
  try {
    const data = await veeam.getSureBackupStatus();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: "Upstream error" });
  }
});

app.get("/api/veeam/vms/states", async (_req, res) => {
  try {
    const jobs = await veeam.getJobsStates();
    const vmLike = jobs.data.filter((j: JobState) => (j.workload ?? "").toLowerCase() === "vm" || !!j.lastRun || !!j.lastResult);
    const byName = new Map<string, JobState[]>();
    for (const j of vmLike) {
      const key = j.name;
      const list = byName.get(key) ?? [];
      list.push(j);
      byName.set(key, list);
    }
    const vms: VMsStatesResponse = {
      data: Array.from(byName.entries()).map(([name, list]) => {
        const sorted = list
          .map((j) => ({ j, t: j.lastRun ? Date.parse(j.lastRun) : -Infinity }))
          .sort((a, b) => (b.t || -Infinity) - (a.t || -Infinity));
        const best = sorted[0]?.j ?? list[0];
        return {
          name,
          jobName: best.name,
          lastRun: best.lastRun,
          lastResult: best.lastResult,
        };
      }),
    };
    res.json(vms);
  } catch (e) {
    res.status(502).json({ error: "Upstream error" });
  }
});

app.get("/api/veeam/vms/protection", async (_req, res) => {
  try {
    const [primaryJobs, copyJobs] = await Promise.allSettled([
      veeam.getJobsStates(),
      veeam.getBackupCopyJobsStates(),
    ]);
    const primaryData = primaryJobs.status === "fulfilled" ? primaryJobs.value.data : [];
    const copyData = copyJobs.status === "fulfilled" ? copyJobs.value.data : [];
    const norm = (s: string) => s.trim().toLowerCase().replace(/^vault[_\-\s]+/, "");
    const primaryMap = new Map<string, JobState[]>();
    const copyMap = new Map<string, JobState[]>();
    for (const j of primaryData) {
      const key = norm(j.name);
      const arr = primaryMap.get(key) ?? [];
      arr.push(j);
      primaryMap.set(key, arr);
    }
    for (const j of copyData) {
      const key = norm(j.name);
      const arr = copyMap.get(key) ?? [];
      arr.push(j);
      copyMap.set(key, arr);
    }
    const keys = new Set<string>([...primaryMap.keys(), ...copyMap.keys()]);
    const pickLatest = (arr: JobState[] | undefined) => {
      if (!arr || arr.length === 0) return undefined;
      return arr
        .map((j) => ({ j, t: j.lastRun ? Date.parse(j.lastRun) : -Infinity }))
        .sort((a, b) => (b.t || -Infinity) - (a.t || -Infinity))[0]?.j;
    };
    const out: VMProtectionResponse = {
      data: Array.from(keys).map((k) => {
        const p = pickLatest(primaryMap.get(k));
        const c = pickLatest(copyMap.get(k));
        return {
          name: k,
          primaryLastRun: p?.lastRun,
          primaryResult: p?.lastResult ?? "",
          copyLastRun: c?.lastRun,
          copyResult: c?.lastResult ?? "",
        };
      }),
    };
    res.json(out);
  } catch (e) {
    res.status(502).json({ error: "Upstream error" });
  }
});

function formatTB(gb?: number) {
  if (!gb) return "0.0TB";
  return `${(gb / 1024).toFixed(1)}TB`;
}

function jakartaNow() {
  const tz = process.env.REPORT_CAPTION_TIMEZONE ?? "Asia/Jakarta";
  const label = process.env.REPORT_CAPTION_TZ_LABEL ?? (tz === "Asia/Jakarta" ? "WIB" : tz);
  const date = new Date();
  const d = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: tz });
  const t = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz });
  return { dateStr: d, timeStr: `${t} ${label}` };
}

function sanitizeCaption(input: string, maxLen = 900) {
  const asciiOnly = input
    .split("")
    .map((ch) => (ch.charCodeAt(0) <= 127 ? ch : ""))
    .join("");
  const singleSpaced = asciiOnly.replace(/\r?\n+/g, "\n").trim();
  const limited = singleSpaced.length > maxLen ? singleSpaced.slice(0, maxLen) : singleSpaced;
  return limited;
}

async function buildCaption(): Promise<string> {
  const [jobs, reposNormalized, protection, restoreLatest, surebackup] = await Promise.all([
    veeam.getJobsStates(),
    (async () => {
      try {
        const resp = await (await fetch("http://localhost:" + config.port + "/api/veeam/repositories/states")).json();
        return resp as RepositoriesStatesResponse;
      } catch {
        return { data: [] } as RepositoriesStatesResponse;
      }
    })(),
    (async () => {
      try {
        const resp = await (await fetch("http://localhost:" + config.port + "/api/veeam/vms/protection")).json();
        return resp as VMProtectionResponse;
      } catch {
        return { data: [] } as VMProtectionResponse;
      }
    })(),
    (async () => {
      try {
        const r = await veeam.getRestoreTestLatest();
        return r as RestoreTestLatestResponse;
      } catch {
        return { data: null };
      }
    })(),
    (async () => {
      try {
        const r = await veeam.getSureBackupStatus();
        return r as SureBackupStatusResponse;
      } catch {
        return { data: null };
      }
    })(),
  ]);
  const counts = jobs.data.reduce(
    (acc, j) => {
      const last = (j.lastResult || "").toLowerCase();
      const status = (j.status || "").toLowerCase();
      acc.total += 1;
      if (status.includes("running") || last.includes("running")) acc.running += 1;
      else if (last.includes("success")) acc.success += 1;
      else if (last.includes("warn")) acc.warning += 1;
      else if (last.includes("fail") || last.includes("error")) acc.failed += 1;
      return acc;
    },
    { total: 0, success: 0, warning: 0, failed: 0, running: 0 },
  );
  const now = Date.now();
  const failedRecent = jobs.data
    .filter((j) => {
      const last = (j.lastResult || "").toLowerCase();
      if (last.includes("success")) return false;
      const t = j.lastRun ? Date.parse(j.lastRun) : 0;
      return t && now - t < 24 * 60 * 60 * 1000;
    })
    .slice(0, 5)
    .map((j) => `- ${j.name}${j.message ? ` (${j.message})` : ""}`);
  const normalizedRepos = (reposNormalized.data ?? []).map((r) => {
    const cap = Math.max(0, r.capacityGB ?? 0);
    const usedRaw = typeof r.usedSpaceGB === "number" ? r.usedSpaceGB : cap && typeof r.freeGB === "number" ? cap - Math.max(0, Math.min(cap, r.freeGB)) : 0;
    const used = Math.max(0, Math.min(cap || usedRaw, usedRaw));
    const pct = cap ? Math.min(100, Math.max(0, Math.round((used / cap) * 100))) : 0;
    return { name: r.name, cap, used, pct };
  });
  const repoLines = normalizedRepos
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3)
    .map((r) => `- ${r.name}: ${r.pct}% (${formatTB(r.used)} / ${formatTB(r.cap)})`);
  const nonCompliant = (protection.data || []).filter((v) => {
    const parse = (s?: string) => (s ? Date.parse(s) : 0);
    const p = parse(v.primaryLastRun);
    const c = parse(v.copyLastRun);
    const last = Math.max(p || 0, c || 0);
    return !last || now - last > 24 * 60 * 60 * 1000;
  });
  const rpoLine = nonCompliant.length === 0 ? "- All critical VM < 24h ✔" : `- Non-compliant: ${nonCompliant.length} VM`;
  let restoreLine = "- N/A";
  const d = (restoreLatest as RestoreTestLatestResponse | null)?.data ?? null;
  if (d && d.lastTestAt) {
    const dt = new Date(d.lastTestAt);
    const tz = process.env.REPORT_CAPTION_TIMEZONE ?? "Asia/Jakarta";
    const ds = dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: tz });
    const res = d.result ?? "Unknown";
    restoreLine = `- ${res} (${ds})`;
  }
  const { dateStr, timeStr } = jakartaNow();
  const parts = [
    "📦 VEEAM DAILY BACKUP REPORT",
    `📅 ${dateStr} | ${timeStr}`,
    "",
    `✅ Total Job: ${counts.total}`,
    `🟢 Success: ${counts.success}`,
    `🟡 Warning: ${counts.warning}`,
    `🔴 Failed: ${counts.failed}`,
    counts.running ? `⏳ Running: ${counts.running}` : undefined,
    "",
    "⚠ Failed Job:",
    failedRecent.length ? failedRecent.join("\n") : "- N/A",
    "",
    "💾 Repository Usage:",
    repoLines.length ? repoLines.join("\n") : "- N/A",
    "",
    "🧪 Last Restore Test:",
    restoreLine,
    "",
    "🔐 RPO Status:",
    rpoLine,
    "",
    "#MTIBackup #ICTMonitoring",
  ].filter(Boolean) as string[];
  return parts.join("\n");
}

async function buildShortCaption(): Promise<string> {
  const jobs = await veeam.getJobsStates();
  const now = Date.now();
  const counts = jobs.data.reduce(
    (acc, j) => {
      const last = (j.lastResult || "").toLowerCase();
      const status = (j.status || "").toLowerCase();
      acc.total += 1;
      if (status.includes("running") || last.includes("running")) acc.running += 1;
      else if (last.includes("success")) acc.success += 1;
      else if (last.includes("warn")) acc.warning += 1;
      else if (last.includes("fail") || last.includes("error")) acc.failed += 1;
      return acc;
    },
    { total: 0, success: 0, warning: 0, failed: 0, running: 0 },
  );
  let nonCompliant = 0;
  try {
    const protection = (await (await fetch("http://localhost:" + config.port + "/api/veeam/vms/protection")).json()) as VMProtectionResponse;
    nonCompliant = (protection.data || []).filter((v) => {
      const parse = (s?: string) => (s ? Date.parse(s) : 0);
      const p = parse(v.primaryLastRun);
      const c = parse(v.copyLastRun);
      const last = Math.max(p || 0, c || 0);
      return !last || now - last > 24 * 60 * 60 * 1000;
    }).length;
  } catch {
    nonCompliant = 0;
  }
  const { dateStr, timeStr } = jakartaNow();
  const parts = [
    "VEEAM REPORT",
    dateStr,
    timeStr,
    `Total:${counts.total}`,
    `Success:${counts.success}`,
    `Warn:${counts.warning}`,
    `Fail:${counts.failed}`,
    nonCompliant > 0 ? `RPO:${nonCompliant}NOK` : "RPO:OK",
  ];
  return parts.join(" | ");
}

function splitIntoChunksByLines(text: string, maxLen = 280): string[] {
  const lines = text.split("\n");
  const chunks: string[] = [];
  let cur = "";
  for (const ln of lines) {
    if (!ln.trim()) {
      if (cur.length > 0) {
        chunks.push(cur);
        cur = "";
      }
      continue;
    }
    if ((cur + (cur ? "\n" : "") + ln).length > maxLen) {
      if (cur) chunks.push(cur);
      if (ln.length > maxLen) {
        for (let i = 0; i < ln.length; i += maxLen) {
          chunks.push(ln.slice(i, i + maxLen));
        }
        cur = "";
      } else {
        cur = ln;
      }
    } else {
      cur = cur ? cur + "\n" + ln : ln;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

async function sendChunksWithFallback(chatId: string, caption: string) {
  const chunks = splitIntoChunksByLines(caption, 300);
  for (const chunk of chunks) {
    const try1 = await sendGroupMessage(chatId, chunk);
    if (try1.ok) {
      await new Promise((r) => setTimeout(r, 900));
      continue;
    }
    const safe = sanitizeCaption(chunk, 300);
    const try2 = await sendGroupMessage(chatId, safe);
    if (try2.ok) {
      await new Promise((r) => setTimeout(r, 900));
      continue;
    }
    const lines = safe.split("\n").filter((l) => l.trim().length > 0);
    for (const l of lines) {
      if (l.length <= 300) {
        const r = await sendGroupMessage(chatId, l);
        if (!r.ok) {
          return r;
        }
      } else {
        for (let i = 0; i < l.length; i += 300) {
          const r = manuallySplitAndSend(chatId, l.slice(i, i + 300));
          const res = await r;
          if (!res.ok) {
            return res;
          }
        }
      }
      await new Promise((r) => setTimeout(r, 700));
    }
  }
  return { ok: true, status: 200 };
}

function manuallySplitAndSend(chatId: string, txt: string) {
  return sendGroupMessage(chatId, txt);
}

async function trySendImageSingleMessage(chatId: string, image: Buffer, captionBuilt: string) {
  // Attempt pretty (emoji) full caption first, then ASCII at decreasing lengths
  const pretty = captionBuilt;
  const ascii900 = sanitizeCaption(captionBuilt, 900);
  const ascii700 = sanitizeCaption(captionBuilt, 700);
  const ascii512 = sanitizeCaption(captionBuilt, 512);
  const ascii300 = sanitizeCaption(captionBuilt, 300);
  const candidates = [pretty, ascii900, ascii700, ascii512, ascii300];
  for (const cap of candidates) {
    const r = await sendImageWithCaption(chatId, cap, image);
    if (r.ok) return r;
  }
  // Final fallback: minimal short caption so image still goes through
  return await sendImageWithCaption(chatId, "Veeam Dashboard Snapshot", image);
}

app.post("/api/notify/whatsapp", async (req, res) => {
  try {
    const defaultChat = process.env.WHATSAPP_GROUP_ID;
    const chatId: string | undefined = (req.body?.chatId as string | undefined) ?? defaultChat;
    let caption: string | undefined = req.body?.caption as string | undefined;
    const url: string | undefined = req.body?.url as string | undefined;
    const textOnly: boolean = Boolean(req.body?.textOnly);
    const auto: boolean = req.body?.auto === false ? false : true;
    const hideSidebar: boolean = req.body?.hideSidebar === false ? false : true;
    const captionMode: "full" | "short" = (req.body?.captionMode as "full" | "short") ?? "full";
    if (!chatId) {
      return res.status(400).json({ error: "chatId required (or set WHATSAPP_GROUP_ID)" });
    }
    if ((auto || !caption) && captionMode === "full") {
      caption = await buildCaption();
    }
    if (textOnly) {
      const msg = caption ?? "";
      const r = await sendChunksWithFallback(chatId, msg);
      return res.status(r.ok ? 200 : 502).json({ ok: r.ok, status: r.status });
    }
    const image = await captureDashboard({ url, hideSidebar });
    if (captionMode === "short") {
      const shortCap = "Veeam Dashboard Snapshot";
      const resultS = await sendImageWithCaption(chatId, shortCap, image);
      if (!resultS.ok) {
        return res.status(502).json({ error: "gateway error", status: resultS.status });
      }
      return res.json({ ok: true });
    }
    const built = caption ?? "";
    const sendRes = await trySendImageSingleMessage(chatId, image, built);
    if (!sendRes.ok) {
      return res.status(502).json({ error: "gateway error", status: sendRes.status });
    }
    res.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    // eslint-disable-next-line no-console
    console.error("notify/whatsapp error:", msg);
    res.status(500).json({ error: "internal error", message: msg });
  }
});

app.get("/api/notify/screenshot", async (req, res) => {
  try {
    const url = (req.query?.url as string | undefined) ?? undefined;
    const image = await captureDashboard({ url });
    res.setHeader("Content-Type", "image/png");
    res.send(image);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    res.status(500).json({ error: "internal error", message: msg });
  }
});

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

app.listen(config.port, () => {
  // no-op
});
startReportScheduler();
