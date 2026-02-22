import { ShieldCheck, Server, RefreshCw, AlertTriangle } from "lucide-react";

const ADHeroStatus = () => {
  const overallStatus = "HEALTHY";
  const now = new Date();
  const lastSync = new Date(now.getTime() - 8 * 60000);

  const statusConfig = {
    HEALTHY: { bg: "bg-success", label: "All Domain Controllers Operational" },
    WARNING: { bg: "bg-warning", label: "Attention Required" },
    CRITICAL: { bg: "bg-critical", label: "Immediate Action Needed" },
  };

  const config = statusConfig[overallStatus];

  return (
    <div className="bg-navy rounded-xl p-6 text-primary-foreground shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className={`${config.bg} rounded-xl p-4 animate-pulse-slow`}>
            <ShieldCheck className="h-10 w-10 text-success-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary-foreground/60 uppercase tracking-wider">
              Overall AD Status
            </p>
            <h1 className="text-3xl font-bold tracking-tight">{overallStatus}</h1>
            <p className="text-sm text-primary-foreground/70 mt-0.5">{config.label}</p>
          </div>
        </div>

        <div className="text-right space-y-1">
          <p className="text-xs text-primary-foreground/50 uppercase tracking-wider">Report Date</p>
          <p className="text-lg font-semibold">
            {now.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
          </p>
          <p className="text-xs text-primary-foreground/50">
            Last Sync: {lastSync.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-6 pt-5 border-t border-primary-foreground/10">
        <StatItem icon={<Server className="h-5 w-5" />} value="4" label="Domain Controllers" />
        <StatItem icon={<Server className="h-5 w-5" />} value="4" label="DCs Online" />
        <StatItem icon={<RefreshCw className="h-5 w-5" />} value="OK" label="Replication Status" />
        <StatItem icon={<AlertTriangle className="h-5 w-5" />} value="2" label="Security Alerts (24h)" />
      </div>
    </div>
  );
};

const StatItem = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="flex items-center gap-3">
    <div className="bg-primary-foreground/10 rounded-lg p-2.5">{icon}</div>
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-primary-foreground/60">{label}</p>
    </div>
  </div>
);

export default ADHeroStatus;
