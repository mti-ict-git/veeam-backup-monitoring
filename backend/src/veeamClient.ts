import axios, { AxiosInstance } from "axios";
import https from "node:https";
import { loadConfig } from "./config";
import { JobsStatesResponse, RepositoriesStatesResponse } from "./types";
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

  async getRepositoriesStates(): Promise<RepositoriesStatesResponse> {
    const r = await this.http.get<RepositoriesStatesResponse>("backupInfrastructure/repositories/states", {
      headers: await this.headers(),
    });
    return r.data;
  }
}
