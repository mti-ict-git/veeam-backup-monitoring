import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const stacks = [
  { name: "production-web", total: 8, running: 8, failed: 0 },
  { name: "monitoring", total: 5, running: 5, failed: 0 },
  { name: "auth-stack", total: 4, running: 3, failed: 1 },
  { name: "data-pipeline", total: 6, running: 6, failed: 0 },
  { name: "ci-cd-runners", total: 3, running: 2, failed: 1 },
];

function stackStatus(failed: number) {
  if (failed > 1) return { label: "Critical", color: "text-critical", bg: "bg-critical/10" };
  if (failed > 0) return { label: "Degraded", color: "text-warning", bg: "bg-warning/10" };
  return { label: "Healthy", color: "text-success", bg: "bg-success/10" };
}

const StackOverview = () => (
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
          const st = stackStatus(s.failed);
          return (
            <TableRow key={s.name} className={s.failed > 0 ? "bg-warning/5" : ""}>
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
);

export default StackOverview;
