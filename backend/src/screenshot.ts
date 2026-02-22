import puppeteer from "puppeteer";
import { loadConfig } from "./config";

export interface ScreenshotOptions {
  url?: string;
  width?: number;
  height?: number;
  fullPage?: boolean;
}

export async function captureDashboard(opts?: ScreenshotOptions): Promise<Buffer> {
  const cfg = loadConfig();
  const url = opts?.url ?? cfg.dashboardUrl;
  const width = opts?.width ?? 1280;
  const height = opts?.height ?? 720;
  const fullPage = opts?.fullPage ?? false;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60_000 });
    const buf = await page.screenshot({ type: "png", fullPage });
    return buf as Buffer;
  } finally {
    await browser.close();
  }
}
