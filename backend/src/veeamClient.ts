import axios, { AxiosInstance } from "axios";
import https from "node:https";
import { loadConfig } from "./config";
import { JobsStatesResponse, RepositoriesStatesResponse, BackupsResponse } from "./types";
import { TokenManager } from "./token";

export class VeeamClient {
  private config = loadConfig();
  private http: AxiosInstance;
  private tokens: TokenManager;

  constructor(tokens: TokenManager) {
    const agent = this.config.insecureTls ? new https.Agent({ rejectUnauthorized: false }) : undefined;
    this.http = axios.create({
      baseURL: this.config.veeamBaseUrl,
      httpsAgent: agent,
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

  async getBackupCopyJobsStates(): Promise<JobsStatesResponse> {
    const headers = await this.headers();
    const paths = [
      "backupCopyJobs/states",
      "immediateBackupCopyJobs/states",
      "jobs/states?type=BackupCopy",
      "jobs/states?jobType=BackupCopy",
    ];
    for (const p of paths) {
      try {
        const r = await this.http.get<JobsStatesResponse>(p, { headers });
        if (r.status >= 200 && r.status < 300 && Array.isArray(r.data?.data)) {
          return r.data;
        }
      } catch {
        // try next path
      }
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
}
