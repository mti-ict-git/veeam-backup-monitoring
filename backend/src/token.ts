import axios, { AxiosInstance } from "axios";
import https from "node:https";
import { loadConfig } from "./config";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export class TokenManager {
  private config = loadConfig();
  private client: AxiosInstance;
  private token: string | null = null;
  private expiry: number = 0;

  constructor() {
    const agent = this.config.insecureTls ? new https.Agent({ rejectUnauthorized: false }) : undefined;
    this.client = axios.create({ httpsAgent: agent });
  }

  private expired(): boolean {
    const now = Math.floor(Date.now() / 1000);
    return !this.token || now >= this.expiry - 60;
  }

  async getToken(): Promise<string> {
    if (!this.expired()) return this.token as string;
    const form = new URLSearchParams();
    form.set("grant_type", "password");
    form.set("username", this.config.veeamUsername);
    form.set("password", this.config.veeamPassword);
    const r = await this.client.post<TokenResponse>(this.config.veeamTokenUrl, form, {
      headers: {
        accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "x-api-version": this.config.veeamApiVersion,
      },
    });
    this.token = r.data.access_token;
    const now = Math.floor(Date.now() / 1000);
    this.expiry = now + (r.data.expires_in || 3600);
    return this.token;
  }
}
