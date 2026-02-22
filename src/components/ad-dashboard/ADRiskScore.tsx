const ADRiskScore = () => {
  const score = 24;
  const maxScore = 100;
  const pct = (score / maxScore) * 100;

  const riskLevel = score <= 30 ? "Low" : score <= 60 ? "Medium" : "High";
  const riskColor = score <= 30 ? "text-success" : score <= 60 ? "text-warning" : "text-critical";
  const strokeColor = score <= 30 ? "hsl(152, 60%, 42%)" : score <= 60 ? "hsl(38, 92%, 50%)" : "hsl(0, 72%, 51%)";

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  const factors = [
    { label: "DC Health", status: "Good" },
    { label: "Replication", status: "Good" },
    { label: "Privilege Escalation", status: "None" },
    { label: "Failed Login Spike", status: "Elevated" },
    { label: "Disk Utilization", status: "Normal" },
  ];

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-5 flex flex-col items-center">
      <h2 className="text-lg font-semibold text-foreground mb-4 self-start">AD Risk Score</h2>
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
          <span className={`text-4xl font-bold ${riskColor}`}>{score}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">/ {maxScore}</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <span className={`text-sm font-bold ${riskColor}`}>{riskLevel} Risk</span>
      </div>

      {/* Score factors */}
      <div className="w-full mt-4 pt-3 border-t border-border space-y-1.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Score Factors</p>
        {factors.map((f) => {
          const isGood = f.status === "Good" || f.status === "None" || f.status === "Normal";
          return (
            <div key={f.label} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{f.label}</span>
              <span className={`font-medium ${isGood ? "text-success" : "text-warning"}`}>{f.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ADRiskScore;
