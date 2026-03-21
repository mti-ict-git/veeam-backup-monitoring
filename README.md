# Veeam Backup Monitoring – Dev Setup

## Project info

Local frontend: http://localhost:8080/
Local backend: http://localhost:4000/

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Provide environment for Veeam API in .env at project root
echo "VEEAM_USERNAME=<user>" >> .env
echo "VEEAM_PASSWORD=<pass>" >> .env
echo "VEEAM_HOST=10.60.10.128:9419" >> .env
echo "VEEAM_INSECURE_TLS=true" >> .env
echo "CORS_ORIGIN=http://localhost:8080" >> .env
echo "VEEAM_RESTORE_TESTS_PATH=<vbr-restore-tests-endpoint-path>" >> .env
echo "VEEAM_SUREBACKUP_STATUS_PATH=<vbr-surebackup-status-endpoint-path>" >> .env

# Step 5: Start both backend and frontend together
npm run dev:full
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Express (backend proxy)
- Axios (backend HTTP client)

## Backup Copy API Notes

- Endpoint: `GET /api/veeam/jobs/copy/states`
- Primary source: Veeam `jobs/states` and `sessions` copy filters.
- Fallback source: Veeam `backups` listing for `Vault_*` or copy-like names when copy state endpoints return empty.
- Fallback freshness logic: match normalized Vault/base names to latest `sessions` data, then use backup timestamps only when session match is unavailable.
- Fallback count guard: skip orphan `Vault_*` records when `jobId` is zero, no session match exists, and no backup point time is present.
- Disabled guard: copy entries are excluded when their normalized base key matches a disabled job in `jobs/states`.
- Pre-run guard: do not infer copy Success from older base-job sessions; require session timestamp at/after backup `creationTime` or a backup point.
- Regex matching: backup copy fallback now prefers regex matches against session names in `Vault_X\X (...)` format, with disabled jobs still excluded.

## VM Protection API Notes

- Endpoint: `GET /api/veeam/vms/protection`
- Row source priority: use normalized keys from primary jobs when primary data is available.
- Copy jobs enrich vault columns only and do not create additional rows when primary keys exist.
- Dashboard focus: VM Protection table is the primary operational view; standalone Backup Copy table is hidden.
- Primary RPO UX: each RPO value is clickable and opens a modal with matched primary backup-job details.
- Modal verification UX: shows backup copy job name and matched backup copy job list for direct Veeam console cross-checking.

## WhatsApp Daily Report (Backend)

- Configure these in `.env`:
  - `WHATSAPP_API_URL=http://<gateway-host>:8192/send-group-message`
  - `WHATSAPP_GROUP_ID=<group-id>`
  - `DASHBOARD_URL=http://localhost:8080/`
  - `REPORT_ENABLED=true`                      # aktifkan scheduler
  - `REPORT_AT=01:00`                          # jam WIB harian, alternatif ke CRON
  - `REPORT_SCHEDULE_CRON=0 1 * * *`           # ekspresi cron (override REPORT_AT)
  - `REPORT_TIMEZONE=Asia/Jakarta`             # zona waktu
  - `REPORT_CAPTION_TIMEZONE=Asia/Jakarta`     # zona waktu yang ditampilkan pada caption
  - `REPORT_CAPTION_TZ_LABEL=WIB`              # label TZ pada caption (mis. WIB/WITA/+08:00)
  - `REPORT_CAPTION_MODE=full`                 # full | short
  - `REPORT_HIDE_SIDEBAR=true`                 # sembunyikan sidebar pada screenshot
  - `REPORT_URL=http://localhost:8080/`        # URL dashboard untuk screenshot
  - `REPORT_FOOTER_URL=https://monitoring.merdekabattery.com/`  # URL di footer caption
  - `REPORT_ON_START=false`                    # kirim sekali saat start
  - `# REPORT_CHAT_ID=<group-id>`              # OPSIONAL. Jika tidak diisi, pakai WHATSAPP_GROUP_ID
- Start both services:
  - `npm run dev:full`
- Send a report with screenshot:
  - `POST http://localhost:4000/api/notify/whatsapp`
  - Body:
    ```
    {
      "chatId": "<group-id>",
      "caption": "Your caption here",
      "url": "http://localhost:8080/"
    }
    ```
- Screenshot readiness: report capture now menunggu kesiapan data dari API `/api/veeam/vms/protection` (minimum 80% baris Vault terisi) lalu memverifikasi stabilitas kolom `Vault Last Copy` dan `Vault Lag` di UI sebelum capture, dengan satu reload retry jika belum siap.
  
- Scheduler:
  - Scheduler akan memanggil endpoint internal pada jadwal yang dikonfigurasi.
  - Gunakan `REPORT_AT` untuk jadwal harian sederhana (HH:MM di `REPORT_TIMEZONE`) atau `REPORT_SCHEDULE_CRON` untuk pola berulang kustom.
  - Pastikan `REPORT_ENABLED=true`.
  - Jika `REPORT_CHAT_ID` tidak di-set, scheduler otomatis memakai `WHATSAPP_GROUP_ID`.

## Docker Monitoring (Portainer Real Data)

- Tambahkan env berikut di `.env`:
  - `PORTAINER_URL=https://portainer.merdekabattery.com`
  - `PORTAINER_USERNAME=admin`
  - `PORTAINER_PASSWORD=<password>`
- Backend endpoint:
  - `GET /api/docker/overview`
- Frontend halaman `/docker` sekarang menggunakan data live dari endpoint tersebut untuk:
  - Hero status container + modal detail per metric card (Total, Running, Unhealthy, Restarting, Stopped)
  - Summary cards (running, unhealthy, restarting, stopped, no healthcheck) + modal detail per kartu
  - Restart anomaly
  - Health check panel + modal detail per baris
  - Stack overview + modal detail per baris
  - Resource overview (CPU, memory, top memory)
  - Docker risk score
- Jika env Portainer belum diisi, endpoint akan mengembalikan `503`.
- Respons `503` sekarang juga menampilkan `missingEnv` agar cepat tahu env mana yang belum tersedia di production.
- Query cache frontend sekarang disimpan di `sessionStorage` untuk mengurangi cold refetch setelah browser refresh.

## Docker Compose

- Build dan jalan:
  - `docker compose build`
  - `docker compose up -d`
- Service:
  - Web (Vite build + Nginx): http://localhost:8085/
  - Backend (Express + Puppeteer): http://localhost:4000/
- Env:
  - File `.env` di root dipakai untuk service backend.
  - `DASHBOARD_URL` otomatis diset ke `http://web/` via compose agar screenshot mengarah ke service web (internal port 80).
- Uji kirim manual:
  - `POST http://localhost:4000/api/notify/whatsapp`
  - Body minimal:
    ```
    { "auto": true, "captionMode": "full", "hideSidebar": true }
    ```
- Logs:
  - `docker compose logs -f backend`
  - `docker compose logs -f web`

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
