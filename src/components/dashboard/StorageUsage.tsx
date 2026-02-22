import { HardDrive } from "lucide-react";

const repos = [
  { name: "Primary Backup Repository", total: "20 TB", used: "14.2 TB", free: "5.8 TB", pct: 71 },
  { name: "Secondary Offsite Repo", total: "15 TB", used: "8.1 TB", free: "6.9 TB", pct: 54 },
  { name: "Archive Cold Storage", total: "50 TB", used: "44.5 TB", free: "5.5 TB", pct: 89 },
];

const getBarColor = (pct: number) => {
  if (pct > 85) return "bg-critical";
  if (pct > 70) return "bg-warning";
  return "bg-success";
};

const StorageUsage = () => (
  <div>
    <h2 className="text-lg font-semibold text-foreground mb-3">Repository Storage Usage</h2>
    <div className="grid grid-cols-3 gap-3">
      {repos.map((r) => (
        <div key={r.name} className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive className="h-4 w-4 text-navy" />
            <span className="text-sm font-semibold text-foreground truncate">{r.name}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Used: {r.used}</span>
            <span>Free: {r.free}</span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${getBarColor(r.pct)} transition-all`}
              style={{ width: `${r.pct}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-muted-foreground">{r.total} total</span>
            <span className={`text-sm font-bold ${r.pct > 85 ? "text-critical" : r.pct > 70 ? "text-warning" : "text-success"}`}>
              {r.pct}%
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default StorageUsage;
