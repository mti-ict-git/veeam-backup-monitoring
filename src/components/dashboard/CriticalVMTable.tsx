import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchCopyJobsStates, fetchJobsStates, fetchVMProtection, type JobState, type VMProtection } from "@/lib/api";

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

function normalizeVmKey(value: string): string {
  const lower = value.trim().toLowerCase();
  const segment = lower.includes("\\") ? (lower.split("\\").pop() ?? lower) : lower;
  return segment.replace(/^vault[_\-\s]+/, "").replace(/\([^)]*\)/g, "").replace(/[^a-z0-9]/g, "");
}

function isCopyLike(job: JobState): boolean {
  const name = job.name.toLowerCase();
  const type = (job.type ?? "").toLowerCase();
  return name.includes("vault") || name.includes("\\") || type.includes("copy");
}

type StatusKind = "success" | "warning" | "critical";

function formatWitaDateTime(d: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

const CriticalVMTable = () => {
  const [selectedVmKey, setSelectedVmKey] = useState<string | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["vms-protection"],
    queryFn: ({ signal }) => fetchVMProtection(signal),
  });
  const jobsQuery = useQuery({
    queryKey: ["jobs-states"],
    queryFn: ({ signal }) => fetchJobsStates(signal),
  });
  const copyJobsQuery = useQuery({
    queryKey: ["jobs-copy-states"],
    queryFn: ({ signal }) => fetchCopyJobsStates(signal),
  });
  const now = new Date();
  const items: VMProtection[] = data?.data ?? [];
  const primaryRpoHours = 24;
  const vaultLagHours = 24;
  type Row = {
    vmKey: string;
    name: string;
    env: string;
    lastBackup: string;
    lastBackupRaw?: string;
    primaryResult?: string;
    rpo: string;
    vaultLast: string;
    vaultLastRaw?: string;
    copyResult?: string;
    vaultLagText: string;
    kind: StatusKind;
    rpoOk: boolean;
  };

  const rows: Row[] = items.map((v) => {
    const pdt = parseDate(v.primaryLastRun);
    const cdt = parseDate(v.copyLastRun);
    const lastBackup = pdt ? formatWitaDateTime(pdt) : "—";
    const withinRpo = pdt ? hoursDiff(now, pdt) <= primaryRpoHours : false;
    const primaryFailed = isFail(v.primaryResult);
    const vaultFailed = isFail(v.copyResult);
    const vaultLagOk = cdt ? hoursDiff(now, cdt) <= vaultLagHours : false;
    const primaryOk = withinRpo && !primaryFailed;
    const vaultOk = cdt ? vaultLagOk && !vaultFailed : undefined;
    const kind: StatusKind = !primaryOk ? "critical" : vaultOk === undefined ? "warning" : vaultOk ? "success" : "critical";
    const rpo = withinRpo ? "Compliant" : "Breach";
    const vaultLast = cdt ? formatWitaDateTime(cdt) : "—";
    const vaultLagText = cdt ? `${Math.floor(hoursDiff(now, cdt))}h` : "—";
    return {
      vmKey: v.name,
      name: v.name,
      env: "Production",
      lastBackup,
      lastBackupRaw: v.primaryLastRun,
      primaryResult: v.primaryResult,
      rpo,
      vaultLast,
      vaultLastRaw: v.copyLastRun,
      copyResult: v.copyResult,
      vaultLagText,
      kind,
      rpoOk: withinRpo,
    };
  });
  const selectedRow = selectedVmKey ? rows.find((row) => row.vmKey === selectedVmKey) : undefined;
  const selectedPrimaryJobs = useMemo(() => {
    if (!selectedVmKey) return [];
    const jobs = jobsQuery.data?.data ?? [];
    const targetKey = normalizeVmKey(selectedVmKey);
    return jobs
      .filter((job) => normalizeVmKey(job.name) === targetKey)
      .filter((job) => !isCopyLike(job))
      .sort((a, b) => {
        const ta = a.lastRun ? Date.parse(a.lastRun) : -Infinity;
        const tb = b.lastRun ? Date.parse(b.lastRun) : -Infinity;
        return tb - ta;
      });
  }, [jobsQuery.data?.data, selectedVmKey]);
  const selectedCopyJobs = useMemo(() => {
    if (!selectedVmKey) return [];
    const jobs = copyJobsQuery.data?.data ?? [];
    const targetKey = normalizeVmKey(selectedVmKey);
    return jobs
      .filter((job) => normalizeVmKey(job.name) === targetKey)
      .sort((a, b) => {
        const ta = a.lastRun ? Date.parse(a.lastRun) : -Infinity;
        const tb = b.lastRun ? Date.parse(b.lastRun) : -Infinity;
        return tb - ta;
      });
  }, [copyJobsQuery.data?.data, selectedVmKey]);

  const selectedLatestPrimaryJob = selectedPrimaryJobs[0];
  const selectedLatestCopyJob = selectedCopyJobs[0];
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
              {(isLoading
                ? Array.from({ length: 8 }).map(
                    (_, i): Row => ({
                      vmKey: `loading-${i + 1}`,
                      name: `VM ${i + 1}`,
                      env: "Production",
                      lastBackup: "…",
                      primaryResult: "Unknown",
                      rpo: "…",
                      vaultLast: "…",
                      copyResult: "Unknown",
                      vaultLagText: "…",
                      kind: "warning",
                      rpoOk: true,
                    }),
                  )
                : rows
              ).map(
                (vm, i) => (
                  <tr
                    key={vm.vmKey}
                    className={`${vm.kind === "critical" ? "bg-critical-muted" : i % 2 === 0 ? "bg-card" : "bg-muted/40"} border-t border-border`}
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
                      <button
                        type="button"
                        onClick={() => setSelectedVmKey(vm.vmKey)}
                        className={`font-semibold text-xs underline underline-offset-4 ${
                          vm.rpoOk ? "text-success hover:text-success/80" : "text-critical hover:text-critical/80"
                        }`}
                      >
                        {vm.rpo}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{vm.vaultLast}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{vm.vaultLagText}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          vm.kind === "success"
                            ? "bg-success"
                            : vm.kind === "warning"
                              ? "bg-warning"
                              : "bg-critical animate-pulse-slow"
                        }`}
                      />
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={selectedVmKey !== null} onOpenChange={(open) => (!open ? setSelectedVmKey(null) : undefined)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Primary Backup Detail</DialogTitle>
            <DialogDescription>
              {selectedRow ? `${selectedRow.name} backup history and current protection state.` : "Backup detail"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground mb-1">Primary Last Backup</div>
              <div className="font-medium text-foreground">{selectedRow?.lastBackup ?? "—"}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground mb-1">Primary Result</div>
              <div className="font-medium text-foreground">{selectedRow?.primaryResult || "Unknown"}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground mb-1">Primary RPO</div>
              <div className={`font-semibold ${selectedRow?.rpoOk ? "text-success" : "text-critical"}`}>{selectedRow?.rpo ?? "—"}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground mb-1">Vault Last Copy</div>
              <div className="font-medium text-foreground">{selectedRow?.vaultLast ?? "—"}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 md:col-span-2">
              <div className="text-xs text-muted-foreground mb-1">Backup Copy Name</div>
              <div className="font-medium text-foreground">{selectedLatestCopyJob?.name ?? "—"}</div>
            </div>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider bg-navy text-primary-foreground">
              Matched Primary Jobs
            </div>
            {jobsQuery.isLoading ? (
              <div className="px-3 py-3 text-sm text-muted-foreground">Loading backup job details…</div>
            ) : selectedPrimaryJobs.length === 0 ? (
              <div className="px-3 py-3 text-sm text-muted-foreground">No primary backup job detail found for this VM key.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-t border-border">
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider">Job Name</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider">Last Run</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider">Result</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPrimaryJobs.slice(0, 8).map((job, index) => (
                    <tr key={`${job.name}-${job.lastRun ?? index}`} className="border-t border-border">
                      <td className="px-3 py-2 text-foreground">{job.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {job.lastRun ? formatWitaDateTime(new Date(job.lastRun)) : "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{job.lastResult || "Unknown"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{job.status || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider bg-navy text-primary-foreground">
              Matched Backup Copy Jobs
            </div>
            {copyJobsQuery.isLoading ? (
              <div className="px-3 py-3 text-sm text-muted-foreground">Loading backup copy job details…</div>
            ) : selectedCopyJobs.length === 0 ? (
              <div className="px-3 py-3 text-sm text-muted-foreground">No backup copy job detail found for this VM key.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-t border-border">
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider">Copy Job Name</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider">Last Run</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider">Result</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCopyJobs.slice(0, 8).map((job, index) => (
                    <tr key={`${job.name}-${job.lastRun ?? index}`} className="border-t border-border">
                      <td className="px-3 py-2 text-foreground">{job.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {job.lastRun ? formatWitaDateTime(new Date(job.lastRun)) : "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{job.lastResult || "Unknown"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{job.type || "BackupCopy"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {selectedLatestPrimaryJob?.message ? (
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
              <div className="text-xs text-muted-foreground mb-1">Latest Message</div>
              <div className="text-foreground">{selectedLatestPrimaryJob.message}</div>
            </div>
          ) : null}
          <div className="text-xs text-muted-foreground">
            Primary raw: {selectedRow?.lastBackupRaw ?? "—"} | Vault raw: {selectedRow?.vaultLastRaw ?? "—"} | Vault result:{" "}
            {selectedRow?.copyResult ?? "Unknown"}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CriticalVMTable;
