import { CheckCircle2, Clock, Activity, Shield, AlertTriangle, CircleDashed } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchRestoreTestLatest, fetchSureBackupStatus } from "@/lib/api";

const RestoreReadiness = () => {
  const restoreQ = useQuery({
    queryKey: ["restore-test-latest"],
    queryFn: ({ signal }) => fetchRestoreTestLatest(signal),
  });
  const sureQ = useQuery({
    queryKey: ["surebackup-status"],
    queryFn: ({ signal }) => fetchSureBackupStatus(signal),
  });

  const restore = restoreQ.data?.data ?? null;
  const sure = sureQ.data?.data ?? null;
  const policyWindowDays = 7;
  const now = new Date();

  const parseDate = (v: string | null): Date | null => {
    if (!v) return null;
    const t = Date.parse(v);
    if (Number.isNaN(t)) return null;
    return new Date(t);
  };

  const formatWita = (d: Date): string =>
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Makassar",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);

  const lastTestDate = parseDate(restore?.lastTestAt ?? null);
  const withinWindow =
    lastTestDate !== null ? now.getTime() - lastTestDate.getTime() <= policyWindowDays * 24 * 60 * 60 * 1000 : false;
  const verified = restore?.result === "Success" && withinWindow && sure?.enabled === true;
  const hasRestore = restore !== null && lastTestDate !== null;

  const statusText = hasRestore ? (verified ? "Verified & Ready" : "Attention Needed") : "Not Configured";
  const statusSub = hasRestore
    ? verified
      ? "Restore tests passed within policy window"
      : "Restore tests need attention"
    : "Restore tests not configured";
  const StatusIcon = hasRestore ? (verified ? CheckCircle2 : AlertTriangle) : CircleDashed;
  const statusIconBg = hasRestore ? (verified ? "bg-success" : "bg-warning") : "bg-muted";
  const statusIconColor = hasRestore ? "text-primary-foreground" : "text-muted-foreground";
  const statusTextColor = hasRestore ? (verified ? "text-success" : "text-warning") : "text-muted-foreground";

  const lastTestText = lastTestDate ? formatWita(lastTestDate) : "—";
  const resultText = restore?.result ?? "Unknown";
  const durationText = restore?.durationMinutes ? `${restore.durationMinutes} min` : "—";
  const sureText = sure?.enabled === undefined ? "Unknown" : sure.enabled ? "Enabled" : "Disabled";

  const items = [
    { icon: Clock, label: "Last Restore Test", value: restoreQ.isLoading ? "…" : lastTestText },
    { icon: CheckCircle2, label: "Restore Result", value: restoreQ.isLoading ? "…" : resultText },
    { icon: Activity, label: "Restore Duration", value: restoreQ.isLoading ? "…" : durationText },
    { icon: Shield, label: "SureBackup", value: sureQ.isLoading ? "…" : sureText },
  ];

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-5">
      <h2 className="text-lg font-semibold text-foreground mb-4">Restore Readiness</h2>
      <div className="flex items-center gap-4 mb-4">
        <div className={`${statusIconBg} rounded-full p-3`}>
          <StatusIcon className={`h-8 w-8 ${statusIconColor}`} />
        </div>
        <div>
          <p className={`text-xl font-bold ${statusTextColor}`}>{restoreQ.isLoading || sureQ.isLoading ? "…" : statusText}</p>
          <p className="text-xs text-muted-foreground">{restoreQ.isLoading || sureQ.isLoading ? "…" : statusSub}</p>
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
