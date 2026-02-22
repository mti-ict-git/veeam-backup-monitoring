# Veeam Backup Monitoring – Integration Plan

This document describes how to replace dashboard mock data with live data from the backend proxy and identifies the data required to deliver a complete backup monitoring experience. Work is organized into phases for incremental delivery.

## Phase 1 — Wire Job Summary and Storage Usage
- Replace job summary cards with data from GET /api/veeam/jobs/states.
- Replace repository storage usage with data from GET /api/veeam/repositories/states.
- Derivations:
  - Job counts: total, success, warning, failed, running (match on lastResult fields).
  - Repository usage: usedSpaceGB, capacityGB → percentage; derive used when absent using capacityGB − freeGB.
- UI updates:
  - components/dashboard/JobSummaryCards.tsx uses react-query to fetch and render counts.
  - components/dashboard/StorageUsage.tsx uses react-query to fetch and render usage bars.
- Acceptance:
  - Loading and error states are visible.
  - Values match the Veeam API when compared against Swagger.

## Phase 2 — Hero Status, SLA Compliance, Risk Score
- Hero “Overall Backup Status”:
  - Compute status from job results: CRITICAL if any failed in last 24h; WARNING if warnings exist; HEALTHY otherwise.
  - “Report Date” uses current time; “Last Sync” derives from fetch time.
- SLA Compliance:
  - Compute as Success/(Success+Warning+Failed) for recent window (e.g., last 24h) or all jobs if time not available.
- Risk Score:
  - Map compliance and failure density into a 0–100 score; store calculation next to component for transparency.
- Acceptance:
  - Status transitions correctly when API data changes.
  - Risk score updates with new results.

## Phase 3 — Critical Infrastructure Table
- Goal: populate the “Critical Infrastructure Protection” table.
- Options:
  - Static configuration for critical VM list with last backup status pulled from jobs/states detail.
  - If an endpoint exists for protected objects/VM states, prefer it for live data.
- Derivations:
  - Last backup time, RPO status (compliant/breach) using lastRun and expected interval configuration.
- Acceptance:
  - Table highlights breaches and shows live last backup timestamps.

## Phase 4 — Restore Readiness
- Show last restore test, result, duration, and SureBackup status.
- Data sources:
  - Restore session history endpoints (if provided by Veeam API) for last test time/result/duration.
  - SureBackup configuration/health endpoint for feature enablement.
- Acceptance:
  - “Verified & Ready” only when last test is success and within policy window; otherwise WARNING.
- UX flow:
  - User lands on dashboard and sees Restore Readiness card with status, last test time, duration, and SureBackup.
  - If restore data is missing, show “Not Configured” with callout state and no success badge.
  - If SureBackup is disabled, show WARNING and prompt for enablement.
- Component tree (web, Shadcn UI + Tailwind):
  - RestoreReadiness
    - Card
      - CardHeader
        - CardTitle
        - Badge (status)
      - CardContent
        - StatRow (Last Test)
        - StatRow (Result)
        - StatRow (Duration)
        - StatRow (SureBackup)
      - CardFooter
        - Button (View Details)
- Component tree (mobile, React Native Paper/Tamagui):
  - RestoreReadinessCard
    - Card
      - Card.Title
      - Chip (status)
      - Card.Content
        - XStack/YStack rows
          - Text (label)
          - Text (value)
      - Button (View Details)
- Responsive layout (web):
  - Use the 12-column grid pattern for cards and details.
  - Example:
    - <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 md:col-span-6">Restore Readiness</div>
      <div className="col-span-12 md:col-span-6">Risk Score</div>
    - </div>
- Backend endpoints:
  - GET /api/veeam/restore/tests/latest
    - Response: { data: { lastTestAt: string | null, result: "Success" | "Warning" | "Failed" | "Unknown", durationMinutes: number | null } }
  - GET /api/veeam/surebackup/status
    - Response: { data: { enabled: boolean, lastCheckAt: string | null } }
- Status logic:
  - Verified & Ready when result = Success and lastTestAt within policy window (e.g., 30 days) and SureBackup enabled.
  - WARNING otherwise, with reason derived from missing or stale data.
- Sample React (web) with theming:
  - 
    ```tsx
    import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
    import { Badge } from "@/components/ui/badge";
    import { Button } from "@/components/ui/button";

    type RestoreReadinessData = {
      lastTestAt: string | null;
      result: "Success" | "Warning" | "Failed" | "Unknown";
      durationMinutes: number | null;
      sureBackupEnabled: boolean;
    };

    export function RestoreReadinessCard({ data }: { data: RestoreReadinessData }) {
      const verified = data.result === "Success" && data.sureBackupEnabled;
      const badge = verified ? "Verified & Ready" : "Attention Needed";
      return (
        <Card className="bg-card text-foreground">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Restore Readiness</CardTitle>
            <Badge variant={verified ? "default" : "destructive"}>{badge}</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Test</span>
              <span>{data.lastTestAt ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Result</span>
              <span>{data.result}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span>{data.durationMinutes ? `${data.durationMinutes} min` : "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">SureBackup</span>
              <span>{data.sureBackupEnabled ? "Enabled" : "Disabled"}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline">View Details</Button>
          </CardFooter>
        </Card>
      );
    }
    ```
- Sample React Native (mobile) with theming:
  - 
    ```tsx
    import { MD3LightTheme, Provider as PaperProvider, Card, Text, Chip, Button } from "react-native-paper";
    import { View } from "react-native";

    const theme = {
      ...MD3LightTheme,
      colors: {
        ...MD3LightTheme.colors,
        primary: "#1F3A8A",
      },
    };

    type RestoreReadinessData = {
      lastTestAt: string | null;
      result: "Success" | "Warning" | "Failed" | "Unknown";
      durationMinutes: number | null;
      sureBackupEnabled: boolean;
    };

    export function RestoreReadinessCardMobile({ data }: { data: RestoreReadinessData }) {
      const verified = data.result === "Success" && data.sureBackupEnabled;
      return (
        <PaperProvider theme={theme}>
          <Card>
            <Card.Title title="Restore Readiness" />
            <Card.Content>
              <Chip style={{ marginBottom: 8 }}>{verified ? "Verified & Ready" : "Attention Needed"}</Chip>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text>Last Test</Text>
                <Text>{data.lastTestAt ?? "—"}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text>Result</Text>
                <Text>{data.result}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text>Duration</Text>
                <Text>{data.durationMinutes ? `${data.durationMinutes} min` : "—"}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text>SureBackup</Text>
                <Text>{data.sureBackupEnabled ? "Enabled" : "Disabled"}</Text>
              </View>
            </Card.Content>
            <Card.Actions>
              <Button>View Details</Button>
            </Card.Actions>
          </Card>
        </PaperProvider>
      );
    }
    ```

## Phase 5 — Backend Hardening and Config
- Secrets and TLS:
  - Use .env for credentials; avoid committing secrets; enforce TLS with trusted CA when available.
  - Allow VEEAM_INSECURE_TLS only in development.
- Gateway:
  - Continue to proxy through /backend, centralizing token management and x-api-version.
  - Add retry/backoff for transient upstream errors.
- API stability:
  - Normalize upstream variations (derive usedSpaceGB when absent).

## Phase 6 — Auto-Refresh, Caching, and Notifications
- Auto-refresh:
  - Poll every 60–120 seconds for jobs and repositories to keep dashboard fresh.
- Caching:
  - Use react-query cache with stale time to balance freshness and efficiency.
- Notifications:
  - Optional webhook/integrations for failures or capacity thresholds.

---

## Data Inventory and Mapping

### Jobs (GET /api/veeam/jobs/states)
- Fields used:
  - name: display and identification.
  - lastResult: categorize into Success/Warning/Failed/Running.
  - lastRun: for recent window calculations and hero sync context.
  - message: show in failure details if needed.
- Components:
  - JobSummaryCards: aggregates counts.
  - HeroStatus: overall status and SLA compliance.
  - CriticalVMTable: last backup status for critical VMs.

### Repositories (GET /api/veeam/repositories/states)
- Fields used:
  - name, path: display.
  - capacityGB, freeGB, usedSpaceGB: usage bars and thresholds.
- Components:
  - StorageUsage: usage percent; critical thresholds at >85%, warning at >70%.
  - RiskScore: factor storage pressure into score if desired.

### Future Endpoints (subject to API availability)
- Restore sessions history for last test status/duration.
- Protected objects/VM backup states for per-VM health.
- SureBackup configuration/health.

---

## Frontend/Backend Contract
- Backend:
  - GET /api/veeam/jobs/states → { data: JobState[] }
  - GET /api/veeam/repositories/states → { data: RepositoryState[] } with usedSpaceGB normalized.
- Frontend:
  - Uses react-query and Vite dev proxy for /api → http://localhost:4000.
  - Graceful loading and error handling in JobSummaryCards and StorageUsage.

---

## Testing and Validation
- Unit:
  - Pure functions for aggregation and percentage calculations.
- Integration:
  - Mock fetch for react-query hooks; verify loading and error render paths.
- Manual:
  - Compare dashboard numbers with Swagger or curl results.

---

## Rollout Steps
1. Phase 1 live integration to replace mock data (completed in code).
2. Add hero status and SLA calculations.
3. Implement Critical VM table with config or endpoint.
4. Implement Restore Readiness based on available endpoints.
5. Add auto-refresh and finalize risk score.
6. Harden backend and enable production TLS.
