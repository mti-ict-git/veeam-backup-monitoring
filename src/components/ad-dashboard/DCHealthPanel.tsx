import { Server } from "lucide-react";

const dcs = [
  { name: "DC-PROD-01", status: "Online", cpu: 24, memory: 58, disk: 72, uptime: "45d 12h", ntds: "Running", netlogon: "Running" },
  { name: "DC-PROD-02", status: "Online", cpu: 31, memory: 63, disk: 65, uptime: "45d 12h", ntds: "Running", netlogon: "Running" },
  { name: "DC-DR-01", status: "Online", cpu: 12, memory: 41, disk: 81, uptime: "30d 8h", ntds: "Running", netlogon: "Running" },
  { name: "DC-BRANCH-01", status: "Online", cpu: 18, memory: 45, disk: 77, uptime: "22d 5h", ntds: "Running", netlogon: "Running" },
];

const getBarColor = (label: string, value: number) => {
  if (label === "DISK") return value > 85 ? "bg-critical" : value > 70 ? "bg-warning" : "bg-success";
  return value > 80 ? "bg-critical" : value > 60 ? "bg-warning" : "bg-success";
};

const DCHealthPanel = () => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <Server className="h-5 w-5 text-muted-foreground" />
      <h2 className="text-lg font-semibold text-foreground">Domain Controller Health</h2>
    </div>
    <div className="grid grid-cols-4 gap-3">
      {dcs.map((dc) => {
        const isUnhealthy = dc.status === "Offline" || dc.ntds === "Stopped" || dc.netlogon === "Stopped";
        return (
          <div
            key={dc.name}
            className={`bg-card rounded-xl p-4 shadow-sm border ${isUnhealthy ? "border-critical border-2" : "border-border"}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-sm text-foreground">{dc.name}</span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${dc.status === "Online" ? "bg-success-muted text-success" : "bg-critical-muted text-critical"}`}>
                {dc.status}
              </span>
            </div>

            <div className="space-y-2.5 mb-4">
              <MetricBar label="CPU" value={dc.cpu} />
              <MetricBar label="MEM" value={dc.memory} />
              <MetricBar label="DISK" value={dc.disk} />
            </div>

            <div className="border-t border-border pt-3 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Uptime</span>
                <span className="text-foreground font-medium">{dc.uptime}</span>
              </div>
              <div className="flex justify-between">
                <span>NTDS</span>
                <span className={`font-semibold ${dc.ntds === "Running" ? "text-success" : "text-critical"}`}>{dc.ntds}</span>
              </div>
              <div className="flex justify-between">
                <span>Netlogon</span>
                <span className={`font-semibold ${dc.netlogon === "Running" ? "text-success" : "text-critical"}`}>{dc.netlogon}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const MetricBar = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-muted-foreground w-10 shrink-0">{label}</span>
    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${getBarColor(label, value)}`} style={{ width: `${value}%` }} />
    </div>
    <span className="text-xs font-semibold text-foreground w-8 text-right">{value}%</span>
  </div>
);

export default DCHealthPanel;
