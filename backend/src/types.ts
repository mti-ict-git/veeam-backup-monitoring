export interface JobState {
  name: string;
  lastResult: string;
  lastRun?: string;
  message?: string;
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
