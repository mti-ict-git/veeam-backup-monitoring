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
  - `REPORT_CHAT_ID=<group-id>`                # opsional; default ke WHATSAPP_GROUP_ID
  - `REPORT_ON_START=false`                    # kirim sekali saat start
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
  
- Scheduler:
  - Scheduler akan memanggil endpoint internal pada jadwal yang dikonfigurasi.
  - Gunakan `REPORT_AT` untuk jadwal harian sederhana (HH:MM di `REPORT_TIMEZONE`) atau `REPORT_SCHEDULE_CRON` untuk pola berulang kustom.
  - Pastikan `REPORT_ENABLED=true`.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
