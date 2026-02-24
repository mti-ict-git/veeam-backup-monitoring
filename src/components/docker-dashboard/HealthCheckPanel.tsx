import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const containers = [
  { name: "api-gateway", health: "Healthy", lastCheck: "08:29:45" },
  { name: "auth-service", health: "Healthy", lastCheck: "08:29:30" },
  { name: "postgres-db", health: "Unhealthy", lastCheck: "08:28:12" },
  { name: "cache-redis", health: "No Healthcheck", lastCheck: "—" },
  { name: "worker-queue", health: "Healthy", lastCheck: "08:29:50" },
  { name: "log-collector", health: "No Healthcheck", lastCheck: "—" },
];

function healthStyle(h: string) {
  if (h === "Healthy") return { color: "text-success", bg: "bg-success/10" };
  if (h === "Unhealthy") return { color: "text-critical", bg: "bg-critical/10" };
  return { color: "text-warning", bg: "bg-warning/10" };
}

const HealthCheckPanel = () => (
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
            <TableRow key={c.name}>
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
);

export default HealthCheckPanel;
