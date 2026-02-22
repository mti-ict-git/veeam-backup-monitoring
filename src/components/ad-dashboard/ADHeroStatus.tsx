import { ShieldCheck, ShieldAlert, Server, RefreshCw, AlertTriangle } from "lucide-react";

// Mock governance data - in production these would come from props/API
const dcOffline = false;
const replicationError = false;
const sysvolUnhealthy = false;
const domainAdminChange = false;
const diskOver85 = false;
const replicationDelay = false;

const computeStatus = () => {
  if (domainAdminChange || dcOffline || replicationError || sysvolUnhealthy) return "CRITICAL";
  if (diskOver85 || replicationDelay) return "WARNING";
  return "HEALTHY";
};

const ADHeroStatus = () => {
  const overallStatus = computeStatus();
  const now = new Date();
  const lastSync = new Date(now.getTime() - 8 * 60000);

  const statusConfig = {
    HEALTHY: { bg: "bg-success", icon: ShieldCheck, label: "All Domain Controllers Operational" },
    WARNING: { bg: "bg-warning", icon: AlertTriangle, label: "Attention Required" },
    CRITICAL: { bg: "bg-critical", icon: ShieldAlert, label: "Immediate Action Needed" },
  };

  const config = statusConfig[overallStatus];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-3">
      <div className="bg-navy rounded-xl p-6 text-primary-foreground shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className={`${config.bg} rounded-xl p-4 animate-pulse-slow`}>
              <StatusIcon className="h-10 w-10 text-success-foreground" />
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
          <StatItem icon={<Server className="h-5 w-5" />} value={dcOffline ? "3" : "4"} label="DCs Online" />
          <StatItem icon={<RefreshCw className="h-5 w-5" />} value={replicationError ? "Error" : "OK"} label="Replication Status" />
          <StatItem icon={<AlertTriangle className="h-5 w-5" />} value="2" label="Security Alerts (24h)" />
        </div>
      </div>

      {/* Critical Privilege Change Banner */}
      {domainAdminChange ? (
        <div className="bg-critical-muted border-2 border-critical rounded-lg p-3 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-critical" />
          <span className="text-critical font-bold text-sm">⚠ Critical Privilege Change Detected Today</span>
        </div>
      ) : (
        <div className="bg-success-muted border border-success/30 rounded-lg p-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-success" />
          <span className="text-success font-medium text-sm">No critical privilege escalation detected</span>
        </div>
      )}
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
