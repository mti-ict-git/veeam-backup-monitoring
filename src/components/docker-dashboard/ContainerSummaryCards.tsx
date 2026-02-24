import { CheckCircle, AlertTriangle, RefreshCw, Square, ShieldOff } from "lucide-react";

const cards = [
  { label: "Running", value: 38, icon: CheckCircle, color: "text-success", bg: "bg-success/10", border: "border-success/20" },
  { label: "Unhealthy", value: 1, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
  { label: "Restarting (24h)", value: 2, icon: RefreshCw, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
  { label: "Stopped", value: 1, icon: Square, color: "text-critical", bg: "bg-critical/10", border: "border-critical/20" },
  { label: "No Healthcheck", value: 5, icon: ShieldOff, color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border" },
];

const ContainerSummaryCards = () => (
  <div className="grid grid-cols-5 gap-3">
    {cards.map((c) => {
      const Icon = c.icon;
      return (
        <div key={c.label} className={`bg-card rounded-xl border ${c.border} p-4 flex flex-col items-center gap-2 shadow-sm`}>
          <div className={`rounded-full p-2 ${c.bg}`}>
            <Icon className={`h-5 w-5 ${c.color}`} />
          </div>
          <span className={`text-3xl font-bold ${c.color}`}>{c.value}</span>
          <span className="text-[11px] text-muted-foreground text-center">{c.label}</span>
        </div>
      );
    })}
  </div>
);

export default ContainerSummaryCards;
