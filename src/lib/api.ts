export type JobState = {
  name: string;
  lastResult: string;
  lastRun?: string;
  message?: string;
  type?: string;
  workload?: string;
  status?: string;
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

export async function fetchCopyJobsStates(signal?: AbortSignal): Promise<JobsStatesResponse> {
  const r = await fetch(`${API_BASE}/api/veeam/jobs/copy/states`, { signal });
  if (!r.ok) {
    // Tolerate 404/502 gracefully for environments without copy jobs
    return { data: [] };
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

export type VMState = {
  name: string;
  jobName: string;
  lastRun?: string;
  lastResult: string;
};

export type VMsStatesResponse = {
  data: VMState[];
};

export async function fetchVMsStates(signal?: AbortSignal): Promise<VMsStatesResponse> {
  const r = await fetch(`${API_BASE}/api/veeam/vms/states`, { signal });
  if (!r.ok) {
    throw new Error(`Failed to fetch vms states: ${r.status}`);
  }
  return r.json() as Promise<VMsStatesResponse>;
}

export type VMProtection = {
  name: string;
  primaryLastRun?: string;
  primaryResult?: string;
  copyLastRun?: string;
  copyResult?: string;
};

export type VMProtectionResponse = {
  data: VMProtection[];
};

export async function fetchVMProtection(signal?: AbortSignal): Promise<VMProtectionResponse> {
  const r = await fetch(`${API_BASE}/api/veeam/vms/protection`, { signal });
  if (!r.ok) {
    throw new Error(`Failed to fetch vm protection: ${r.status}`);
  }
  return r.json() as Promise<VMProtectionResponse>;
}
