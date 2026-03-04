import { useQuery } from "@tanstack/react-query";
import { fetchCopyJobsStates, type JobState } from "@/lib/api";

function parseDate(d?: string): Date | undefined {
  if (!d) return undefined;
  const t = Date.parse(d);
  if (Number.isNaN(t)) return undefined;
  return new Date(t);
}

function formatWitaDateTime(d: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function statusKind(lastResult?: string): "success" | "warning" | "critical" | "unknown" {
  const r = (lastResult ?? "").toLowerCase();
  if (r.includes("success")) return "success";
  if (r.includes("warn")) return "warning";
  if (r.includes("fail") || r.includes("error")) return "critical";
  return "unknown";
}

const BackupCopyJobsTable = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["jobs-copy-states"],
    queryFn: ({ signal }) => fetchCopyJobsStates(signal),
  });

  const items: JobState[] = data?.data ?? [];

  type Row = JobState & { lastRunText: string; kind: "success" | "warning" | "critical" | "unknown" };
  const rows: Row[] = items
    .map((j): Row => {
      const dt = parseDate(j.lastRun);
      const lastRun = dt ? formatWitaDateTime(dt) : "—";
      const kind = statusKind(j.lastResult);
      return { ...j, lastRunText: lastRun, kind };
    })
    .sort((a, b) => {
      const ta = a.lastRun ? Date.parse(a.lastRun) : -Infinity;
      const tb = b.lastRun ? Date.parse(b.lastRun) : -Infinity;
      return tb - ta;
    });

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-3">Backup Copy Status</h2>
      {isError ? (
        <div className="text-sm text-critical">Failed to load backup copy jobs</div>
      ) : items.length === 0 && !isLoading ? (
        <div className="text-sm text-muted-foreground">No backup copy job data returned by the Veeam API.</div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy text-primary-foreground">
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Job</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Last Run</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Result</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Message</th>
                <th className="text-center px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {(isLoading
                ? Array.from({ length: 6 }).map(
                    (_, i): Row => ({ name: `Backup Copy Job ${i + 1}`, lastRunText: "…", lastResult: "…", message: "…", kind: "unknown" }),
                  )
                : rows
              ).map(
                (j, i) => {
                  const dot =
                    j.kind === "success"
                      ? "bg-success"
                      : j.kind === "warning"
                        ? "bg-warning"
                        : j.kind === "critical"
                          ? "bg-critical animate-pulse-slow"
                          : "bg-muted-foreground/50";
                  const rowBg = j.kind === "critical" ? "bg-critical-muted" : i % 2 === 0 ? "bg-card" : "bg-muted/40";
                  return (
                    <tr key={j.name} className={`${rowBg} border-t border-border`}>
                      <td className="px-4 py-2.5 font-medium text-foreground">{j.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{j.lastRunText}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{j.lastResult || "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{j.message || "—"}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-block w-3 h-3 rounded-full ${dot}`} />
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BackupCopyJobsTable;
