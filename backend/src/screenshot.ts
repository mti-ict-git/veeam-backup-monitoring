import puppeteer from "puppeteer";
import { loadConfig } from "./config.js";

export interface ScreenshotOptions {
  url?: string;
  width?: number;
  height?: number;
  fullPage?: boolean;
  hideSidebar?: boolean;
}

export async function captureDashboard(opts?: ScreenshotOptions): Promise<Buffer> {
  const cfg = loadConfig();
  const url = opts?.url ?? cfg.dashboardUrl;
  const width = opts?.width ?? 1280;
  const height = opts?.height ?? 720;
  const fullPage = opts?.fullPage ?? false;
  const hideSidebar = opts?.hideSidebar ?? true;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 2 });
    const target = new URL(url);
    if (hideSidebar) {
      await page.setCookie({
        name: "sidebar:state",
        value: "false",
        domain: target.hostname,
        path: "/",
      });
    }
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60_000 });
    if (hideSidebar) {
      await page.addScriptTag({ content: 'document.cookie="sidebar:state=false; path=/; max-age=604800";' });
      await page.reload({ waitUntil: "networkidle0" });
      await page.waitForSelector('[data-state="collapsed"]', { timeout: 2000 }).catch(() => {});
    }
    const apiReadyCheck = `async () => {
      try {
        const response = await fetch("/api/veeam/vms/protection", { cache: "no-store" });
        if (!response.ok) return false;
        const payload = await response.json();
        const rows = Array.isArray(payload && payload.data) ? payload.data : [];
        if (rows.length === 0) return false;
        const readyRows = rows.filter((row) => {
          const copy = typeof row.copyLastRun === "string" ? row.copyLastRun.trim() : "";
          return copy.length > 0;
        }).length;
        const minReadyRows = Math.max(1, Math.ceil(rows.length * 0.8));
        const stableSource = rows.map((row) => {
          const name = typeof row.name === "string" ? row.name : "";
          const copy = typeof row.copyLastRun === "string" ? row.copyLastRun : "";
          return name + "|" + copy;
        }).join(";");
        const prevSource = typeof window.__veeamApiStableSource === "string" ? window.__veeamApiStableSource : "";
        const prevCount = typeof window.__veeamApiStableCount === "number" ? window.__veeamApiStableCount : 0;
        const nextCount = prevSource === stableSource ? prevCount + 1 : 1;
        window.__veeamApiStableSource = stableSource;
        window.__veeamApiStableCount = nextCount;
        return readyRows >= minReadyRows && nextCount >= 2;
      } catch {
        return false;
      }
    }`;
    const vaultColumnsReadyCheck = `() => {
      const reportReady = Boolean(window.__veeamReportReady);
      const reportSignature = typeof window.__veeamReportSignature === "string" ? window.__veeamReportSignature : "";
      const table = Array.from(document.querySelectorAll("table")).find((node) => {
        const text = (node.textContent || "").toLowerCase();
        return text.includes("vm name") && text.includes("vault last copy") && text.includes("vault lag");
      });
      if (!table) return false;
      const headers = Array.from(table.querySelectorAll("th")).map((th) => (th.textContent || "").trim().toLowerCase());
      const copyIndex = headers.findIndex((h) => h.includes("vault last copy"));
      const lagIndex = headers.findIndex((h) => h.includes("vault lag"));
      if (copyIndex < 0 || lagIndex < 0) return false;
      const rows = Array.from(table.querySelectorAll("tbody tr"));
      if (rows.length === 0) return false;
      const snapshot = rows.map((row) => {
        const cells = Array.from(row.querySelectorAll("td"));
        const copyText = (cells[copyIndex] && cells[copyIndex].textContent ? cells[copyIndex].textContent : "").trim();
        const lagText = (cells[lagIndex] && cells[lagIndex].textContent ? cells[lagIndex].textContent : "").trim();
        return { copyText, lagText };
      });
      const readyRows = snapshot.filter((item) => {
        const copyReady = item.copyText.length > 0 && item.copyText !== "—" && item.copyText !== "…" && item.copyText !== "...";
        const lagReady = item.lagText.length > 0 && item.lagText !== "—" && item.lagText !== "…" && item.lagText !== "...";
        return copyReady && lagReady;
      }).length;
      const pendingRows = snapshot.filter((item) => {
        const copyPending = item.copyText === "—" || item.copyText === "…" || item.copyText === "...";
        const lagPending = item.lagText === "—" || item.lagText === "…" || item.lagText === "...";
        return copyPending || lagPending;
      }).length;
      const stableSource = reportSignature.length > 0 ? reportSignature : snapshot.map((item) => item.copyText + "|" + item.lagText).join(";");
      const prevSource = typeof window.__veeamReportStableSource === "string" ? window.__veeamReportStableSource : "";
      const prevCount = typeof window.__veeamReportStableCount === "number" ? window.__veeamReportStableCount : 0;
      const nextCount = prevSource === stableSource ? prevCount + 1 : 1;
      window.__veeamReportStableSource = stableSource;
      window.__veeamReportStableCount = nextCount;
      const minReadyRows = Math.max(1, Math.ceil(rows.length * 0.5));
      const domReady = readyRows >= minReadyRows && pendingRows === 0;
      return (reportReady || domReady) && nextCount >= 3;
    }`;
    const waitForApiReady = async () => {
      await page.waitForFunction(apiReadyCheck, { timeout: 45_000, polling: 1000 });
    };
    const waitForVaultColumns = async () => {
      await page.waitForFunction(vaultColumnsReadyCheck, { timeout: 30_000, polling: 500 });
    };
    try {
      await waitForApiReady();
      await waitForVaultColumns();
    } catch {
      await page.reload({ waitUntil: "networkidle0" });
      await waitForApiReady();
      await waitForVaultColumns();
    }
    const main = await page.$("main");
    const buf = main ? await main.screenshot({ type: "png" }) : await page.screenshot({ type: "png", fullPage });
    return buf as Buffer;
  } finally {
    await browser.close();
  }
}
