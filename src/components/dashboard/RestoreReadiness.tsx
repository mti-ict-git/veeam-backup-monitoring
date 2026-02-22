import { CheckCircle2, Clock, Activity, Shield } from "lucide-react";

const RestoreReadiness = () => {
  const items = [
    { icon: Clock, label: "Last Restore Test", value: "Feb 20, 2026", ok: true },
    { icon: CheckCircle2, label: "Restore Result", value: "Success", ok: true },
    { icon: Activity, label: "Restore Duration", value: "12 min 34 sec", ok: true },
    { icon: Shield, label: "SureBackup", value: "Enabled", ok: true },
  ];

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-5">
      <h2 className="text-lg font-semibold text-foreground mb-4">Restore Readiness</h2>
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-success rounded-full p-3">
          <CheckCircle2 className="h-8 w-8 text-success-foreground" />
        </div>
        <div>
          <p className="text-xl font-bold text-success">Verified & Ready</p>
          <p className="text-xs text-muted-foreground">All restore tests passed successfully</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2.5">
            <item.icon className="h-4 w-4 text-navy" />
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
              <p className="text-sm font-semibold text-foreground">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestoreReadiness;
