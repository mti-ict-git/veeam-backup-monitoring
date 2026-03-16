import axios, { AxiosInstance } from "axios";
import {
  DockerHealthItem,
  DockerOverview,
  DockerOverviewResponse,
  DockerRestartItem,
  DockerRiskFactor,
  DockerStackItem,
  DockerTopMemoryItem,
} from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

type ContainerItem = {
  id: string;
  name: string;
  status: string;
  state: string;
  stack: string;
};

type ContainerInspect = {
  restartCount: number;
  health: "Healthy" | "Unhealthy" | "No Healthcheck";
  lastCheck: string;
  running: boolean;
};

type ContainerStats = {
  cpuPercent: number;
  memoryUsage: number;
  memoryLimit: number;
};

export class PortainerClient {
  private http: AxiosInstance;
  private username: string;
  private password: string;
  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(baseUrl: string, username: string, password: string) {
    this.http = axios.create({
      baseURL: baseUrl,
      timeout: 20000,
    });
    this.username = username;
    this.password = password;
  }

  private async token(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedToken;
    }
    const authResp = await this.http.post<unknown>("/api/auth", {
      username: this.username,
      password: this.password,
    });
    if (!isRecord(authResp.data)) {
      throw new Error("Invalid auth response from Portainer");
    }
    const jwt = asString(authResp.data.jwt);
    if (!jwt) {
      throw new Error("Missing JWT from Portainer auth");
    }
    this.cachedToken = jwt;
    this.tokenExpiresAt = Date.now() + 5 * 60 * 1000;
    return jwt;
  }

  private async get<T = unknown>(path: string): Promise<T> {
    const jwt = await this.token();
    const resp = await this.http.get<T>(path, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return resp.data;
  }

  private async endpointId(): Promise<number> {
    const data = await this.get<unknown>("/api/endpoints");
    const rows = asArray(data);
    const first = rows.find((row) => {
      if (!isRecord(row)) return false;
      const id = asNumber(row.Id);
      return typeof id === "number";
    });
    if (!first || !isRecord(first)) {
      throw new Error("No Portainer endpoint found");
    }
    const id = asNumber(first.Id);
    if (typeof id !== "number") {
      throw new Error("Invalid endpoint id");
    }
    return id;
  }

  private async listContainers(endpointId: number): Promise<ContainerItem[]> {
    const data = await this.get<unknown>(`/api/endpoints/${endpointId}/docker/containers/json?all=1`);
    const rows = asArray(data);
    const out: ContainerItem[] = [];
    for (const row of rows) {
      if (!isRecord(row)) continue;
      const id = asString(row.Id);
      if (!id) continue;
      const namesRaw = asArray(row.Names);
      const firstNameRaw = namesRaw.length > 0 ? asString(namesRaw[0]) : undefined;
      const name = (firstNameRaw ?? id).replace(/^\//, "");
      const status = asString(row.Status) ?? "";
      const state = asString(row.State) ?? "";
      const labels = isRecord(row.Labels) ? row.Labels : {};
      const composeStack = asString(labels["com.docker.compose.project"]);
      const dockerStack = asString(labels["com.docker.stack.namespace"]);
      const stack = composeStack ?? dockerStack ?? "ungrouped";
      out.push({ id, name, status, state, stack });
    }
    return out;
  }

  private async inspectContainer(endpointId: number, containerId: string): Promise<ContainerInspect> {
    const payload = await this.get<unknown>(`/api/endpoints/${endpointId}/docker/containers/${containerId}/json`);
    const rec = isRecord(payload) ? payload : {};
    const stateRec = isRecord(rec.State) ? rec.State : {};
    const restartCount = asNumber(stateRec.RestartCount) ?? 0;
    const running = asBoolean(stateRec.Running) ?? false;
    const healthRec = isRecord(stateRec.Health) ? stateRec.Health : null;
    const healthStatusRaw = healthRec ? asString(healthRec.Status) : undefined;
    const health: "Healthy" | "Unhealthy" | "No Healthcheck" =
      healthStatusRaw === "healthy" ? "Healthy" : healthStatusRaw === "unhealthy" ? "Unhealthy" : "No Healthcheck";
    let lastCheck = "—";
    if (healthRec) {
      const logs = asArray(healthRec.Log);
      const latest = logs.length > 0 ? logs[logs.length - 1] : undefined;
      if (isRecord(latest)) {
        const end = asString(latest.End);
        if (end) {
          const dt = new Date(end);
          if (!Number.isNaN(dt.getTime())) {
            lastCheck = dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
          }
        }
      }
    }
    return { restartCount, health, lastCheck, running };
  }

  private async statsContainer(endpointId: number, containerId: string): Promise<ContainerStats> {
    const payload = await this.get<unknown>(`/api/endpoints/${endpointId}/docker/containers/${containerId}/stats?stream=false`);
    const rec = isRecord(payload) ? payload : {};
    const cpuStats = isRecord(rec.cpu_stats) ? rec.cpu_stats : {};
    const preCpuStats = isRecord(rec.precpu_stats) ? rec.precpu_stats : {};
    const cpuUsage = isRecord(cpuStats.cpu_usage) ? cpuStats.cpu_usage : {};
    const preCpuUsage = isRecord(preCpuStats.cpu_usage) ? preCpuStats.cpu_usage : {};
    const totalUsage = asNumber(cpuUsage.total_usage) ?? 0;
    const preTotalUsage = asNumber(preCpuUsage.total_usage) ?? 0;
    const systemCpu = asNumber(cpuStats.system_cpu_usage) ?? 0;
    const preSystemCpu = asNumber(preCpuStats.system_cpu_usage) ?? 0;
    const onlineCpus = asNumber(cpuStats.online_cpus) ?? 1;
    const cpuDelta = totalUsage - preTotalUsage;
    const systemDelta = systemCpu - preSystemCpu;
    const cpuPercent = cpuDelta > 0 && systemDelta > 0 ? (cpuDelta / systemDelta) * onlineCpus * 100 : 0;
    const memStats = isRecord(rec.memory_stats) ? rec.memory_stats : {};
    const memoryUsage = asNumber(memStats.usage) ?? 0;
    const memoryLimit = asNumber(memStats.limit) ?? 0;
    return { cpuPercent, memoryUsage, memoryLimit };
  }

  async getOverview(): Promise<DockerOverviewResponse> {
    const endpointId = await this.endpointId();
    const containers = await this.listContainers(endpointId);
    const inspectEntries = await Promise.all(
      containers.map(async (container) => ({
        id: container.id,
        inspect: await this.inspectContainer(endpointId, container.id).catch(() => ({
          restartCount: 0,
          health: "No Healthcheck" as const,
          lastCheck: "—",
          running: container.state === "running",
        })),
      })),
    );
    const statsEntries = await Promise.all(
      containers.map(async (container) => ({
        id: container.id,
        stats: await this.statsContainer(endpointId, container.id).catch(() => ({
          cpuPercent: 0,
          memoryUsage: 0,
          memoryLimit: 0,
        })),
      })),
    );
    const inspectMap = new Map<string, ContainerInspect>(inspectEntries.map((entry) => [entry.id, entry.inspect]));
    const statsMap = new Map<string, ContainerStats>(statsEntries.map((entry) => [entry.id, entry.stats]));

    let total = 0;
    let running = 0;
    let unhealthy = 0;
    let restarting = 0;
    let stopped = 0;
    let noHealthcheck = 0;
    let totalCpuPercent = 0;
    let totalMemUsage = 0;
    let totalMemLimit = 0;

    const restartData: DockerRestartItem[] = [];
    const healthData: DockerHealthItem[] = [];
    const stackMap = new Map<string, DockerStackItem>();
    const topMemoryRaw: { name: string; usageBytes: number }[] = [];

    for (const container of containers) {
      total += 1;
      const inspect = inspectMap.get(container.id);
      const stats = statsMap.get(container.id);
      const isRunning = inspect?.running ?? container.state === "running";
      if (isRunning) running += 1;
      const stateLower = container.state.toLowerCase();
      if (stateLower.includes("restart")) restarting += 1;
      if (!isRunning) stopped += 1;
      if ((inspect?.health ?? "No Healthcheck") === "Unhealthy") unhealthy += 1;
      if ((inspect?.health ?? "No Healthcheck") === "No Healthcheck") noHealthcheck += 1;

      const restartCount = inspect?.restartCount ?? 0;
      restartData.push({
        name: container.name,
        restarts: restartCount,
        status: isRunning ? "Running" : container.state || "Stopped",
      });
      healthData.push({
        name: container.name,
        health: inspect?.health ?? "No Healthcheck",
        lastCheck: inspect?.lastCheck ?? "—",
      });

      const currentStack = stackMap.get(container.stack) ?? {
        name: container.stack,
        total: 0,
        running: 0,
        failed: 0,
        unhealthy: 0,
      };
      currentStack.total += 1;
      if (isRunning) currentStack.running += 1;
      const containerHealth = inspect?.health ?? "No Healthcheck";
      if (!isRunning) currentStack.failed += 1;
      if (containerHealth === "Unhealthy") currentStack.unhealthy += 1;
      stackMap.set(container.stack, currentStack);

      const cpuPercent = stats?.cpuPercent ?? 0;
      const memUsage = stats?.memoryUsage ?? 0;
      const memLimit = stats?.memoryLimit ?? 0;
      totalCpuPercent += cpuPercent;
      totalMemUsage += memUsage;
      totalMemLimit += memLimit;
      topMemoryRaw.push({ name: container.name, usageBytes: memUsage });
    }

    const cpuPct = total > 0 ? Math.max(0, Math.min(100, Math.round(totalCpuPercent / total))) : 0;
    const memPct = totalMemLimit > 0 ? Math.max(0, Math.min(100, Math.round((totalMemUsage / totalMemLimit) * 100))) : 0;

    const topMemory: DockerTopMemoryItem[] = topMemoryRaw
      .sort((a, b) => b.usageBytes - a.usageBytes)
      .slice(0, 5)
      .map((entry) => ({
        name: entry.name,
        usageGB: Number((entry.usageBytes / (1024 * 1024 * 1024)).toFixed(2)),
      }));

    const sortedRestart = restartData.sort((a, b) => b.restarts - a.restarts).slice(0, 8);
    const sortedHealth = healthData.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 12);
    const stacks = Array.from(stackMap.values()).sort((a, b) => b.failed - a.failed || b.unhealthy - a.unhealthy || b.total - a.total);

    const riskScoreRaw = unhealthy * 20 + restarting * 8 + stopped * 10 + noHealthcheck * 3 + (memPct > 70 ? 10 : 0) + (cpuPct > 75 ? 10 : 0);
    const riskScore = Math.max(0, Math.min(100, riskScoreRaw));
    const riskFactors: DockerRiskFactor[] = [
      { label: "Unhealthy Containers", status: `${unhealthy} detected`, ok: unhealthy === 0 },
      { label: "Restart Anomaly", status: restarting > 0 ? `${restarting} restarting` : "Normal", ok: restarting === 0 },
      { label: "Critical Stopped", status: `${stopped} stopped`, ok: stopped === 0 },
      { label: "Resource Usage", status: `CPU ${cpuPct}% / MEM ${memPct}%`, ok: cpuPct <= 75 && memPct <= 80 },
      { label: "Missing Healthcheck", status: `${noHealthcheck} containers`, ok: noHealthcheck === 0 },
    ];

    const data: DockerOverview = {
      lastSync: new Date().toISOString(),
      total,
      running,
      unhealthy,
      restarting,
      stopped,
      noHealthcheck,
      criticalDown: stopped > 2,
      restartData: sortedRestart,
      healthData: sortedHealth,
      stacks,
      topMemory,
      cpuPct,
      memPct,
      riskScore,
      riskFactors,
    };

    return { data };
  }
}
