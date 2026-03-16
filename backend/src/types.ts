export interface JobState {
  name: string;
  lastResult: string;
  lastRun?: string;
  message?: string;
  type?: string;
  workload?: string;
  status?: string;
  id?: string;
  description?: string;
}

export interface JobsStatesResponse {
  data: JobState[];
}

export interface RepositoryState {
  name: string;
  path?: string;
  capacityGB?: number;
  freeGB?: number;
  usedSpaceGB?: number;
}

export interface RepositoriesStatesResponse {
  data: RepositoryState[];
}

export interface VMState {
  name: string;
  jobName: string;
  lastRun?: string;
  lastResult: string;
}

export interface VMsStatesResponse {
  data: VMState[];
}

export interface VMProtection {
  name: string;
  primaryLastRun?: string;
  primaryResult?: string;
  copyLastRun?: string;
  copyResult?: string;
}

export interface VMProtectionResponse {
  data: VMProtection[];
}

export interface BackupItem {
  id: string;
  name: string;
  jobId?: string;
  platform?: string;
  type?: string;
  repositoryId?: string;
  repositoryName?: string;
  lastPointInTime?: string;
  creationTime?: string;
}

export interface BackupsResponse {
  data: BackupItem[];
}

export type RestoreTestResult = "Success" | "Warning" | "Failed" | "Unknown";

export interface RestoreTestLatest {
  lastTestAt: string | null;
  result: RestoreTestResult;
  durationMinutes: number | null;
}

export interface RestoreTestLatestResponse {
  data: RestoreTestLatest | null;
}

export interface SureBackupStatus {
  enabled: boolean;
  lastCheckAt: string | null;
}

export interface SureBackupStatusResponse {
  data: SureBackupStatus | null;
}

export interface DockerRestartItem {
  name: string;
  restarts: number;
  status: string;
}

export interface DockerHealthItem {
  name: string;
  health: "Healthy" | "Unhealthy" | "No Healthcheck";
  lastCheck: string;
}

export interface DockerStackItem {
  name: string;
  total: number;
  running: number;
  failed: number;
  unhealthy: number;
}

export interface DockerTopMemoryItem {
  name: string;
  usageGB: number;
}

export interface DockerRiskFactor {
  label: string;
  status: string;
  ok: boolean;
}

export interface DockerOverview {
  lastSync: string;
  total: number;
  running: number;
  unhealthy: number;
  restarting: number;
  stopped: number;
  noHealthcheck: number;
  criticalDown: boolean;
  restartData: DockerRestartItem[];
  healthData: DockerHealthItem[];
  stacks: DockerStackItem[];
  topMemory: DockerTopMemoryItem[];
  cpuPct: number;
  memPct: number;
  riskScore: number;
  riskFactors: DockerRiskFactor[];
}

export interface DockerOverviewResponse {
  data: DockerOverview;
}
