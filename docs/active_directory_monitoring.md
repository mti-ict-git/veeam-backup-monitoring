Active Directory Monitoring - Real Data Integration Plan

Scope and Goal
- Replace mock data in AD dashboard components with live data
- Keep current UI layout and visual styles while adding loading, empty, and error states
- Establish stable frontend-backend contracts for AD metrics

Frontend Inventory
- Page composition in ActiveDirectory.tsx
  - ADHeroStatus
  - DCHealthPanel
  - ReplicationHealth
  - SecurityMonitoring
  - PrivilegeChanges
  - ADRiskScore

Data Contracts and Sources
- AD summary status
  - Inputs: DC online/offline count, replication error count, SYSVOL status, critical privilege change flag
  - Source: AD health collector service
- DC health metrics
  - Inputs: CPU, memory, disk, uptime, NTDS/Netlogon status, time drift
  - Source: WMI/Perf counters, Windows services status, time sync check
- Replication status
  - Inputs: last replication time, error count, partner health, SYSVOL/DFSR
  - Source: repadmin, DFSR status, SYSVOL share health
- Security events
  - Inputs: new users, domain admin adds, lockouts, failed logins, 4672 privileged logons
  - Source: Windows Event Logs (Security log)
- Privilege and group changes
  - Inputs: event list with type, account, target group, time, severity
  - Source: Windows Event Logs (4728/4729/4732/4733/4724/4725)
- Risk score
  - Inputs: weighted factors from DC health, replication, privilege changes, failed login spikes, disk utilization
  - Source: derived in frontend from API response or computed in backend and exposed in response

Backend API Plan
- Create REST endpoints under /api/ad
  - GET /api/ad/summary
  - GET /api/ad/dcs
  - GET /api/ad/replication
  - GET /api/ad/security-events
  - GET /api/ad/privilege-changes
  - GET /api/ad/risk-score
- Define response shapes in shared types
- Add caching and polling guards on backend collectors

Share Folder Output Plan (Windows)
- PowerShell collector writes JSON output to a Windows shared folder
- Backend reads JSON files from the share and serves /api/ad endpoints
- Suggested files
  - summary.json
  - dcs.json
  - replication.json
  - security-events.json
  - privilege-changes.json
  - risk-score.json
- Write strategy
  - Write to temp file then atomically rename to avoid partial reads
  - Include generatedAt timestamp in each file
- Access strategy
  - Backend uses a read-only credential to access the share
  - Share permissions scoped to the output folder only

Frontend Integration Plan
- Create react-query hooks for each endpoint
- Add loading, error, and empty states per component
- Replace mock arrays with data from hooks
- Add refresh cadence (polling 60-120s)
- Use consistent timezone formatting for timestamps

UI Validation Plan
- Match component rendering with API responses
- Add unit tests for risk score and status derivation
- Add integration test coverage for hooks and error paths

Rollout Steps
- Phase 1: Wire ADHeroStatus and DCHealthPanel to live data
- Phase 2: Wire ReplicationHealth and SecurityMonitoring
- Phase 3: Wire PrivilegeChanges and ADRiskScore
- Phase 4: Add polling and alert thresholds
