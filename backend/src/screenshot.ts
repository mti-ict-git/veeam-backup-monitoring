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
    const main = await page.$("main");
    const buf = main ? await main.screenshot({ type: "png" }) : await page.screenshot({ type: "png", fullPage });
    return buf as Buffer;
  } finally {
    await browser.close();
  }
}
