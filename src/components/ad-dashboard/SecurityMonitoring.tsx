import { UserPlus, ShieldAlert, Lock, LogIn, Key, TrendingUp, TrendingDown } from "lucide-react";

const events = [
  { label: "New Users Created", value: 3, icon: UserPlus, trend: "up", colorClass: "bg-info-muted text-info" },
  { label: "Added to Domain Admins", value: 0, icon: ShieldAlert, trend: "neutral", colorClass: "bg-success-muted text-success", alert: true },
  { label: "Account Lockouts", value: 5, icon: Lock, trend: "down", colorClass: "bg-warning-muted text-warning" },
  { label: "Failed Login Attempts", value: 47, icon: LogIn, trend: "up", colorClass: "bg-critical-muted text-critical" },
  { label: "Privileged Logons (4672)", value: 128, icon: Key, trend: "neutral", colorClass: "bg-navy text-primary-foreground" },
];

const SecurityMonitoring = () => {
  const domainAdminAlert = events.find((e) => e.alert && e.value > 0);

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-3">Security Events – Last 24 Hours</h2>

      {domainAdminAlert && (
        <div className="bg-critical-muted border-2 border-critical rounded-lg p-3 mb-3 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-critical" />
          <span className="text-critical font-bold text-sm">
            ⚠ New Domain Admin Detected – Immediate Review Required
          </span>
        </div>
      )}

      <div className="grid grid-cols-5 gap-3">
        {events.map((event) => (
          <div
            key={event.label}
            className="bg-card rounded-xl p-4 shadow-sm border border-border flex flex-col items-center text-center gap-2"
          >
            <div className={`${event.colorClass} rounded-lg p-2.5`}>
              <event.icon className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-3xl font-bold text-foreground">{event.value}</span>
              {event.trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-critical" />}
              {event.trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-success" />}
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{event.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityMonitoring;
