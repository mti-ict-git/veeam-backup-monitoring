import { describe, it, expect } from "vitest";
import type { JobState } from "@/lib/api";
import { countResults, computeCompliance, computeOverallStatus, computeRiskScore } from "./metrics";

function makeJob(lastResult: string, lastRun?: string): JobState {
  return { name: "j", lastResult, lastRun };
}

describe("metrics", () => {
  const now = new Date("2026-02-22T12:00:00Z");

  it("counts results with time window when available", () => {
    const jobs: JobState[] = [
      makeJob("Success", "2026-02-22T11:00:00Z"),
      makeJob("Warning", "2026-02-22T10:00:00Z"),
      makeJob("Failed", "2026-02-20T10:00:00Z"),
      makeJob("Running", "2026-02-22T11:30:00Z"),
    ];
    const c = countResults(jobs, now, 24);
    expect(c.success).toBe(1);
    expect(c.warning).toBe(1);
    expect(c.failed).toBe(0);
    expect(c.running).toBe(1);
    expect(c.denom).toBe(2);
  });

  it("falls back to all jobs when time not available", () => {
    const jobs: JobState[] = [makeJob("Success"), makeJob("Warning"), makeJob("Failed")];
    const c = countResults(jobs, now, 24);
    expect(c.success).toBe(1);
    expect(c.warning).toBe(1);
    expect(c.failed).toBe(1);
    expect(c.denom).toBe(3);
  });

  it("computes compliance", () => {
    expect(
      computeCompliance({
        success: 8,
        warning: 1,
        failed: 1,
        running: 0,
        considered: 10,
        denom: 10,
      }),
    ).toBeCloseTo(0.8);
    expect(
      computeCompliance({ success: 0, warning: 0, failed: 0, running: 0, considered: 0, denom: 0 }),
    ).toBeCloseTo(1);
  });

  it("computes overall status", () => {
    expect(
      computeOverallStatus({ success: 0, warning: 0, failed: 1, running: 0, considered: 1, denom: 1 }),
    ).toBe("CRITICAL");
    expect(
      computeOverallStatus({ success: 1, warning: 1, failed: 0, running: 0, considered: 2, denom: 2 }),
    ).toBe("WARNING");
    expect(
      computeOverallStatus({ success: 2, warning: 0, failed: 0, running: 0, considered: 2, denom: 2 }),
    ).toBe("HEALTHY");
  });

  it("computes risk score bounded in 0..100", () => {
    const { score: s1 } = computeRiskScore({ success: 10, warning: 0, failed: 0, running: 0, considered: 10, denom: 10 });
    expect(s1).toBe(0);
    const { score: s2 } = computeRiskScore({ success: 0, warning: 0, failed: 10, running: 0, considered: 10, denom: 10 });
    expect(s2).toBeGreaterThan(0);
    expect(s2).toBeLessThanOrEqual(100);
  });
});
