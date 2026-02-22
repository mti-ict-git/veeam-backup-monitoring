import { ShieldCheck, Server, Briefcase, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchJobsStates } from "@/lib/api";
import { countResults, computeCompliance, computeOverallStatus, formatPercent } from "@/lib/metrics";

const HeroStatus = () => {
  const { data, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ["jobs-states"],
    queryFn: ({ signal }) => fetchJobsStates(signal),
  });
  const now = new Date();
  const counts = data ? countResults(data.data, now, 24) : undefined;
  const compliance = counts ? computeCompliance(counts) : 1;
  const overallStatus = counts ? computeOverallStatus(counts) : isError ? "CRITICAL" : "HEALTHY";
  const lastSync = dataUpdatedAt ? new Date(dataUpdatedAt) : now;

  const statusConfig = {
    HEALTHY: { bg: "bg-success", label: "All Systems Operational" },
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
              Overall Backup Status
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

      <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-primary-foreground/10">
        <StatItem icon={<Server className="h-5 w-5" />} value="—" label="Protected VMs" />
        <StatItem
          icon={<Briefcase className="h-5 w-5" />}
          value={isLoading ? "…" : String(data?.data.length ?? 0)}
          label="Backup Jobs"
        />
        <StatItem
          icon={<TrendingUp className="h-5 w-5" />}
          value={isLoading ? "…" : formatPercent(compliance, 1)}
          label="SLA Compliance"
        />
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

export default HeroStatus;
