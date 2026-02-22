import cron from "node-cron";
import axios from "axios";
import { loadConfig } from "./config";

export function startReportScheduler() {
  const cfg = loadConfig();
  const enabled = (process.env.REPORT_ENABLED ?? "false").toLowerCase() === "true";
  if (!enabled) return;
  const at = process.env.REPORT_AT;
  let cronExpr = process.env.REPORT_SCHEDULE_CRON ?? "";
  if (!cronExpr && at && /^\d{2}:\d{2}$/.test(at)) {
    const [hh, mm] = at.split(":");
    cronExpr = `${Number(mm)} ${Number(hh)} * * *`;
  }
  if (!cronExpr) {
    cronExpr = "0 1 * * *";
  }
  const timezone = process.env.REPORT_TIMEZONE ?? "Asia/Jakarta";
  const chatId = process.env.REPORT_CHAT_ID ?? process.env.WHATSAPP_GROUP_ID;
  const captionMode = (process.env.REPORT_CAPTION_MODE ?? "full") as "full" | "short";
  const hideSidebar = (process.env.REPORT_HIDE_SIDEBAR ?? "true").toLowerCase() === "true";
  const url = process.env.REPORT_URL ?? cfg.dashboardUrl;
  const onStart = (process.env.REPORT_ON_START ?? "false").toLowerCase() === "true";
  if (!cron.validate(cronExpr)) return;
  const task = cron.schedule(
    cronExpr,
    async () => {
      await runOnce();
    },
    { timezone },
  );
  task.start();
  if (onStart) {
    setTimeout(() => {
      void runOnce();
    }, 3000);
  }

  async function runOnce(): Promise<void> {
    try {
      const body = {
        chatId,
        auto: true,
        captionMode,
        hideSidebar,
        url,
      };
      await axios.post(`http://localhost:${cfg.port}/api/notify/whatsapp`, body, {
        headers: { "Content-Type": "application/json" },
        maxBodyLength: Infinity,
      });
    } catch {
      /* no-op */
    }
  }
}
