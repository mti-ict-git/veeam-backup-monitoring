import { RefreshCw, CheckCircle2, Clock, Users, FolderSync, HardDrive } from "lucide-react";

const ReplicationHealth = () => {
  const replicationErrors = 0;
  const lastReplication = new Date(Date.now() - 25 * 60000);
  const sysvolShared = true;
  const dfsrRunning = true;

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-5">
      <h2 className="text-lg font-semibold text-foreground mb-4">Replication Status</h2>

      {replicationErrors > 0 && (
        <div className="bg-critical-muted border border-critical/30 rounded-lg p-3 mb-4 flex items-center gap-2">
          <span className="text-critical font-bold text-sm">⚠ {replicationErrors} Replication Error(s) Detected</span>
        </div>
      )}

      <div className="grid grid-cols-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-success-muted rounded-lg p-2.5">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">Healthy</p>
            <p className="text-xs text-muted-foreground">Overall Status</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-muted rounded-lg p-2.5">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {lastReplication.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-xs text-muted-foreground">Last Replication</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-muted rounded-lg p-2.5">
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{replicationErrors}</p>
            <p className="text-xs text-muted-foreground">Errors</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-muted rounded-lg p-2.5">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">3 / 3</p>
            <p className="text-xs text-muted-foreground">Partners OK</p>
          </div>
        </div>

        {/* SYSVOL Status */}
        <div className="flex items-center gap-3">
          <div className={`${sysvolShared ? "bg-success-muted" : "bg-critical-muted"} rounded-lg p-2.5`}>
            <FolderSync className="h-5 w-5 ${sysvolShared ? 'text-success' : 'text-critical'}" />
          </div>
          <div>
            <p className={`text-sm font-bold ${sysvolShared ? "text-success" : "text-critical"}`}>
              {sysvolShared ? "Shared" : "Not Shared"}
            </p>
            <p className="text-xs text-muted-foreground">SYSVOL</p>
          </div>
        </div>

        {/* DFSR Status */}
        <div className="flex items-center gap-3">
          <div className={`${dfsrRunning ? "bg-success-muted" : "bg-critical-muted"} rounded-lg p-2.5`}>
            <HardDrive className="h-5 w-5 ${dfsrRunning ? 'text-success' : 'text-critical'}" />
          </div>
          <div>
            <p className={`text-sm font-bold ${dfsrRunning ? "text-success" : "text-critical"}`}>
              {dfsrRunning ? "Running" : "Error"}
            </p>
            <p className="text-xs text-muted-foreground">DFSR</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplicationHealth;
