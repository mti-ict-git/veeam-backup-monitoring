export type CriticalVMConfig = {
  name: string;
  env: string;
  jobName: string;
  rpoHours: number;
  matchIncludes?: string[];
};

export const criticalVms: CriticalVMConfig[] = [
  { name: "DC-PROD-01", env: "Production", jobName: "DC-PROD-01", rpoHours: 24, matchIncludes: ["DC"] },
  { name: "SQL-PROD-01", env: "Production", jobName: "SQL-PROD-01", rpoHours: 24, matchIncludes: ["SQL"] },
  { name: "APP-PROD-02", env: "Production", jobName: "APP-PROD-02", rpoHours: 24, matchIncludes: ["APP"] },
  { name: "EXCH-PROD-01", env: "Production", jobName: "EXCH-PROD-01", rpoHours: 24, matchIncludes: ["EXCH", "EXCHANGE"] },
  { name: "FILE-PROD-01", env: "Production", jobName: "FILE-PROD-01", rpoHours: 24, matchIncludes: ["FILE"] },
  { name: "WEB-DEV-01", env: "Development", jobName: "WEB-DEV-01", rpoHours: 48, matchIncludes: ["WEB"] },
  { name: "DNS-PROD-01", env: "Production", jobName: "DNS-PROD-01", rpoHours: 24, matchIncludes: ["DNS"] },
];
