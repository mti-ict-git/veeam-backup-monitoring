const topMemory = [
  { name: "postgres-db", usage: 2.4 },
  { name: "api-gateway", usage: 1.8 },
  { name: "worker-queue", usage: 1.2 },
  { name: "auth-service", usage: 0.9 },
  { name: "log-collector", usage: 0.6 },
];

const cpuPct = 34;
const memPct = 62;

function barColor(pct: number) {
  if (pct > 85) return "bg-critical";
  if (pct > 70) return "bg-warning";
  return "bg-success";
}

function textColor(pct: number) {
  if (pct > 85) return "text-critical";
  if (pct > 70) return "text-warning";
  return "text-success";
}

const maxMem = Math.max(...topMemory.map((t) => t.usage));

const ResourceOverview = () => (
  <div className="bg-card rounded-xl shadow-sm border border-border p-5">
    <h2 className="text-base font-semibold text-foreground mb-4">Resource Overview</h2>

    <div className="grid grid-cols-2 gap-6 mb-5">
      {[
        { label: "CPU Usage", pct: cpuPct },
        { label: "Memory Usage", pct: memPct },
      ].map((r) => (
        <div key={r.label}>
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">{r.label}</span>
            <span className={`text-lg font-bold ${textColor(r.pct)}`}>{r.pct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full ${barColor(r.pct)} transition-all duration-500`} style={{ width: `${r.pct}%` }} />
          </div>
        </div>
      ))}
    </div>

    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Top 5 by Memory (GB)</p>
      <div className="space-y-2">
        {topMemory.map((t) => {
          const w = (t.usage / maxMem) * 100;
          return (
            <div key={t.name} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-28 truncate">{t.name}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-navy transition-all duration-500" style={{ width: `${w}%` }} />
              </div>
              <span className="text-xs font-semibold text-foreground w-12 text-right">{t.usage} GB</span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export default ResourceOverview;
