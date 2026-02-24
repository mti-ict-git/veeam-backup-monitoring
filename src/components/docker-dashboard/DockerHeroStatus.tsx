import { Activity, AlertTriangle, XCircle } from "lucide-react";

const mockData = {
  total: 42,
  running: 38,
  unhealthy: 1,
  restarting: 2,
  stopped: 1,
  lastSync: "2026-02-24T08:30:00",
  criticalDown: false,
};

type Status = "HEALTHY" | "WARNING" | "CRITICAL";

function computeStatus(): Status {
  if (mockData.criticalDown || mockData.stopped > 2) return "CRITICAL";
  if (mockData.unhealthy > 0 || mockData.restarting > 3) return "WARNING";
  return "HEALTHY";
}

const statusConfig: Record<Status, { icon: typeof Activity; bg: string; text: string; label: string; border: string }> = {
  HEALTHY: { icon: Activity, bg: "bg-success/10", text: "text-success", label: "All Systems Operational", border: "border-success/30" },
  WARNING: { icon: AlertTriangle, bg: "bg-warning/10", text: "text-warning", label: "Attention Required", border: "border-warning/30" },
  CRITICAL: { icon: XCircle, bg: "bg-critical/10", text: "text-critical", label: "Critical Issues Detected", border: "border-critical/30" },
};

const DockerHeroStatus = () => {
  const status = computeStatus();
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  const now = new Date();

  const metrics = [
    { label: "Total", value: mockData.total, color: "text-foreground" },
    { label: "Running", value: mockData.running, color: "text-success" },
    { label: "Unhealthy", value: mockData.unhealthy, color: mockData.unhealthy > 0 ? "text-warning" : "text-success" },
    { label: "Restarting", value: mockData.restarting, color: mockData.restarting > 3 ? "text-warning" : "text-foreground" },
    { label: "Stopped", value: mockData.stopped, color: mockData.stopped > 0 ? "text-critical" : "text-success" },
  ];

  return (
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
          <p>Last sync: {new Date(mockData.lastSync).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mt-5">
        {metrics.map((m) => (
          <div key={m.label} className="bg-card rounded-lg border border-border p-3 text-center">
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DockerHeroStatus;
