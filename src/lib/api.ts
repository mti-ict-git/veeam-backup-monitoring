export type JobState = {
  name: string;
  lastResult: string;
  lastRun?: string;
  message?: string;
};

export type JobsStatesResponse = {
  data: JobState[];
};

export type RepositoryState = {
  name: string;
  path?: string;
  capacityGB?: number;
  freeGB?: number;
  usedSpaceGB?: number;
};

export type RepositoriesStatesResponse = {
  data: RepositoryState[];
};

const API_BASE = "";

export async function fetchJobsStates(signal?: AbortSignal): Promise<JobsStatesResponse> {
  const r = await fetch(`${API_BASE}/api/veeam/jobs/states`, { signal });
  if (!r.ok) {
    throw new Error(`Failed to fetch jobs states: ${r.status}`);
  }
  return r.json() as Promise<JobsStatesResponse>;
}

export async function fetchRepositoriesStates(signal?: AbortSignal): Promise<RepositoriesStatesResponse> {
  const r = await fetch(`${API_BASE}/api/veeam/repositories/states`, { signal });
  if (!r.ok) {
    throw new Error(`Failed to fetch repositories states: ${r.status}`);
  }
  return r.json() as Promise<RepositoriesStatesResponse>;
}
