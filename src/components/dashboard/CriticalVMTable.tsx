const vms = [
  { name: "DC-PROD-01", env: "Production", lastBackup: "2026-02-22 02:15", rpo: "Compliant", ok: true },
  { name: "SQL-PROD-01", env: "Production", lastBackup: "2026-02-22 03:42", rpo: "Compliant", ok: true },
  { name: "APP-PROD-02", env: "Production", lastBackup: "2026-02-21 22:10", rpo: "Breach", ok: false },
  { name: "EXCH-PROD-01", env: "Production", lastBackup: "2026-02-22 01:30", rpo: "Compliant", ok: true },
  { name: "FILE-PROD-01", env: "Production", lastBackup: "2026-02-22 04:05", rpo: "Compliant", ok: true },
  { name: "WEB-DEV-01", env: "Development", lastBackup: "2026-02-21 18:00", rpo: "Breach", ok: false },
  { name: "DNS-PROD-01", env: "Production", lastBackup: "2026-02-22 02:50", rpo: "Compliant", ok: true },
];

const CriticalVMTable = () => (
  <div>
    <h2 className="text-lg font-semibold text-foreground mb-3">Critical Infrastructure Protection</h2>
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-navy text-primary-foreground">
            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">VM Name</th>
            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Environment</th>
            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Last Backup</th>
            <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">RPO Status</th>
            <th className="text-center px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody>
          {vms.map((vm, i) => (
            <tr
              key={vm.name}
              className={`${!vm.ok ? "bg-critical-muted" : i % 2 === 0 ? "bg-card" : "bg-muted/40"} border-t border-border`}
            >
              <td className="px-4 py-2.5 font-medium text-foreground">{vm.name}</td>
              <td className="px-4 py-2.5">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    vm.env === "Production"
                      ? "bg-navy/10 text-navy"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {vm.env}
                </span>
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">{vm.lastBackup}</td>
              <td className="px-4 py-2.5">
                <span
                  className={`font-semibold text-xs ${vm.ok ? "text-success" : "text-critical"}`}
                >
                  {vm.rpo}
                </span>
              </td>
              <td className="px-4 py-2.5 text-center">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${vm.ok ? "bg-success" : "bg-critical animate-pulse-slow"}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default CriticalVMTable;
