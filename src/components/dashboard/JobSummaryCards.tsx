import { Layers, CheckCircle2, AlertTriangle, XCircle, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchJobsStates, type JobState } from "@/lib/api";

function aggregate(items: JobState[]) {
  const total = items.length;
  let success = 0;
  let warning = 0;
  let failed = 0;
  let running = 0;
  for (const j of items) {
    const r = (j.lastResult || "").toLowerCase();
    if (r.includes("success")) success += 1;
    else if (r.includes("warn")) warning += 1;
    else if (r.includes("fail") || r.includes("error")) failed += 1;
    else if (r.includes("running")) running += 1;
  }
  return { total, success, warning, failed, running };
}

const JobSummaryCards = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["jobs-states"],
    queryFn: ({ signal }) => fetchJobsStates(signal),
  });

  const counts = data ? aggregate(data.data) : undefined;

  const cards = [
    { label: "Total Jobs", value: counts?.total ?? 0, icon: Layers, colorClass: "bg-navy text-primary-foreground" },
    { label: "Successful", value: counts?.success ?? 0, icon: CheckCircle2, colorClass: "bg-success-muted text-success" },
    { label: "Warnings", value: counts?.warning ?? 0, icon: AlertTriangle, colorClass: "bg-warning-muted text-warning" },
    { label: "Failed", value: counts?.failed ?? 0, icon: XCircle, colorClass: "bg-critical-muted text-critical" },
    { label: "Running", value: counts?.running ?? 0, icon: Play, colorClass: "bg-info-muted text-info" },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-3">Backup Job Summary</h2>
      {isError ? (
        <div className="text-sm text-critical">Failed to load job summary</div>
      ) : (
        <div className="grid grid-cols-5 gap-3">
          {cards.map((job) => (
            <div
              key={job.label}
              className="bg-card rounded-xl p-4 shadow-sm border border-border flex flex-col items-center text-center gap-2"
            >
              <div className={`${job.colorClass} rounded-lg p-2.5`}>
                <job.icon className="h-5 w-5" />
              </div>
              <span className="text-3xl font-bold text-foreground">{isLoading ? "…" : job.value}</span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{job.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobSummaryCards;
