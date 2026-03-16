import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchDockerOverview } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function stackStatus(failed: number, unhealthy: number) {
  if (failed > 1) return { label: "Critical", color: "text-critical", bg: "bg-critical/10" };
  if (failed > 0 || unhealthy > 0) return { label: "Degraded", color: "text-warning", bg: "bg-warning/10" };
  return { label: "Healthy", color: "text-success", bg: "bg-success/10" };
}

const StackOverview = () => {
  const [selectedStackName, setSelectedStackName] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["docker-overview"],
    queryFn: ({ signal }) => fetchDockerOverview(signal),
    refetchInterval: 60_000,
  });
  const stacks = data?.data.stacks ?? [];
  const selectedStack = selectedStackName ? stacks.find((item) => item.name === selectedStackName) : undefined;
  const selectedStatus = selectedStack ? stackStatus(selectedStack.failed, selectedStack.unhealthy) : undefined;
  return (
    <>
      <div className="bg-card rounded-xl shadow-sm border border-border p-5">
        <h2 className="text-base font-semibold text-foreground mb-3">Stack Overview</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Stack</TableHead>
              <TableHead className="text-xs text-center">Total</TableHead>
              <TableHead className="text-xs text-center">Running</TableHead>
              <TableHead className="text-xs text-center">Failed</TableHead>
              <TableHead className="text-xs text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stacks.map((s) => {
              const st = stackStatus(s.failed, s.unhealthy);
              return (
                <TableRow key={s.name} className={`${s.failed > 0 || s.unhealthy > 0 ? "bg-warning/5" : ""} cursor-pointer hover:bg-muted/40`} onClick={() => setSelectedStackName(s.name)}>
                  <TableCell className="text-xs font-medium py-2">{s.name}</TableCell>
                  <TableCell className="text-xs text-center py-2">{s.total}</TableCell>
                  <TableCell className="text-xs text-center py-2 text-success font-semibold">{s.running}</TableCell>
                  <TableCell className={`text-xs text-center py-2 font-semibold ${s.failed > 0 ? "text-critical" : "text-muted-foreground"}`}>{s.failed}</TableCell>
                  <TableCell className="text-center py-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                      {st.label}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Dialog open={selectedStackName !== null} onOpenChange={(open) => (!open ? setSelectedStackName(null) : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stack Detail</DialogTitle>
            <DialogDescription>{selectedStack?.name ?? "Stack"} runtime status and risk counters.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground mb-1">Total Containers</div>
              <div className="font-semibold text-foreground">{selectedStack?.total ?? 0}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground mb-1">Running</div>
              <div className="font-semibold text-success">{selectedStack?.running ?? 0}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground mb-1">Failed</div>
              <div className={`font-semibold ${(selectedStack?.failed ?? 0) > 0 ? "text-critical" : "text-foreground"}`}>{selectedStack?.failed ?? 0}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground mb-1">Unhealthy</div>
              <div className={`font-semibold ${(selectedStack?.unhealthy ?? 0) > 0 ? "text-warning" : "text-foreground"}`}>{selectedStack?.unhealthy ?? 0}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 col-span-2">
              <div className="text-xs text-muted-foreground mb-1">Overall Status</div>
              <div className={`font-semibold ${selectedStatus?.color ?? "text-muted-foreground"}`}>{selectedStatus?.label ?? "Unknown"}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StackOverview;
