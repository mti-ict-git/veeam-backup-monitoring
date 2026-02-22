export interface Config {
  veeamBaseUrl: string;
  veeamTokenUrl: string;
  veeamUsername: string;
  veeamPassword: string;
  veeamApiVersion: string;
  insecureTls: boolean;
  port: number;
  corsOrigin: string | undefined;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env ${name}`);
  }
  return v;
}

export function loadConfig(): Config {
  const veeamHost = process.env.VEEAM_HOST;
  const baseUrl = process.env.VEEAM_BASE_URL ?? (veeamHost ? `https://${veeamHost}/api/v1/` : "");
  const tokenUrl = process.env.VEEAM_TOKEN_URL ?? (veeamHost ? `https://${veeamHost}/api/oauth2/token` : "");
  return {
    veeamBaseUrl: baseUrl || requireEnv("VEEAM_BASE_URL"),
    veeamTokenUrl: tokenUrl || requireEnv("VEEAM_TOKEN_URL"),
    veeamUsername: requireEnv("VEEAM_USERNAME"),
    veeamPassword: requireEnv("VEEAM_PASSWORD"),
    veeamApiVersion: process.env.VEEAM_API_VERSION ?? "1.1-rev1",
    insecureTls: (process.env.VEEAM_INSECURE_TLS ?? "false").toLowerCase() === "true",
    port: Number(process.env.PORT ?? 4000),
    corsOrigin: process.env.CORS_ORIGIN,
  };
}
