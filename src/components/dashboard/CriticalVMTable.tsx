import { useQuery } from "@tanstack/react-query";
import { fetchVMProtection, type VMProtection } from "@/lib/api";
import { format } from "date-fns";

function parseDate(d?: string): Date | undefined {
  if (!d) return undefined;
  const t = Date.parse(d);
  if (Number.isNaN(t)) return undefined;
  return new Date(t);
}

function hoursDiff(a: Date, b: Date): number {
  const ms = Math.abs(a.getTime() - b.getTime());
  return ms / (1000 * 60 * 60);
}

function isFail(res?: string): boolean {
  const r = (res ?? "").toLowerCase();
  return r.includes("fail") || r.includes("error");
}

const CriticalVMTable = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["vms-protection"],
    queryFn: ({ signal }) => fetchVMProtection(signal),
  });
  const now = new Date();
  const items: VMProtection[] = data?.data ?? [];
  const primaryRpoHours = 24;
  const vaultLagHours = 2;
  const rows = items.map((v) => {
    const pdt = parseDate(v.primaryLastRun);
    const cdt = parseDate(v.copyLastRun);
    const lastBackup = pdt ? format(pdt, "yyyy-MM-dd HH:mm") : "—";
    const withinRpo = pdt ? hoursDiff(now, pdt) <= primaryRpoHours : false;
    const primaryFailed = isFail(v.primaryResult);
    const vaultFailed = isFail(v.copyResult);
    const vaultLagOk = cdt ? hoursDiff(now, cdt) <= vaultLagHours : false;
    const primaryOk = withinRpo && !primaryFailed;
    const vaultOk = cdt ? vaultLagOk && !vaultFailed : false;
    const ok = primaryOk && vaultOk;
    const rpo = withinRpo ? "Compliant" : "Breach";
    const vaultLast = cdt ? format(cdt, "yyyy-MM-dd HH:mm") : "—";
    const vaultLagText = cdt ? `${Math.floor(hoursDiff(now, cdt))}h` : "—";
    return { name: v.name, env: "Production", lastBackup, rpo, ok, vaultLast, vaultLagText, rpoOk: withinRpo };
  });
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-3">VM Protection (Primary + Vault)</h2>
      {isError ? (
        <div className="text-sm text-critical">Failed to load jobs</div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy text-primary-foreground">
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">VM Name</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Environment</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Primary Last Backup</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Primary RPO</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Vault Last Copy</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Vault Lag</th>
                <th className="text-center px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {(isLoading ? Array.from({ length: 8 }).map((_, i) => ({ name: `VM ${i + 1}`, env: "Production", lastBackup: "…", rpo: "…", vaultLast: "…", vaultLagText: "…", ok: true, rpoOk: true })) : rows).map(
                (vm, i) => (
                  <tr
                    key={vm.name}
                    className={`${!vm.ok ? "bg-critical-muted" : i % 2 === 0 ? "bg-card" : "bg-muted/40"} border-t border-border`}
                  >
                    <td className="px-4 py-2.5 font-medium text-foreground">{vm.name}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground"
                      >
                        {vm.env}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{vm.lastBackup}</td>
                    <td className="px-4 py-2.5">
                      <span className={`font-semibold text-xs ${vm.rpoOk ? "text-success" : "text-critical"}`}>{vm.rpo}</span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{(vm as unknown as { vaultLast: string }).vaultLast}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{(vm as unknown as { vaultLagText: string }).vaultLagText}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${vm.ok ? "bg-success" : "bg-critical animate-pulse-slow"}`}
                      />
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CriticalVMTable;
