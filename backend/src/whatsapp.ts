import axios from "axios";
import FormData from "form-data";
import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadConfig } from "./config.js";

export interface WhatsAppSendResult {
  ok: boolean;
  status: number;
}

export async function sendGroupMessage(chatId: string, message: string): Promise<WhatsAppSendResult> {
  const cfg = loadConfig();
  try {
    const res = await axios.post(
      cfg.whatsappGatewayUrl,
      new URLSearchParams({ id: chatId, message }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );
    return { ok: res.status === 200, status: res.status };
  } catch (e) {
    const status = (e as { response?: { status?: number } })?.response?.status ?? 500;
    return { ok: false, status };
  }
}

export async function sendImageWithCaption(chatId: string, message: string, image: Buffer): Promise<WhatsAppSendResult> {
  const cfg = loadConfig();
  const form = new FormData();
  form.append("id", chatId);
  form.append("message", message);
  const tmp = path.join(os.tmpdir(), `dashboard-${Date.now()}.png`);
  await fs.promises.writeFile(tmp, image);
  const stream = fs.createReadStream(tmp);
  form.append("image", stream, { filename: "dashboard.png", contentType: "image/png" });
  try {
    const res = await axios.post(cfg.whatsappGatewayUrl, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
    });
    return { ok: res.status === 200, status: res.status };
  } catch (e) {
    const status = (e as { response?: { status?: number } })?.response?.status ?? 500;
    return { ok: false, status };
  } finally {
    try {
      await fs.promises.unlink(tmp);
    } catch {
      // ignore
    }
  }
}
