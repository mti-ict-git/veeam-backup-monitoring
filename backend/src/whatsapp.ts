import axios from "axios";
import FormData from "form-data";
import { loadConfig } from "./config";

export interface WhatsAppSendResult {
  ok: boolean;
  status: number;
}

export async function sendGroupMessage(chatId: string, message: string): Promise<WhatsAppSendResult> {
  const cfg = loadConfig();
  const res = await axios.post(
    cfg.whatsappGatewayUrl,
    new URLSearchParams({ id: chatId, message }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );
  return { ok: res.status === 200, status: res.status };
}

export async function sendImageWithCaption(chatId: string, message: string, image: Buffer): Promise<WhatsAppSendResult> {
  const cfg = loadConfig();
  const form = new FormData();
  form.append("id", chatId);
  form.append("message", message);
  form.append("image", image, { filename: "dashboard.png", contentType: "image/png" });
  const res = await axios.post(cfg.whatsappGatewayUrl, form, {
    headers: form.getHeaders(),
  });
  return { ok: res.status === 200, status: res.status };
}

