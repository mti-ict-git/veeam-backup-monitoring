import { HardDrive } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchRepositoriesStates, type RepositoryState } from "@/lib/api";

function getPct(r: RepositoryState) {
  const cap = r.capacityGB ?? 0;
  const used = r.usedSpaceGB ?? 0;
  if (!cap) return 0;
  return Math.round((used / cap) * 100);
}

function humanTB(gb: number | undefined) {
  if (!gb) return "0 TB";
  return `${(gb / 1024).toFixed(1)} TB`;
}

function getBarColor(pct: number) {
  if (pct > 85) return "bg-critical";
  if (pct > 70) return "bg-warning";
  return "bg-success";
}

const StorageUsage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["repositories-states"],
    queryFn: ({ signal }) => fetchRepositoriesStates(signal),
  });

  const repos = data?.data ?? [];

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-3">Repository Storage Usage</h2>
      {isError ? (
        <div className="text-sm text-critical">Failed to load repositories</div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {(isLoading ? Array.from({ length: 3 }).map((_, i) => ({ name: `Repository ${i + 1}` })) : repos).map(
            (r, idx) => {
              const pct = isLoading ? 0 : getPct(r as RepositoryState);
              const used = isLoading ? undefined : (r as RepositoryState).usedSpaceGB;
              const cap = isLoading ? undefined : (r as RepositoryState).capacityGB;
              const free = isLoading
                ? undefined
                : cap !== undefined && used !== undefined
                  ? cap - used
                  : undefined;
              return (
                <div key={`${(r as RepositoryState).name}-${idx}`} className="bg-card rounded-xl shadow-sm border border-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <HardDrive className="h-4 w-4 text-navy" />
                    <span className="text-sm font-semibold text-foreground truncate">
                      {(r as RepositoryState).name}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>Used: {isLoading ? "…" : humanTB(used)}</span>
                    <span>Free: {isLoading ? "…" : humanTB(free)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getBarColor(pct)} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-muted-foreground">{isLoading ? "…" : `${humanTB(cap)} total`}</span>
                    <span
                      className={`text-sm font-bold ${pct > 85 ? "text-critical" : pct > 70 ? "text-warning" : "text-success"}`}
                    >
                      {isLoading ? "…" : `${pct}%`}
                    </span>
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}
    </div>
  );
};

export default StorageUsage;
