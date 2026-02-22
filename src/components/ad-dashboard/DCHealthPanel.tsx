import { Server, Cpu, HardDrive, Clock, Activity } from "lucide-react";

const dcs = [
  { name: "DC-PRIMARY-01", status: "Online", cpu: 34, memory: 58, diskFree: 72, uptime: "45d 12h", ntds: "Running", netlogon: "Running" },
  { name: "DC-SECONDARY-02", status: "Online", cpu: 22, memory: 41, diskFree: 65, uptime: "30d 8h", ntds: "Running", netlogon: "Running" },
  { name: "DC-SITE-B-01", status: "Online", cpu: 45, memory: 63, diskFree: 48, uptime: "15d 3h", ntds: "Running", netlogon: "Running" },
  { name: "DC-DR-01", status: "Online", cpu: 12, memory: 35, diskFree: 81, uptime: "60d 1h", ntds: "Running", netlogon: "Running" },
];

const DCHealthPanel = () => (
  <div>
    <h2 className="text-lg font-semibold text-foreground mb-3">Domain Controller Health</h2>
    <div className="grid grid-cols-2 gap-3">
      {dcs.map((dc) => {
        const isUnhealthy = dc.status === "Offline" || dc.ntds === "Stopped" || dc.netlogon === "Stopped";
        return (
          <div
            key={dc.name}
            className={`bg-card rounded-xl p-4 shadow-sm border ${isUnhealthy ? "border-critical border-2" : "border-border"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm text-foreground">{dc.name}</span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dc.status === "Online" ? "bg-success-muted text-success" : "bg-critical-muted text-critical"}`}>
                {dc.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center mb-3">
              <MetricItem icon={<Cpu className="h-3.5 w-3.5" />} label="CPU" value={`${dc.cpu}%`} warn={dc.cpu > 80} />
              <MetricItem icon={<Activity className="h-3.5 w-3.5" />} label="Memory" value={`${dc.memory}%`} warn={dc.memory > 80} />
              <MetricItem icon={<HardDrive className="h-3.5 w-3.5" />} label="Disk Free" value={`${dc.diskFree}%`} warn={dc.diskFree < 20} />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Uptime: {dc.uptime}</span>
              </div>
              <div className="flex gap-3">
                <ServiceBadge label="NTDS" status={dc.ntds} />
                <ServiceBadge label="Netlogon" status={dc.netlogon} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const MetricItem = ({ icon, label, value, warn }: { icon: React.ReactNode; label: string; value: string; warn: boolean }) => (
  <div className="flex flex-col items-center gap-1">
    <div className={`${warn ? "text-critical" : "text-muted-foreground"}`}>{icon}</div>
    <span className={`text-sm font-bold ${warn ? "text-critical" : "text-foreground"}`}>{value}</span>
    <span className="text-[10px] text-muted-foreground uppercase">{label}</span>
  </div>
);

const ServiceBadge = ({ label, status }: { label: string; status: string }) => (
  <span className={`text-[10px] font-medium ${status === "Running" ? "text-success" : "text-critical font-bold"}`}>
    {label}: {status}
  </span>
);

export default DCHealthPanel;
