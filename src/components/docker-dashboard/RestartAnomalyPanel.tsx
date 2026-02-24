import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const restartData = [
  { name: "api-gateway", restarts: 18, status: "Restarting" },
  { name: "auth-service", restarts: 7, status: "Running" },
  { name: "worker-queue", restarts: 3, status: "Running" },
  { name: "cache-redis", restarts: 1, status: "Running" },
  { name: "log-collector", restarts: 0, status: "Running" },
];

function getSeverity(count: number) {
  if (count > 15) return { label: "Critical", color: "text-critical", bg: "bg-critical/10" };
  if (count > 5) return { label: "Warning", color: "text-warning", bg: "bg-warning/10" };
  return { label: "Normal", color: "text-success", bg: "bg-success/10" };
}

const RestartAnomalyPanel = () => (
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
            <TableRow key={r.name}>
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
);

export default RestartAnomalyPanel;
