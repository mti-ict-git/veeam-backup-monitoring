import type { JobState } from "@/lib/api";

export type ResultClass = "success" | "warning" | "failed" | "running" | "other";

export type WindowCounts = {
  success: number;
  warning: number;
  failed: number;
  running: number;
  considered: number;
  denom: number;
};

export type OverallStatus = "HEALTHY" | "WARNING" | "CRITICAL";

function classifyResult(res: string | undefined): ResultClass {
  const r = (res ?? "").toLowerCase();
  if (r.includes("success")) return "success";
  if (r.includes("warn")) return "warning";
  if (r.includes("fail") || r.includes("error")) return "failed";
  if (r.includes("running")) return "running";
  return "other";
}

function parseDate(d?: string): Date | undefined {
  if (!d) return undefined;
  const t = Date.parse(d);
  if (Number.isNaN(t)) return undefined;
  return new Date(t);
}

function withinHours(dt: Date, now: Date, hours: number): boolean {
  const deltaMs = now.getTime() - dt.getTime();
  return deltaMs >= 0 && deltaMs <= hours * 60 * 60 * 1000;
}

export function getWindowSubset(jobs: JobState[], now: Date, hours: number): { subset: JobState[]; usedTimeWindow: boolean } {
  let hasAnyTime = false;
  for (const j of jobs) {
    if (parseDate(j.lastRun)) {
      hasAnyTime = true;
      break;
    }
  }
  if (!hasAnyTime) {
    return { subset: jobs, usedTimeWindow: false };
  }
  const subset = jobs.filter((j) => {
    const dt = parseDate(j.lastRun);
    return dt ? withinHours(dt, now, hours) : false;
  });
  return { subset, usedTimeWindow: true };
}

export function countResults(jobs: JobState[], now: Date, hours = 24): WindowCounts {
  const { subset, usedTimeWindow } = getWindowSubset(jobs, now, hours);
  const base = usedTimeWindow ? subset : jobs;
  let success = 0;
  let warning = 0;
  let failed = 0;
  let running = 0;
  for (const j of base) {
    const c = classifyResult(j.lastResult);
    if (c === "success") success += 1;
    else if (c === "warning") warning += 1;
    else if (c === "failed") failed += 1;
    else if (c === "running") running += 1;
  }
  const denom = success + warning + failed;
  return { success, warning, failed, running, considered: base.length, denom };
}

export function computeCompliance(counts: WindowCounts): number {
  const { success, denom } = counts;
  if (denom === 0) return 1;
  return success / denom;
}

export function computeOverallStatus(counts: WindowCounts): OverallStatus {
  if (counts.failed > 0) return "CRITICAL";
  if (counts.warning > 0) return "WARNING";
  return "HEALTHY";
}

export function computeRiskScore(counts: WindowCounts): { score: number; breakdown: { compliance: number; failDensity: number; warnDensity: number } } {
  const compliance = computeCompliance(counts);
  const denom = counts.denom === 0 ? 1 : counts.denom;
  const failDensity = counts.failed / denom;
  const warnDensity = counts.warning / denom;
  const raw = (1 - compliance) * 70 + failDensity * 20 + warnDensity * 10;
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  return { score, breakdown: { compliance, failDensity, warnDensity } };
}

export function formatPercent(v: number, fractionDigits = 1): string {
  return `${(v * 100).toFixed(fractionDigits)}%`;
}

