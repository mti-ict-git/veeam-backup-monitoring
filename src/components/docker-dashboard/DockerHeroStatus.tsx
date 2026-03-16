import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Activity, AlertTriangle, XCircle } from "lucide-react";
import { fetchDockerOverview } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Status = "HEALTHY" | "WARNING" | "CRITICAL";

function computeStatus(criticalDown: boolean, stopped: number, unhealthy: number, restarting: number): Status {
  if (criticalDown || stopped > 2) return "CRITICAL";
  if (unhealthy > 0 || restarting > 3) return "WARNING";
  return "HEALTHY";
}

const statusConfig: Record<Status, { icon: typeof Activity; bg: string; text: string; label: string; border: string }> = {
  HEALTHY: { icon: Activity, bg: "bg-success/10", text: "text-success", label: "All Systems Operational", border: "border-success/30" },
  WARNING: { icon: AlertTriangle, bg: "bg-warning/10", text: "text-warning", label: "Attention Required", border: "border-warning/30" },
  CRITICAL: { icon: XCircle, bg: "bg-critical/10", text: "text-critical", label: "Critical Issues Detected", border: "border-critical/30" },
};

const DockerHeroStatus = () => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["docker-overview"],
    queryFn: ({ signal }) => fetchDockerOverview(signal),
    refetchInterval: 60_000,
  });
  const overview = data?.data;
  const status = computeStatus(overview?.criticalDown ?? false, overview?.stopped ?? 0, overview?.unhealthy ?? 0, overview?.restarting ?? 0);
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  const now = new Date();
  const lastSync = overview?.lastSync ? new Date(overview.lastSync) : now;

  const metrics = [
    { label: "Total", value: overview?.total ?? 0, color: "text-foreground" },
    { label: "Running", value: overview?.running ?? 0, color: "text-success" },
    { label: "Unhealthy", value: overview?.unhealthy ?? 0, color: (overview?.unhealthy ?? 0) > 0 ? "text-warning" : "text-success" },
    { label: "Restarting", value: overview?.restarting ?? 0, color: (overview?.restarting ?? 0) > 3 ? "text-warning" : "text-foreground" },
    { label: "Stopped", value: overview?.stopped ?? 0, color: (overview?.stopped ?? 0) > 0 ? "text-critical" : "text-success" },
  ];
  const detailRows = useMemo(() => {
    if (!selectedMetric || !overview) return [];
    if (selectedMetric === "Total") {
      return overview.healthData.map((item) => ({
        name: item.name,
        signal: `${item.health} · Last check ${item.lastCheck}`,
      }));
    }
    if (selectedMetric === "Running") {
      return overview.restartData.filter((item) => item.status.toLowerCase() === "running").map((item) => ({
        name: item.name,
        signal: item.status,
      }));
    }
    if (selectedMetric === "Unhealthy") {
      return overview.healthData.filter((item) => item.health === "Unhealthy").map((item) => ({
        name: item.name,
        signal: `Unhealthy · Last check ${item.lastCheck}`,
      }));
    }
    if (selectedMetric === "Restarting") {
      return overview.restartData.filter((item) => item.restarts > 0).map((item) => ({
        name: item.name,
        signal: `${item.restarts} restarts · ${item.status}`,
      }));
    }
    return overview.restartData.filter((item) => item.status.toLowerCase() !== "running").map((item) => ({
      name: item.name,
      signal: item.status,
    }));
  }, [overview, selectedMetric]);

  return (
    <>
      <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`rounded-full p-3 ${cfg.bg}`}>
              <Icon className={`h-8 w-8 ${cfg.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${cfg.text}`}>{status}</span>
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${status === "HEALTHY" ? "bg-success" : status === "WARNING" ? "bg-warning" : "bg-critical"} animate-pulse`} />
              </div>
              <p className="text-sm text-muted-foreground">{cfg.label}</p>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground space-y-0.5">
            <p>{now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}</p>
            <p>{now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
            <p>Last sync: {lastSync.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 mt-5">
          {metrics.map((m) => (
            <button
              key={m.label}
              type="button"
              onClick={() => setSelectedMetric(m.label)}
              className="bg-card rounded-lg border border-border p-3 text-center hover:border-primary/40 transition-colors"
            >
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{m.label}</p>
            </button>
          ))}
        </div>
      </div>
      <Dialog open={selectedMetric !== null} onOpenChange={(open) => (!open ? setSelectedMetric(null) : undefined)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>{selectedMetric} Detail</DialogTitle>
            <DialogDescription>Detailed container list for selected hero metric ({detailRows.length} containers).</DialogDescription>
          </DialogHeader>
          {detailRows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No container data matched this metric.</div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden min-h-0 flex-1">
              <div className="max-h-full overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider">Container</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {detailRows.map((row) => (
                    <tr key={row.name} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-2 text-foreground">{row.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.signal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DockerHeroStatus;
