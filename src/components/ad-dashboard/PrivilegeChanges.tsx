import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const changes = [
  { type: "Group Membership Change", account: "john.doe", group: "IT-Support", time: "08:45 AM", severity: "Low" },
  { type: "Group Membership Change", account: "admin.ops", group: "Domain Admins", time: "09:12 AM", severity: "Critical" },
  { type: "Password Reset", account: "sarah.k", group: "—", time: "10:03 AM", severity: "Low" },
  { type: "Account Enabled", account: "temp.contractor", group: "Remote-Users", time: "10:30 AM", severity: "Medium" },
  { type: "Group Membership Change", account: "mike.r", group: "Backup Operators", time: "11:15 AM", severity: "Medium" },
];

const severityClasses: Record<string, string> = {
  Low: "bg-success-muted text-success",
  Medium: "bg-warning-muted text-warning",
  Critical: "bg-critical-muted text-critical",
};

const PrivilegeChanges = () => (
  <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
    <div className="p-5 pb-0">
      <h2 className="text-lg font-semibold text-foreground mb-3">Privilege & Group Changes</h2>
    </div>
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="text-xs font-semibold uppercase tracking-wider">Event Type</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">Account</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">Target Group</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">Time</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">Severity</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {changes.map((c, i) => {
          const isDomainAdmin = c.group === "Domain Admins";
          return (
            <TableRow key={i} className={isDomainAdmin ? "bg-critical-muted/50" : ""}>
              <TableCell className="text-sm font-medium">{c.type}</TableCell>
              <TableCell className="text-sm font-mono">{c.account}</TableCell>
              <TableCell className={`text-sm ${isDomainAdmin ? "text-critical font-bold" : ""}`}>{c.group}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{c.time}</TableCell>
              <TableCell>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${severityClasses[c.severity]}`}>
                  {c.severity}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);

export default PrivilegeChanges;
