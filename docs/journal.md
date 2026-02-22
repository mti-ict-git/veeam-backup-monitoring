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
2026-02-23 00:25 WIB
- Fixed WhatsApp image upload by switching to Node http/https with fs stream.
- Added /api/notify/screenshot for debugging; verified text-only and screenshot sends.
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
2026-02-22 23:55:12 WIB
- Updated vault lag threshold to 24 hours for VM Protection status.
2026-02-23 00:10:26 WIB
- Display timestamps in WITA (Asia/Makassar) for hero and VM protection table.
2026-02-23 00:22:21 WIB
- Expanded Phase 4 Restore Readiness spec with UX flow, components, responsive layout, endpoints, and samples.
2026-02-23 00:37:11 WIB
- Added Restore Readiness backend endpoints with configurable VBR paths.
- Wired Restore Readiness card to live API data with 7-day policy logic.
- Added env entries to README for Restore Test and SureBackup endpoints.
2026-02-23 00:43:09 WIB
- Screenshot: collapse sidebar by cookie before load; target main element for capture.
- Notify: add caption builder from live Veeam data; ASCII-only, newline-normalized.
- Notify: implement short/full modes; full sends image then split caption chunks.
- WhatsApp: switch multipart to axios; add fallback and status handling.
- Typecheck passed; manual sends work with provided caption; auto flow improved.
2026-02-23 00:52:09 WIB
- WA send pipeline hardened: catch 422 in gateway client and fallback.
- Text-only path now uses chunked send with emoji→ASCII fallback per chunk.
- Verified: image sent with sidebar hidden, then caption delivered in chunks.
2026-02-23 00:56:55 WIB
- Implemented single-message send: image with full caption together.
- Progressive fallback: pretty → ASCII → trimmed (900/700/512/300) to pass gateway.
- Verified endpoint: POST /api/notify/whatsapp auto:true captionMode:full returns 200.
2026-02-23 01:07:18 WIB
- Fix repository usage percent in caption: clamp used≤capacity and pct≤100%.
- Verified text-only auto caption returns 200 and shows bounded percentages.
2026-02-23 01:18:11 WIB
- Switch WhatsApp env to WHATSAPP_API_URL with fallback to old var.
- Updated README env docs (WHATSAPP_API_URL, WHATSAPP_GROUP_ID).
2026-02-23 01:23:30 WIB
- Add scheduler with node-cron; supports REPORT_AT, REPORT_SCHEDULE_CRON, timezone.
- Expose envs: REPORT_ENABLED, REPORT_CAPTION_MODE, REPORT_HIDE_SIDEBAR, REPORT_URL, REPORT_CHAT_ID, REPORT_ON_START.
- README updated with scheduler usage and env examples.
2026-02-23 01:33:02 WIB
- Make caption timezone configurable via REPORT_CAPTION_TIMEZONE and REPORT_CAPTION_TZ_LABEL.
- Updated caption time/date and restore test date to use configured TZ.
2026-02-23 01:41:20 WIB
- Clarify env: REPORT_CHAT_ID is optional; defaults to WHATSAPP_GROUP_ID in scheduler.
- README examples updated to omit REPORT_CHAT_ID by default.
2026-02-23 01:53:49 WIB
- Add Dockerfiles and docker-compose for web and backend (Puppeteer base).
- Set compose to route DASHBOARD_URL to http://web:8080/.
- Add .dockerignore files and README Docker instructions.
2026-02-23 02:09:42 WIB
- Change docker-compose web port to 8085:80; fix README references.
- Set backend DASHBOARD_URL to http://web/ (internal port 80).
2026-02-23 02:15:08 WIB
- Fix Dockerfile backend permissions: use pptruser workspace, chown, npm ci.
- Guidance: rebuild images with 'docker compose build' on server.
2026-02-23 02:26:59 WIB
- Fix Node ESM resolution in container: use --experimental-specifier-resolution=node via npm start.
- Dockerfile now runs 'npm start' in backend working dir.
