import axios, { AxiosInstance } from "axios";
import https from "node:https";
import { loadConfig } from "./config.js";
import {
  JobState,
  JobsStatesResponse,
  RepositoriesStatesResponse,
  BackupsResponse,
  RestoreTestLatestResponse,
  RestoreTestResult,
  SureBackupStatusResponse,
} from "./types";
import { TokenManager } from "./token.js";

export class VeeamClient {
  private config = loadConfig();
  private http: AxiosInstance;
  private tokens: TokenManager;

  constructor(tokens: TokenManager) {
    const agent = this.config.insecureTls ? new https.Agent({ rejectUnauthorized: false }) : undefined;
    this.http = axios.create({
      baseURL: this.config.veeamBaseUrl,
      httpsAgent: agent,
      timeout: 10000,
    });
    this.tokens = tokens;
  }

  private async headers() {
    const token = await this.tokens.getToken();
    return {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
      "x-api-version": this.config.veeamApiVersion,
    };
  }

  private isDisabledJob(job: JobState): boolean {
    const statusStr = (job.status ?? "").toLowerCase();
    if (statusStr.includes("disabled")) return true;

    const rec = job as unknown as Record<string, unknown>;
    const getBool = (key: string): boolean | undefined => {
      const v = rec[key];
      return typeof v === "boolean" ? v : undefined;
    };
    const getStr = (key: string): string | undefined => {
      const v = rec[key];
      return typeof v === "string" ? v : undefined;
    };

    const disabledKeys = ["disabled", "isDisabled"];
    for (const k of disabledKeys) {
      if (getBool(k) === true) return true;
    }

    const enabledKeys = ["enabled", "isEnabled", "scheduleEnabled", "isScheduleEnabled", "jobEnabled"];
    for (const k of enabledKeys) {
      if (getBool(k) === false) return true;
    }

    const stateStr = (getStr("state") ?? "").toLowerCase();
    if (stateStr.includes("disabled")) return true;

    return false;
  }

  async getJobsStates(): Promise<JobsStatesResponse> {
    const r = await this.http.get<JobsStatesResponse>("jobs/states", { headers: await this.headers() });
    const items = Array.isArray(r.data?.data) ? r.data.data : [];
    return { data: items.filter((j) => !this.isDisabledJob(j)) };
  }

  async getSessionsRaw(limit = 200): Promise<unknown> {
    const r = await this.http.get<unknown>(`sessions?limit=${limit}`, { headers: await this.headers() });
    return r.data;
  }

  async getRaw(path: string): Promise<unknown> {
    const r = await this.http.get<unknown>(path, { headers: await this.headers() });
    return r.data;
  }

  async getBackupCopyJobsStates(): Promise<JobsStatesResponse> {
    const baseHeaders = await this.headers();
    const paths = [
      "jobs/states?typeFilter=FileBackupCopy&limit=500",
      "jobs/states?typeFilter=FileBackupCopy&limit=200",
      "jobs/states?nameFilter=VAULT*&limit=500",
      "jobs/states?nameFilter=VAULT*&limit=200",
      "sessions?nameFilter=VAULT*&limit=200",
    ];
    const looksLikeCopy = (j: { type?: string; name: string }) => {
      const t = (j.type ?? "").toLowerCase();
      const n = j.name.toLowerCase();
      return (
        t.includes("copy") ||
        n.includes("vault") ||
        n.includes("backup copy") ||
        n.includes("backupcopy") ||
        n.includes("\\")
      );
    };
    const normalizeName = (value: string) =>
      value
        .trim()
        .toLowerCase()
        .replace(/^vault[_\-\s]+/, "")
        .replace(/\([^)]*\)/g, "")
        .replace(/[^a-z0-9]/g, "");
    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
    const extractDataArray = (payload: unknown): unknown[] | null => {
      if (Array.isArray(payload)) return payload;
      if (!isRecord(payload)) return null;

      const directKeys = ["data", "items", "results", "sessions"];
      for (const k of directKeys) {
        const v = payload[k];
        if (Array.isArray(v)) return v;
      }

      const dataObj = payload.data;
      if (isRecord(dataObj)) {
        const nestedKeys = ["data", "items", "results", "sessions"];
        for (const k of nestedKeys) {
          const v = dataObj[k];
          if (Array.isArray(v)) return v;
        }
      }
      return null;
    };
    const toJobState = (input: unknown): JobState | null => {
      if (!isRecord(input)) return null;
      const nameVal = input.name;
      const name = typeof nameVal === "string" ? nameVal : null;
      if (!name) return null;
      const lastResultVal = input.lastResult ?? input.result ?? input.state;
      const lastResult =
        typeof lastResultVal === "string"
          ? lastResultVal
          : isRecord(lastResultVal) && typeof lastResultVal.result === "string"
            ? lastResultVal.result
            : "Unknown";
      const lastRunVal = input.lastRun ?? input.endTime ?? input.creationTime ?? input.startTime;
      const lastRun = typeof lastRunVal === "string" ? lastRunVal : undefined;
      const typeVal = input.jobType ?? input.type ?? input.sessionType;
      const type = typeof typeVal === "string" ? typeVal : undefined;
      const workloadVal = input.workload;
      const workload = typeof workloadVal === "string" ? workloadVal : undefined;
      const statusVal = input.status;
      const status = typeof statusVal === "string" ? statusVal : undefined;
      const idVal = input.id ?? input.jobId ?? input.uniqueId;
      const id = typeof idVal === "string" ? idVal : undefined;
      const descriptionVal = input.description;
      const description = typeof descriptionVal === "string" ? descriptionVal : undefined;
      const messageVal = input.message ?? input.details;
      const message =
        typeof messageVal === "string"
          ? messageVal
          : isRecord(lastResultVal) && typeof lastResultVal.message === "string"
            ? lastResultVal.message
            : undefined;
      return { name, lastResult, lastRun, type, workload, status, id, description, message };
    };
    const disabledBaseKeys = new Set<string>();
    try {
      const allStates = await this.http.get<unknown>("jobs/states?limit=500", { headers: baseHeaders });
      const allStatesArray = extractDataArray(allStates.data) ?? [];
      for (const raw of allStatesArray) {
        if (!isRecord(raw)) continue;
        const probe = toJobState(raw);
        if (!probe) continue;
        const merged: JobState = { ...probe, ...(raw as Record<string, unknown>) };
        if (!this.isDisabledJob(merged)) continue;
        const normalized = normalizeName(probe.name);
        if (normalized.length > 0) {
          disabledBaseKeys.add(normalized);
        }
      }
    } catch {
      // ignore
    }
    const candidateApiVersions = Array.from(
      new Set(
        [
          this.config.veeamApiVersion,
          "1.2-rev0",
          "1.1-rev2",
          "1.1-rev1",
          "1.1-rev0",
        ].filter(Boolean),
      ),
    );
    let apiCopyCandidates: JobState[] = [];
    let jobsFallbackCandidates: JobState[] = [];

    apiVersionLoop: for (const apiVersion of candidateApiVersions) {
      const headers = { ...baseHeaders, "x-api-version": apiVersion };
      for (const p of paths) {
        try {
          const r = await this.http.get<unknown>(p, { headers });
          if (r.status >= 200 && r.status < 300) {
            const arr = extractDataArray(r.data);
            if (!arr) continue;
            const normalized = arr.map(toJobState).filter((v): v is JobState => v !== null);
            const filtered = normalized
              .filter(looksLikeCopy)
              .filter((j) => !this.isDisabledJob(j))
              .filter((j) => !disabledBaseKeys.has(normalizeName(j.name)));
            if (filtered.length > 0) {
              const hasUsefulData = filtered.some((j) => {
                if (j.lastRun) return true;
                const result = (j.lastResult ?? "").trim().toLowerCase();
                return result.length > 0 && result !== "unknown";
              });
              if (!hasUsefulData) {
                continue;
              }
              const byName = new Map<string, JobState>();
              for (const it of filtered) {
                const prev = byName.get(it.name);
                const prevT = prev?.lastRun ? Date.parse(prev.lastRun) : -Infinity;
                const nextT = it.lastRun ? Date.parse(it.lastRun) : -Infinity;
                if (!prev || nextT > prevT) {
                  byName.set(it.name, it);
                }
              }
              apiCopyCandidates = Array.from(byName.values());
              break apiVersionLoop;
            }
          }
        } catch {
          // try next path
        }
      }
    }

    try {
      const all = await this.getJobsStates();
      const fallback = all.data.filter((j) => {
        const name = j.name.toLowerCase();
        const type = (j.type ?? "").toLowerCase();
        return name.includes("vault") || name.startsWith("vault_") || type === "filebackupcopy";
      });
      if (fallback.length > 0) {
        jobsFallbackCandidates = fallback.filter((j) => !this.isDisabledJob(j));
      }
    } catch {
      // ignore
    }
    const enrichWithBackupCreationTime = async (rows: JobState[]): Promise<JobState[]> => {
      if (rows.length === 0) return rows;
      try {
        const backups = await this.getBackups();
        const creationByKey = new Map<string, string>();
        for (const b of backups.data) {
          if (!b.creationTime) continue;
          creationByKey.set(normalizeName(b.name), b.creationTime);
        }
        return rows.map((row) => {
          if (row.lastRun) return row;
          const key = normalizeName(row.name);
          const creation = creationByKey.get(key);
          if (!creation) return row;
          const result = (row.lastResult ?? "").trim().toLowerCase();
          if (result.length > 0 && result !== "unknown") {
            return { ...row, lastRun: creation };
          }
          return {
            ...row,
            lastRun: creation,
            lastResult: "Success",
            message: row.message ?? "Derived from backup creation time",
          };
        });
      } catch {
        return rows;
      }
    };
    try {
      const backups = await this.getBackups();
      const toResultText = (value: unknown): string | undefined => {
        if (typeof value === "string" && value.trim().length > 0) return value;
        if (isRecord(value) && typeof value.result === "string" && value.result.trim().length > 0) return value.result;
        return undefined;
      };
      const toMessageText = (container: Record<string, unknown>): string | undefined => {
        const direct = container.message ?? container.details;
        if (typeof direct === "string" && direct.trim().length > 0) return direct;
        const resultVal = container.result;
        if (isRecord(resultVal) && typeof resultVal.message === "string" && resultVal.message.trim().length > 0) {
          return resultVal.message;
        }
        return undefined;
      };
      type SessionSummary = { lastRun: string; lastResult: string; message?: string; timestamp: number };
      const toSessionSummary = (session: Record<string, unknown>): SessionSummary | null => {
        const lastRunVal = session.endTime ?? session.creationTime ?? session.startTime;
        if (typeof lastRunVal !== "string") return null;
        const timestamp = Date.parse(lastRunVal);
        if (Number.isNaN(timestamp)) return null;
        const lastResult = toResultText(session.result ?? session.state ?? session.status) ?? "Unknown";
        const message = toMessageText(session);
        return { lastRun: lastRunVal, lastResult, message, timestamp };
      };
      type SessionRecord = { name: string; summary: SessionSummary; sessionType: string; jobId?: string };
      const sessionByName = new Map<string, SessionSummary>();
      const sessionByJobId = new Map<string, SessionSummary>();
      const sessionRows: SessionRecord[] = [];
      const sessionsRaw = await this.getRaw("sessions?limit=5000");
      const sessions = extractDataArray(sessionsRaw) ?? [];
      for (const session of sessions) {
        if (!isRecord(session)) continue;
        const rawName = session.name;
        if (typeof rawName !== "string" || rawName.trim().length === 0) continue;
        const sessionTypeRaw = session.sessionType ?? session.type ?? session.jobType;
        const sessionType = typeof sessionTypeRaw === "string" ? sessionTypeRaw.toLowerCase() : "";
        if (sessionType.length > 0 && !sessionType.includes("backup")) continue;
        const summary = toSessionSummary(session);
        if (!summary) continue;
        const sessionJobIdRaw = session.jobId;
        const sessionJobId = typeof sessionJobIdRaw === "string" ? sessionJobIdRaw : undefined;
        sessionRows.push({ name: rawName, summary, sessionType, jobId: sessionJobId });
        if (sessionJobId) {
          const prev = sessionByJobId.get(sessionJobId);
          if (!prev || summary.timestamp > prev.timestamp) {
            sessionByJobId.set(sessionJobId, summary);
          }
        }
        const keys = [normalizeName(rawName)];
        if (rawName.includes("\\")) {
          for (const part of rawName.split("\\")) {
            const normalizedPart = normalizeName(part);
            if (normalizedPart.length > 0) keys.push(normalizedPart);
          }
        }
        for (const key of keys) {
          if (!key) continue;
          const prev = sessionByName.get(key);
          if (!prev || summary.timestamp > prev.timestamp) {
            sessionByName.set(key, summary);
          }
        }
      }
      const findRegexCopySession = (backupName: string, backupJobId?: string): SessionSummary | undefined => {
        const baseName = backupName.replace(/^vault[_\-\s]+/i, "").trim();
        const escapedBackup = escapeRegex(backupName.trim());
        const escapedBase = escapeRegex(baseName);
        const copyPattern = new RegExp(
          `^${escapedBackup}(?:\\\\${escapedBase.length > 0 ? escapedBase : "[A-Za-z0-9_\\-\\s]+"}(?:\\s*\\([^)]*\\))?)?$`,
          "i",
        );
        let best: SessionSummary | undefined;
        for (const row of sessionRows) {
          const isCopyLike = row.sessionType.includes("copy") || row.name.toLowerCase().includes("vault") || row.name.includes("\\");
          if (!isCopyLike) continue;
          if (!copyPattern.test(row.name)) continue;
          if (!best || row.summary.timestamp > best.timestamp) {
            best = row.summary;
          }
        }
        if (best) return best;
        if (backupJobId) return sessionByJobId.get(backupJobId);
        return undefined;
      };
      const mapped = backups.data
        .filter((b) => {
          const name = b.name.toLowerCase();
          const type = (b.type ?? "").toLowerCase();
          return name.includes("vault") || name.startsWith("vault_") || type.includes("copy");
        })
        .map((b): JobState | null => {
          const vaultKey = normalizeName(b.name);
          if (disabledBaseKeys.has(vaultKey)) {
            return null;
          }
          const fromSessionRaw = sessionByName.get(vaultKey);
          const fromRegex = findRegexCopySession(b.name, b.jobId);
          const creationTimestamp = b.creationTime ? Date.parse(b.creationTime) : Number.NaN;
          const fromSession =
            (fromRegex ?? fromSessionRaw) &&
            (Number.isNaN(creationTimestamp) || (fromRegex ?? fromSessionRaw)!.timestamp >= creationTimestamp)
              ? (fromRegex ?? fromSessionRaw)
              : undefined;
          const isZeroJobId = b.jobId === "00000000-0000-0000-0000-000000000000";
          if (!fromSession && isZeroJobId && !b.lastPointInTime) {
            return null;
          }
          const fallbackLastRun = b.lastPointInTime ?? b.creationTime;
          const lastRun = fromSession?.lastRun ?? fallbackLastRun;
          const hasConfirmedCopyRun = Boolean(fromSession?.lastRun) || Boolean(b.lastPointInTime);
          const lastResult = fromSession?.lastResult ?? (hasConfirmedCopyRun ? "Success" : "Unknown");
          const out: JobState = {
            name: b.name,
            lastResult,
            lastRun,
            type: b.type ?? "BackupCopy",
            workload: b.platform,
            message: fromSession?.message ?? (lastRun ? "Derived from backup history point" : "No backup copy session yet"),
          };
          return out;
        })
        .filter((v): v is JobState => v !== null);
      if (mapped.length > 0) {
        const byName = new Map<string, JobState>();
        for (const it of mapped) {
          const prev = byName.get(it.name);
          const prevT = prev?.lastRun ? Date.parse(prev.lastRun) : -Infinity;
          const nextT = it.lastRun ? Date.parse(it.lastRun) : -Infinity;
          if (!prev || nextT > prevT) {
            byName.set(it.name, it);
          }
        }
        return { data: Array.from(byName.values()) };
      }
    } catch {
      if (apiCopyCandidates.length > 0) return { data: await enrichWithBackupCreationTime(apiCopyCandidates) };
      if (jobsFallbackCandidates.length > 0) return { data: jobsFallbackCandidates };
      return { data: [] };
    }
    if (apiCopyCandidates.length > 0) return { data: await enrichWithBackupCreationTime(apiCopyCandidates) };
    if (jobsFallbackCandidates.length > 0) return { data: jobsFallbackCandidates };
    return { data: [] };
  }

  async getRepositoriesStates(): Promise<RepositoriesStatesResponse> {
    const r = await this.http.get<RepositoriesStatesResponse>("backupInfrastructure/repositories/states", {
      headers: await this.headers(),
    });
    return r.data;
  }

  async getSummary() {
    const [jobs, repos] = await Promise.all([this.getJobsStates(), this.getRepositoriesStates()]);
    const counts = jobs.data.reduce(
      (acc, j) => {
        const val = (j.lastResult || "").toLowerCase();
        acc.total += 1;
        if (val.includes("success")) acc.success += 1;
        else if (val.includes("warn")) acc.warning += 1;
        else if (val.includes("fail") || val.includes("error")) acc.failed += 1;
        return acc;
      },
      { total: 0, success: 0, warning: 0, failed: 0 },
    );
    const topRepo = repos.data
      .map((r) => {
        const cap = r.capacityGB ?? 0;
        const used = r.usedSpaceGB ?? 0;
        const pct = cap ? Math.round((used / cap) * 100) : 0;
        return { name: r.name, cap, used, pct };
      })
      .sort((a, b) => b.pct - a.pct)[0];
    return { counts, topRepo };
  }


  async getBackups(): Promise<BackupsResponse> {
    const headers = await this.headers();
    const paths = ["backups", "backupServer/backups"];
    for (const p of paths) {
      try {
        const r = await this.http.get<BackupsResponse>(p, { headers });
        if (r.status >= 200 && r.status < 300 && Array.isArray(r.data?.data)) {
          return r.data;
        }
      } catch {
        // try next
      }
    }
    return { data: [] };
  }

  private normalizeRestoreTest(input: unknown): RestoreTestLatestResponse {
    if (!input || typeof input !== "object") return { data: null };
    const container = "data" in input && typeof (input as { data: unknown }).data === "object" ? (input as { data: unknown }).data : input;
    if (!container || typeof container !== "object") return { data: null };
    const lastTestAtVal = (container as { lastTestAt?: unknown }).lastTestAt;
    const resultVal = (container as { result?: unknown }).result;
    const durationVal = (container as { durationMinutes?: unknown }).durationMinutes;
    const lastTestAt = typeof lastTestAtVal === "string" ? lastTestAtVal : null;
    const durationMinutes = typeof durationVal === "number" ? durationVal : null;
    const resultStr = typeof resultVal === "string" ? resultVal : "Unknown";
    const result: RestoreTestResult =
      resultStr === "Success" || resultStr === "Warning" || resultStr === "Failed" || resultStr === "Unknown" ? resultStr : "Unknown";
    if (!lastTestAt && !durationMinutes && result === "Unknown") return { data: null };
    return { data: { lastTestAt, result, durationMinutes } };
  }

  private normalizeSureBackupStatus(input: unknown): SureBackupStatusResponse {
    if (!input || typeof input !== "object") return { data: null };
    const container = "data" in input && typeof (input as { data: unknown }).data === "object" ? (input as { data: unknown }).data : input;
    if (!container || typeof container !== "object") return { data: null };
    const enabledVal = (container as { enabled?: unknown }).enabled;
    const lastCheckVal = (container as { lastCheckAt?: unknown }).lastCheckAt;
    if (typeof enabledVal !== "boolean") return { data: null };
    const lastCheckAt = typeof lastCheckVal === "string" ? lastCheckVal : null;
    return { data: { enabled: enabledVal, lastCheckAt } };
  }

  async getRestoreTestLatest(): Promise<RestoreTestLatestResponse> {
    const path = this.config.restoreTestsPath;
    if (!path) return { data: null };
    const r = await this.http.get<unknown>(path, { headers: await this.headers() });
    return this.normalizeRestoreTest(r.data);
  }

  async getSureBackupStatus(): Promise<SureBackupStatusResponse> {
    const path = this.config.sureBackupStatusPath;
    if (!path) return { data: null };
    const r = await this.http.get<unknown>(path, { headers: await this.headers() });
    return this.normalizeSureBackupStatus(r.data);
  }
}
