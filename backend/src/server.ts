import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
import { loadConfig } from "./config";
import { TokenManager } from "./token";
import { VeeamClient } from "./veeamClient";
import { RepositoriesStatesResponse, VMsStatesResponse, JobState, VMProtectionResponse, BackupsResponse } from "./types";
import { captureDashboard } from "./screenshot";
import { sendImageWithCaption } from "./whatsapp";

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

app.post("/api/notify/whatsapp", async (req, res) => {
  try {
    const chatId: string | undefined = req.body?.chatId;
    const caption: string | undefined = req.body?.caption;
    const url: string | undefined = req.body?.url;
    if (!chatId) {
      return res.status(400).json({ error: "chatId required" });
    }
    const image = await captureDashboard({ url });
    const result = await sendImageWithCaption(chatId, caption ?? "", image);
    if (!result.ok) {
      return res.status(502).json({ error: "gateway error", status: result.status });
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "internal error" });
  }
});

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

app.listen(config.port, () => {
  // no-op
});
