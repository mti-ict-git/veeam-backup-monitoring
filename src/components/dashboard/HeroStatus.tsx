import { ShieldCheck, Briefcase, CopyCheck, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchJobsStates, fetchCopyJobsStates, type JobState } from "@/lib/api";
import { countResults, computeCompliance, computeOverallStatus, formatPercent } from "@/lib/metrics";

const HeroStatus = () => {
  const primaryQ = useQuery({
    queryKey: ["jobs-states"],
    queryFn: ({ signal }) => fetchJobsStates(signal),
  });
  const copyQ = useQuery({
    queryKey: ["jobs-copy-states"],
    queryFn: ({ signal }) => fetchCopyJobsStates(signal),
  });
  const now = new Date();
  const data = primaryQ.data;
  const isLoading = primaryQ.isLoading || copyQ.isLoading;
  const isError = primaryQ.isError && copyQ.isError;
  const counts = data ? countResults(data.data, now, 24) : undefined;
  const compliance = counts ? computeCompliance(counts) : 1;
  const overallStatus = counts ? computeOverallStatus(counts) : isError ? "CRITICAL" : "HEALTHY";
  const lastSync = data?.data ? new Date(primaryQ.dataUpdatedAt) : now;
  const allJobs = data?.data ?? [];
  const backupJobs = allJobs.filter((j: JobState) => {
    const t = (j.type ?? "").toLowerCase();
    return t.includes("backup") && !t.includes("copy");
  });
  const copyJobs = (copyQ.data?.data ?? []).length > 0
    ? copyQ.data?.data ?? []
    : allJobs.filter((j: JobState) => (j.type ?? "").toLowerCase().includes("copy"));

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
            {new Intl.DateTimeFormat("en-US", {
              timeZone: "Asia/Makassar",
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            }).format(now)}
          </p>
          <p className="text-xs text-primary-foreground/50">
            Last Sync:{" "}
            {new Intl.DateTimeFormat("en-US", {
              timeZone: "Asia/Makassar",
              hour: "2-digit",
              minute: "2-digit",
            }).format(lastSync)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-primary-foreground/10">
        <StatItem
          icon={<Briefcase className="h-5 w-5" />}
          value={isLoading ? "…" : String(backupJobs.length)}
          label="Backup Jobs"
        />
        <StatItem
          icon={<CopyCheck className="h-5 w-5" />}
          value={isLoading ? "…" : String(copyJobs.length)}
          label="Backup Copy Jobs"
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
