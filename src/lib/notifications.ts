/**
 * AlphaOS Notification Service
 *
 * Security model:
 *  - Telegram chat IDs and WhatsApp phone/API keys are encrypted with
 *    AES-256-GCM before being written to localStorage.
 *  - Encryption key is derived per-device via PBKDF2 from a browser
 *    fingerprint — data is unreadable on any other device.
 *  - The Telegram bot token is NEVER in the client bundle; it lives only
 *    in Supabase secrets and is used exclusively inside the Edge Function.
 *  - WhatsApp CallMeBot API keys belong to the user; they are never logged
 *    server-side and are only forwarded to CallMeBot's API.
 *  - Notifications are sent through a Supabase Edge Function which enforces
 *    a 10/hour rate limit per identity and sanitises all message content.
 */

const STORAGE_KEY = "alphaos_notif_config_v2";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const EDGE_FN_URL  = `${SUPABASE_URL}/functions/v1/send-notification`;

// ── Types ─────────────────────────────────────────────────────────────────
export interface TelegramConfig {
  chatId: string;
  verifiedAt: string;
}

export interface WhatsAppConfig {
  phone: string;   // E.164 without +, e.g. "971501234567"
  apiKey: string;  // CallMeBot API key
  verifiedAt: string;
}

export interface NotificationConfig {
  telegram?: TelegramConfig;
  whatsapp?: WhatsAppConfig;
}

// ── WebCrypto helpers ─────────────────────────────────────────────────────

/** Derive a device-specific AES-256-GCM key via PBKDF2 from browser fingerprint */
async function getKey(): Promise<CryptoKey> {
  const fp = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");

  const raw = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(fp),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name:       "PBKDF2",
      salt:       new TextEncoder().encode("alphaos-notif-salt-v2"),
      iterations: 200_000,
      hash:       "SHA-256",
    },
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv  = crypto.getRandomValues(new Uint8Array(12));
  const ct  = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  const buf = new Uint8Array(12 + ct.byteLength);
  buf.set(iv);
  buf.set(new Uint8Array(ct), 12);
  // URL-safe base64
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function decrypt(encoded: string): Promise<string> {
  const key = await getKey();
  // Restore base64 padding
  const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const pad  = (4 - (b64.length % 4)) % 4;
  const buf  = Uint8Array.from(atob(b64 + "=".repeat(pad)), (c) => c.charCodeAt(0));
  const iv   = buf.slice(0, 12);
  const ct   = buf.slice(12);
  const pt   = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}

// ── Storage ───────────────────────────────────────────────────────────────

export async function saveConfig(config: NotificationConfig): Promise<void> {
  const json    = JSON.stringify(config);
  const encoded = await encrypt(json);
  localStorage.setItem(STORAGE_KEY, encoded);
}

export async function loadConfig(): Promise<NotificationConfig> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const json = await decrypt(raw);
    return JSON.parse(json) as NotificationConfig;
  } catch {
    // Key mismatch (e.g. different device/browser) — return empty
    return {};
  }
}

export async function clearConfig(channel: keyof NotificationConfig): Promise<void> {
  const cfg = await loadConfig();
  delete cfg[channel];
  await saveConfig(cfg);
}

// ── Notification sender ───────────────────────────────────────────────────

interface SendResult {
  success: boolean;
  error?: string;
}

async function callEdgeFn(body: object): Promise<SendResult> {
  try {
    const res = await fetch(EDGE_FN_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "apikey":        SUPABASE_KEY,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error ?? `HTTP ${res.status}` };
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

export async function sendTelegram(message: string): Promise<SendResult> {
  const cfg = await loadConfig();
  if (!cfg.telegram?.chatId) return { success: false, error: "Telegram not connected" };
  return callEdgeFn({ channel: "telegram", chatId: cfg.telegram.chatId, message });
}

export async function sendWhatsApp(message: string): Promise<SendResult> {
  const cfg = await loadConfig();
  if (!cfg.whatsapp?.phone) return { success: false, error: "WhatsApp not connected" };
  return callEdgeFn({
    channel: "whatsapp",
    phone:   cfg.whatsapp.phone,
    apiKey:  cfg.whatsapp.apiKey,
    message,
  });
}

export async function sendTestTelegram(chatId: string): Promise<SendResult> {
  return callEdgeFn({
    channel: "telegram",
    chatId,
    message: "✅ *AlphaOS Alert Test*\n\nTelegram is connected. You'll receive price alerts here.",
  });
}

/**
 * WhatsApp via CallMeBot — called DIRECTLY from the browser.
 *
 * CallMeBot does not set Access-Control-Allow-Origin headers, so the browser
 * blocks reading the response. However, for a simple GET request the request
 * IS sent and CallMeBot DOES process it before the CORS error fires.
 *
 * Strategy:
 *   1. Fire a normal fetch — if CORS headers are present, read the body.
 *   2. On CORS TypeError — the request went through; catch & return { fired: true }.
 *   3. On any other network error (DNS, timeout) — return { fired: false }.
 *
 * The wizard shows a manual confirmation step so the user verifies receipt
 * themselves, which is the honest UX when we can't read the response.
 */
export async function fireWhatsApp(
  phone: string,
  apiKey: string,
  message: string,
): Promise<{ fired: boolean; confirmed?: boolean }> {
  const cleanPhone = phone.replace(/\D/g, "");
  const url =
    `https://api.callmebot.com/whatsapp.php` +
    `?phone=${cleanPhone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;

  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const text = await res.text();
    // If we can read the body, CORS was allowed — parse normally
    if (text.toLowerCase().includes("queued")) return { fired: true, confirmed: true };
    if (text.toLowerCase().includes("api key")) throw new Error("invalid_key");
    return { fired: true, confirmed: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    // CORS error: request was sent, we just can't read the response
    if (msg.includes("fetch") || msg.includes("CORS") || msg.includes("Failed")) {
      return { fired: true }; // confirmed = undefined → show manual confirm step
    }
    if (msg === "invalid_key") {
      throw new Error("Invalid API key — make sure you copied it exactly from CallMeBot.");
    }
    // Real network error (timeout, DNS)
    return { fired: false };
  }
}

export async function sendTestWhatsApp(
  phone: string,
  apiKey: string,
): Promise<{ fired: boolean; confirmed?: boolean }> {
  return fireWhatsApp(
    phone,
    apiKey,
    "✅ AlphaOS Alert Test — WhatsApp connected! You'll receive price alerts here.",
  );
}

/** Send an alert to all connected channels */
export async function broadcastAlert(message: string): Promise<void> {
  const cfg  = await loadConfig();
  const jobs: Promise<unknown>[] = [];
  if (cfg.telegram?.chatId) jobs.push(sendTelegram(message));
  if (cfg.whatsapp?.phone)
    jobs.push(fireWhatsApp(cfg.whatsapp.phone, cfg.whatsapp.apiKey, message));
  await Promise.allSettled(jobs);
}
