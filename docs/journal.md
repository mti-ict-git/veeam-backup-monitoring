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
2026-02-22 22:47:33 WIB
- Phase 2: wired HeroStatus to /api/veeam/jobs/states; compute overall status and SLA.
- Implemented metrics utilities (status, compliance, risk) with unit tests.
- Implemented dynamic RiskScore with formula disclosure and live updates.
- Ran typecheck app/backend and tests; lint has pre-existing errors.
2026-02-22 22:54:11 WIB
- Phase 3: added static critical VM config with RPO hours.
- Wired CriticalVMTable to /api/veeam/jobs/states; compute last backup and RPO.
- Table highlights RPO breaches and shows live timestamps.
