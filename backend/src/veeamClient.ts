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

  async getJobsStates(): Promise<JobsStatesResponse> {
    const r = await this.http.get<JobsStatesResponse>("jobs/states", { headers: await this.headers() });
    return r.data;
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

    for (const apiVersion of candidateApiVersions) {
      const headers = { ...baseHeaders, "x-api-version": apiVersion };
      for (const p of paths) {
        try {
          const r = await this.http.get<unknown>(p, { headers });
          if (r.status >= 200 && r.status < 300) {
            const arr = extractDataArray(r.data);
            if (!arr) continue;
            const normalized = arr.map(toJobState).filter((v): v is JobState => v !== null);
            const filtered = normalized.filter(looksLikeCopy);
            if (filtered.length > 0) {
              const byName = new Map<string, JobState>();
              for (const it of filtered) {
                const prev = byName.get(it.name);
                const prevT = prev?.lastRun ? Date.parse(prev.lastRun) : -Infinity;
                const nextT = it.lastRun ? Date.parse(it.lastRun) : -Infinity;
                if (!prev || nextT > prevT) {
                  byName.set(it.name, it);
                }
              }
              return { data: Array.from(byName.values()) };
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
        return { data: fallback };
      }
    } catch {
      // ignore
    }
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
