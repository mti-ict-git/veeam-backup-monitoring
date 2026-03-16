import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchDockerOverview } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function getSeverity(count: number) {
  if (count > 15) return { label: "Critical", color: "text-critical", bg: "bg-critical/10" };
  if (count > 5) return { label: "Warning", color: "text-warning", bg: "bg-warning/10" };
  return { label: "Normal", color: "text-success", bg: "bg-success/10" };
}

const RestartAnomalyPanel = () => {
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["docker-overview"],
    queryFn: ({ signal }) => fetchDockerOverview(signal),
    refetchInterval: 60_000,
  });
  const restartData = data?.data.restartData ?? [];
  const selected = selectedName ? restartData.find((row) => row.name === selectedName) : undefined;
  const selectedSeverity = selected ? getSeverity(selected.restarts) : undefined;
  return (
    <>
      <div className="bg-card rounded-xl shadow-sm border border-border p-5">
        <h2 className="text-base font-semibold text-foreground mb-3">Restart Activity – Last 24 Hours</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Container</TableHead>
              <TableHead className="text-xs text-center">Restarts</TableHead>
              <TableHead className="text-xs text-center">Status</TableHead>
              <TableHead className="text-xs text-center">Severity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {restartData.map((r) => {
              const sev = getSeverity(r.restarts);
              return (
                <TableRow key={r.name} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelectedName(r.name)}>
                  <TableCell className="text-xs font-medium py-2">{r.name}</TableCell>
                  <TableCell className={`text-xs text-center font-bold py-2 ${sev.color}`}>{r.restarts}</TableCell>
                  <TableCell className="text-xs text-center py-2">{r.status}</TableCell>
                  <TableCell className="text-center py-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sev.bg} ${sev.color}`}>
                      {sev.label}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Dialog open={selectedName !== null} onOpenChange={(open) => (!open ? setSelectedName(null) : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restart Detail</DialogTitle>
            <DialogDescription>{selected?.name ?? "Container"} restart behavior in last 24 hours.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground mb-1">Container</div>
              <div className="font-medium text-foreground">{selected?.name ?? "—"}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground mb-1">Restart Count</div>
              <div className="font-semibold text-foreground">{selected?.restarts ?? 0}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <div className="font-medium text-foreground">{selected?.status ?? "—"}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground mb-1">Severity</div>
              <div className={`font-semibold ${selectedSeverity?.color ?? "text-muted-foreground"}`}>{selectedSeverity?.label ?? "Unknown"}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RestartAnomalyPanel;
