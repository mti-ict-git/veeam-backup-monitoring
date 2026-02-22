import { useQuery } from "@tanstack/react-query";
import { fetchJobsStates, type JobState } from "@/lib/api";
import { criticalVms } from "@/config/criticalVms";
import type { CriticalVMConfig } from "@/config/criticalVms";
import { format } from "date-fns";

function parseDate(d?: string): Date | undefined {
  if (!d) return undefined;
  const t = Date.parse(d);
  if (Number.isNaN(t)) return undefined;
  return new Date(t);
}

function hoursDiff(a: Date, b: Date): number {
  const ms = Math.abs(a.getTime() - b.getTime());
  return ms / (1000 * 60 * 60);
}

function isFail(res?: string): boolean {
  const r = (res ?? "").toLowerCase();
  return r.includes("fail") || r.includes("error");
}

function findMatchedJob(jobs: JobState[], cfg: CriticalVMConfig): JobState | undefined {
  const exact = jobs.find((j) => j.name === cfg.jobName) ?? jobs.find((j) => j.name.toLowerCase() === cfg.jobName.toLowerCase());
  if (exact) return exact;
  const tokens = (cfg.matchIncludes ?? []).map((t) => t.toLowerCase());
  const candidates = tokens.length
    ? jobs.filter((j) => {
        const n = j.name.toLowerCase();
        return tokens.some((t) => n.includes(t));
      })
    : [];
  if (candidates.length === 0) return undefined;
  const withDates = candidates
    .map((j) => ({ j, dt: parseDate(j.lastRun) }))
    .sort((a, b) => {
      const at = a.dt ? a.dt.getTime() : -Infinity;
      const bt = b.dt ? b.dt.getTime() : -Infinity;
      return bt - at;
    });
  return withDates[0]?.j ?? candidates[0];
}

const CriticalVMTable = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["jobs-states"],
    queryFn: ({ signal }) => fetchJobsStates(signal),
  });
  const now = new Date();
  const jobs = data?.data ?? [];
  const rows = criticalVms.map((vm) => {
    const job = findMatchedJob(jobs, vm);
    const dt = parseDate(job?.lastRun);
    const lastBackup = dt ? format(dt, "yyyy-MM-dd HH:mm") : "—";
    const withinRpo = dt ? hoursDiff(now, dt) <= vm.rpoHours : false;
    const failed = isFail(job?.lastResult);
    const ok = withinRpo && !failed;
    const rpo = withinRpo ? "Compliant" : "Breach";
    return { name: vm.name, env: vm.env, lastBackup, rpo, ok };
  });
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-3">Critical Infrastructure Protection</h2>
      {isError ? (
        <div className="text-sm text-critical">Failed to load jobs</div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy text-primary-foreground">
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">VM Name</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Environment</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Last Backup</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">RPO Status</th>
                <th className="text-center px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {(isLoading ? criticalVms.map((c) => ({ name: c.name, env: c.env, lastBackup: "…", rpo: "…", ok: true })) : rows).map(
                (vm, i) => (
                  <tr
                    key={vm.name}
                    className={`${!vm.ok ? "bg-critical-muted" : i % 2 === 0 ? "bg-card" : "bg-muted/40"} border-t border-border`}
                  >
                    <td className="px-4 py-2.5 font-medium text-foreground">{vm.name}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          vm.env === "Production" ? "bg-navy/10 text-navy" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {vm.env}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{vm.lastBackup}</td>
                    <td className="px-4 py-2.5">
                      <span className={`font-semibold text-xs ${vm.ok ? "text-success" : "text-critical"}`}>{vm.rpo}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${vm.ok ? "bg-success" : "bg-critical animate-pulse-slow"}`}
                      />
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CriticalVMTable;
