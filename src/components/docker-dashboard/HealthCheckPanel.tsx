import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchDockerOverview } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function healthStyle(h: string) {
  if (h === "Healthy") return { color: "text-success", bg: "bg-success/10" };
  if (h === "Unhealthy") return { color: "text-critical", bg: "bg-critical/10" };
  return { color: "text-warning", bg: "bg-warning/10" };
}

const HealthCheckPanel = () => {
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["docker-overview"],
    queryFn: ({ signal }) => fetchDockerOverview(signal),
    refetchInterval: 60_000,
  });
  const containers = data?.data.healthData ?? [];
  const selected = selectedName ? containers.find((item) => item.name === selectedName) : undefined;
  const selectedStyle = selected ? healthStyle(selected.health) : undefined;
  return (
    <>
      <div className="bg-card rounded-xl shadow-sm border border-border p-5">
        <h2 className="text-base font-semibold text-foreground mb-3">Container Health Check Status</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Container</TableHead>
              <TableHead className="text-xs text-center">Health Status</TableHead>
              <TableHead className="text-xs text-center">Last Check</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {containers.map((c) => {
              const s = healthStyle(c.health);
              return (
                <TableRow key={c.name} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelectedName(c.name)}>
                  <TableCell className="text-xs font-medium py-2">{c.name}</TableCell>
                  <TableCell className="text-center py-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>
                      {c.health}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-center text-muted-foreground py-2">{c.lastCheck}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Dialog open={selectedName !== null} onOpenChange={(open) => (!open ? setSelectedName(null) : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Health Check Detail</DialogTitle>
            <DialogDescription>{selected?.name ?? "Container"} health check status details.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground mb-1">Container</div>
              <div className="font-medium text-foreground">{selected?.name ?? "—"}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground mb-1">Health Status</div>
              <div className={`font-semibold ${selectedStyle?.color ?? "text-muted-foreground"}`}>{selected?.health ?? "Unknown"}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground mb-1">Last Check</div>
              <div className="font-medium text-foreground">{selected?.lastCheck ?? "—"}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HealthCheckPanel;
