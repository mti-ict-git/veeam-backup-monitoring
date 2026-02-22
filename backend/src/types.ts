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
  platform?: string;
  type?: string;
  repositoryId?: string;
  repositoryName?: string;
  lastPointInTime?: string;
}

export interface BackupsResponse {
  data: BackupItem[];
}
