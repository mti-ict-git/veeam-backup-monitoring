import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckCircle, AlertTriangle, RefreshCw, Square, ShieldOff } from "lucide-react";
import { fetchDockerOverview } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ContainerSummaryCards = () => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["docker-overview"],
    queryFn: ({ signal }) => fetchDockerOverview(signal),
    refetchInterval: 60_000,
  });
  const overview = data?.data;
  const cards = [
    { label: "Running", value: overview?.running ?? 0, icon: CheckCircle, color: "text-success", bg: "bg-success/10", border: "border-success/20" },
    { label: "Unhealthy", value: overview?.unhealthy ?? 0, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
    { label: "Restarting (24h)", value: overview?.restarting ?? 0, icon: RefreshCw, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
    { label: "Stopped", value: overview?.stopped ?? 0, icon: Square, color: "text-critical", bg: "bg-critical/10", border: "border-critical/20" },
    { label: "No Healthcheck", value: overview?.noHealthcheck ?? 0, icon: ShieldOff, color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border" },
  ];
  const details = useMemo(() => {
    if (!selectedCard || !overview) return [];
    if (selectedCard === "Running") {
      return overview.healthData.filter((item) => item.health === "Healthy").map((item) => ({
        name: item.name,
        info: `Health ${item.health} · Last check ${item.lastCheck}`,
      }));
    }
    if (selectedCard === "Unhealthy") {
      return overview.healthData.filter((item) => item.health === "Unhealthy").map((item) => ({
        name: item.name,
        info: `Health ${item.health} · Last check ${item.lastCheck}`,
      }));
    }
    if (selectedCard === "Restarting (24h)") {
      return overview.restartData.filter((item) => item.restarts > 0).map((item) => ({
        name: item.name,
        info: `${item.restarts} restarts · ${item.status}`,
      }));
    }
    if (selectedCard === "Stopped") {
      return overview.restartData.filter((item) => item.status.toLowerCase() !== "running").map((item) => ({
        name: item.name,
        info: item.status,
      }));
    }
    return overview.healthData.filter((item) => item.health === "No Healthcheck").map((item) => ({
      name: item.name,
      info: "No healthcheck configured",
    }));
  }, [overview, selectedCard]);

  return (
    <>
      <div className="grid grid-cols-5 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => setSelectedCard(c.label)}
              className={`bg-card rounded-xl border ${c.border} p-4 flex flex-col items-center gap-2 shadow-sm hover:border-primary/40 transition-colors text-left`}
            >
              <div className={`rounded-full p-2 ${c.bg}`}>
                <Icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <span className={`text-3xl font-bold ${c.color}`}>{c.value}</span>
              <span className="text-[11px] text-muted-foreground text-center">{c.label}</span>
            </button>
          );
        })}
      </div>
      <Dialog open={selectedCard !== null} onOpenChange={(open) => (!open ? setSelectedCard(null) : undefined)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCard} Details</DialogTitle>
            <DialogDescription>Click summary cards to inspect matching container signals.</DialogDescription>
          </DialogHeader>
          {details.length === 0 ? (
            <div className="text-sm text-muted-foreground">No matching data found for this metric.</div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider">Container</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {details.slice(0, 12).map((item) => (
                    <tr key={item.name} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-2 text-foreground">{item.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.info}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContainerSummaryCards;
