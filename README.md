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
  - `WHATSAPP_GATEWAY_URL=http://<gateway-host>:8192/send-group-message`
  - `DASHBOARD_URL=http://localhost:8080/`
- Start both services:
  - `npm run dev:full`
- Send a report with screenshot:
  - `POST http://localhost:4000/api/notify/whatsapp`
  - Body:
    ```
    {
      "chatId": "120363123402010871@g.us",
      "caption": "Your caption here",
      "url": "http://localhost:8080/"
    }
    ```

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
