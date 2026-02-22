import { useQuery } from "@tanstack/react-query";
import { fetchJobsStates } from "@/lib/api";
import { countResults, computeRiskScore, formatPercent } from "@/lib/metrics";

const RiskScore = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["jobs-states"],
    queryFn: ({ signal }) => fetchJobsStates(signal),
  });
  const now = new Date();
  const counts = data ? countResults(data.data, now, 24) : undefined;
  const calc = counts ? computeRiskScore(counts) : { score: 0, breakdown: { compliance: 1, failDensity: 0, warnDensity: 0 } };
  const score = calc.score;
  const maxScore = 100;
  const pct = (score / maxScore) * 100;

  const riskLevel = score <= 30 ? "Low" : score <= 60 ? "Medium" : "High";
  const riskColor = score <= 30 ? "text-success" : score <= 60 ? "text-warning" : "text-critical";
  const strokeColor = score <= 30 ? "hsl(152, 60%, 42%)" : score <= 60 ? "hsl(38, 92%, 50%)" : "hsl(0, 72%, 51%)";

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-5 flex flex-col items-center">
      <h2 className="text-lg font-semibold text-foreground mb-4 self-start">Backup Risk Score</h2>
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${riskColor}`}>{isLoading ? "…" : score}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">/ {maxScore}</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <span className={`text-sm font-bold ${riskColor}`}>{riskLevel} Risk</span>
        <p className="text-xs text-muted-foreground mt-1">Based on backup health metrics</p>
      </div>
      <div className="mt-3 text-[11px] text-muted-foreground text-center">
        <div>Compliance {isLoading ? "…" : formatPercent(calc.breakdown.compliance, 1)}</div>
        <div>fail {isLoading ? "…" : formatPercent(calc.breakdown.failDensity, 1)} + warn {isLoading ? "…" : formatPercent(calc.breakdown.warnDensity, 1)}</div>
        <div>score = (1 - compl)*70 + fail*20 + warn*10</div>
      </div>
    </div>
  );
};

export default RiskScore;
