import { Layers, CheckCircle2, AlertTriangle, XCircle, Play } from "lucide-react";

const jobs = [
  { label: "Total Jobs", value: 38, icon: Layers, colorClass: "bg-navy text-primary-foreground" },
  { label: "Successful", value: 32, icon: CheckCircle2, colorClass: "bg-success-muted text-success" },
  { label: "Warnings", value: 3, icon: AlertTriangle, colorClass: "bg-warning-muted text-warning" },
  { label: "Failed", value: 1, icon: XCircle, colorClass: "bg-critical-muted text-critical" },
  { label: "Running", value: 2, icon: Play, colorClass: "bg-info-muted text-info" },
];

const JobSummaryCards = () => (
  <div>
    <h2 className="text-lg font-semibold text-foreground mb-3">Backup Job Summary</h2>
    <div className="grid grid-cols-5 gap-3">
      {jobs.map((job) => (
        <div
          key={job.label}
          className="bg-card rounded-xl p-4 shadow-sm border border-border flex flex-col items-center text-center gap-2"
        >
          <div className={`${job.colorClass} rounded-lg p-2.5`}>
            <job.icon className="h-5 w-5" />
          </div>
          <span className="text-3xl font-bold text-foreground">{job.value}</span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{job.label}</span>
        </div>
      ))}
    </div>
  </div>
);

export default JobSummaryCards;
