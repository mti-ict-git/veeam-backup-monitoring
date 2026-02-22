2026-02-22
- Added root script dev:full to run frontend and backend concurrently using concurrently.
- Added dev:backend script to start backend via npm --prefix backend run dev.
- Installed dev dependency concurrently.
- Verified typecheck and lint; lint has pre-existing errors to be addressed next.
2026-02-22
- Phase 1 begin: wired JobSummaryCards to /api/veeam/jobs/states using react-query.
- Phase 1 begin: wired StorageUsage to /api/veeam/repositories/states with usedSpaceGB normalization.
- Added Vite dev proxy for /api to http://localhost:4000 and verified dev:full runs.
2026-02-22
- Fixed StorageUsage: clamp negative free to 0 and cap progress bar at 100%.
- Prefer API freeGB when available; derive only when absent.
2026-02-22
- Added WhatsApp notify endpoint POST /api/notify/whatsapp with Puppeteer screenshot.
- Implemented WhatsApp gateway client (form-data) and backend config for gateway and dashboard URL.
2026-02-22 22:47:33 WIB
- Phase 2: wired HeroStatus to /api/veeam/jobs/states; compute overall status and SLA.
- Implemented metrics utilities (status, compliance, risk) with unit tests.
- Implemented dynamic RiskScore with formula disclosure and live updates.
- Ran typecheck app/backend and tests; lint has pre-existing errors.
2026-02-22 22:54:11 WIB
- Phase 3: added static critical VM config with RPO hours.
- Wired CriticalVMTable to /api/veeam/jobs/states; compute last backup and RPO.
- Table highlights RPO breaches and shows live timestamps.
2026-02-22 22:56:54 WIB
- Enhanced CriticalVMTable matching: added matchIncludes tokens and latest-run selection.
- Helps map config VMs to real job names when exact matches differ.
2026-02-22 23:00:36 WIB
- Added backend endpoint /api/veeam/vms/states deriving VM list from jobs with workload=vm.
- Frontend CriticalVMTable now uses vms/states for real VM names and lastRun.
- Typechecks and tests passed; lint still has pre-existing warnings/errors.
2026-02-22 23:03:38 WIB
- Switched CriticalVMTable to list all VMs from live feed with default 24h RPO.
- Removed dependency on static critical list for rendering; keeps env as “—”.
2026-02-22 23:13:24 WIB
- Added backend endpoint /api/veeam/vms/protection aggregating Primary vs Vault per VM.
- Updated CriticalVMTable to show Primary Last Backup, Vault Last Copy, and Vault Lag.
- Defaulted env to Production, primary RPO=24h, vault lag threshold=2h.
2026-02-22 23:24:50 WIB
- Improved backend to try multiple endpoints for backup copy jobs (compatibility with VBR REST 1.2).
- Added internal client for backups listing (fallback via restore points planned).
- Awaiting vault repository name to implement restore point–based fallback.
2026-02-22 23:30:05 WIB
- Added backend route /api/veeam/jobs/copy/states to surface backup copy jobs.
- Updated UI: Critical section now shows two tables — Backup Jobs and Backup Copy Jobs.
- Added fetchCopyJobsStates and extended JobState with type/workload/status.
2026-02-22 23:38:02 WIB
- Updated HeroStatus cards per request: Protected VMs → Backup Jobs, Backup Jobs → Backup Copy Jobs.
- Counts use primary jobs and copy jobs (with fallback), SLA card unchanged.
2026-02-22 23:40:24 WIB
- Removed Backup Copy table; restored CriticalVMTable to VM Protection (Primary + Vault).
