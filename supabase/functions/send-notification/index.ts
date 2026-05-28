// AlphaOS — Notification Edge Function
// Secure proxy for Telegram Bot API + WhatsApp CallMeBot
//
// Deploy:
//   supabase functions deploy send-notification --project-ref mxwrfiihmfmlhtmynpal
//
// Required secrets (set once):
//   supabase secrets set TELEGRAM_BOT_TOKEN=<your_bot_token> --project-ref mxwrfiihmfmlhtmynpal
//
// The Telegram bot token NEVER reaches the client. WhatsApp API keys belong
// to the user — we only proxy the request to avoid browser CORS restrictions.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── In-memory rate limiter ─────────────────────────────────────────────────
// Resets on cold start. Max 10 notifications per identity per hour.
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(identity: string): boolean {
  const now = Date.now();
  const WINDOW = 60 * 60 * 1000; // 1 hour
  const MAX    = 10;

  const record = rateLimitMap.get(identity);
  if (!record || now - record.windowStart > WINDOW) {
    rateLimitMap.set(identity, { count: 1, windowStart: now });
    return true;
  }
  if (record.count >= MAX) return false;
  record.count++;
  return true;
}

// ── Message sanitiser ──────────────────────────────────────────────────────
function sanitise(text: string): string {
  return text
    .slice(0, 800) // hard cap
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .trim();
}

// ── Telegram ───────────────────────────────────────────────────────────────
async function sendTelegram(chatId: string, message: string): Promise<void> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token) throw new Error("Telegram bot not configured. Set TELEGRAM_BOT_TOKEN in Supabase secrets.");

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });

  const data = await res.json();
  if (!data.ok) {
    // Translate common Telegram error codes into user-friendly messages
    const errMap: Record<number, string> = {
      400: "Invalid Chat ID — make sure you started the bot first.",
      401: "Bot token invalid — contact support.",
      403: "Bot was blocked by user — please unblock @AlphaOSAlerts_bot.",
      429: "Too many requests — please try again in a minute.",
    };
    const msg = errMap[data.error_code] ?? data.description ?? "Telegram delivery failed";
    throw new Error(msg);
  }
}

// ── WhatsApp (CallMeBot) ───────────────────────────────────────────────────
async function sendWhatsApp(phone: string, apiKey: string, message: string): Promise<void> {
  // Normalise phone: strip +, spaces, dashes
  const cleanPhone = phone.replace(/[\s\+\-\(\)]/g, "");
  if (!/^\d{7,15}$/.test(cleanPhone)) throw new Error("Invalid phone number format.");

  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set("phone",  cleanPhone);
  url.searchParams.set("text",   message);
  url.searchParams.set("apikey", apiKey);

  const res  = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
  const text = (await res.text()).toLowerCase();

  // CallMeBot returns "message queued" on success
  if (!text.includes("message queued") && !text.includes("queued")) {
    if (text.includes("api key")) throw new Error("Invalid CallMeBot API key.");
    if (text.includes("phone"))   throw new Error("Phone number not registered with CallMeBot.");
    throw new Error("WhatsApp delivery failed — verify your phone and API key.");
  }
}

// ── Handler ────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { channel, chatId, phone, apiKey, message } = body;

  if (!channel || !message) {
    return json({ error: "Missing required fields: channel, message" }, 400);
  }

  const cleanMessage = sanitise(message);
  if (!cleanMessage) return json({ error: "Empty message" }, 400);

  try {
    if (channel === "telegram") {
      if (!chatId) return json({ error: "chatId required for Telegram" }, 400);
      const identity = `tg:${chatId}`;
      if (!checkRateLimit(identity)) {
        return json({ error: "Rate limit exceeded — max 10 alerts per hour" }, 429);
      }
      await sendTelegram(chatId, cleanMessage);
      return json({ success: true, channel: "telegram" });
    }

    if (channel === "whatsapp") {
      if (!phone || !apiKey) return json({ error: "phone and apiKey required for WhatsApp" }, 400);
      const identity = `wa:${phone}`;
      if (!checkRateLimit(identity)) {
        return json({ error: "Rate limit exceeded — max 10 alerts per hour" }, 429);
      }
      await sendWhatsApp(phone, apiKey, cleanMessage);
      return json({ success: true, channel: "whatsapp" });
    }

    return json({ error: `Unknown channel: ${channel}` }, 400);

  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error(`[send-notification] ${channel} error:`, message);
    return json({ error: message }, 500);
  }
});
