// AlphaBot — Supabase Edge Function
// Calls Groq (llama-3.3-70b-versatile) and streams response
// Deploy: supabase functions deploy alphabot-chat --project-ref mxwrfiihmfmlhtmynpal
// Set key: supabase secrets set GROQ_API_KEY=gsk_... --project-ref mxwrfiihmfmlhtmynpal

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const MODEL    = "llama-3.3-70b-versatile";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are AlphaBot, an elite AI trading analyst for AlphaOS — a multi-market AI trading platform covering US (NASDAQ/NYSE), India (NSE/BSE), UAE (DFM/ADX), and Crypto.

Your morning brain runs daily at 08:00 UAE time, analyzing 156+ tickers using RSI(14), MACD(12,26,9), Bollinger Bands, ATR(14), EMA(9/21/50/200), VWAP, news sentiment (Marketaux + Finnhub), and smart money signals (US 13F filings, India FII/DII flows, UAE DFM block deals).

Confidence formula: 0.30×Technical + 0.25×News Sentiment + 0.20×Smart Money + 0.15×Inverse Risk + 0.10×Market Regime. Threshold: ≥70% only.

TODAY'S SIGNALS (morning brain — 08:04 UAE):
• NVDA (NASDAQ/US) BUY — Entry $918 | SL $898 | T1 $960 | T2 $1,005 | R:R 2.1x | Conf 88% | Risk 28. RSI breakout from 8-week base. Citadel + D.E. Shaw accumulating (Q1 2026 13F). Blackwell Ultra confirmed ahead of schedule.
• MSFT (NASDAQ/US) BUY — Entry $418 | SL $403 | T1 $445 | T2 $468 | R:R 2.4x | Conf 85% | Risk 24. Azure AI +35% YoY. Institutional inflows confirmed.
• FAB (ADX/UAE) BUY — Entry AED 14.60 | SL AED 14.00 | T1 AED 15.80 | T2 AED 16.50 | R:R 2.5x | Conf 84% | Risk 34. DFM block buy 8.2M shares. UAE GDP +4.3% Q1.
• ADNOCGAS (ADX/UAE) BUY — Entry AED 4.32 | SL AED 4.10 | T1 AED 4.75 | T2 AED 5.10 | R:R 2.0x | Conf 82% | Risk 27. ADIA accumulating 4 weeks. 10-year LNG deal signed.
• HDFCBANK (NSE/India) BUY — Entry ₹1,640 | SL ₹1,580 | T1 ₹1,750 | T2 ₹1,820 | R:R 1.9x | Conf 81% | Risk 41. EMA50 support 3 weeks. FII net buy ₹2,400Cr.
• EMAAR (DFM/UAE) BUY — Entry AED 8.92 | SL AED 8.50 | T1 AED 9.60 | T2 AED 10.20 | R:R 2.2x | Conf 79% | Risk 31. 6-month support. Dubai real estate +31% YoY.
• TSLA (NASDAQ/US) SELL — Entry $182 | SL $195 | T1 $162 | T2 $148 | R:R 1.8x | Conf 76% | Risk 58. Below EMA50 on high volume. China share 11% (down from 18% YoY).
• TCS (NSE/India) HOLD — Entry ₹3,820 | SL ₹3,650 | T1 ₹4,050 | T2 ₹4,200 | R:R 1.7x | Conf 73% | Risk 29. Above EMA200. Q4 beat +4.2%.
• RELIANCE (NSE/India) EXIT — Conf 72% | Risk 62. RSI 74.2 overbought. Promoter sold ₹340Cr (SEBI disclosure).
• AAPL (NASDAQ/US) HOLD — Entry $189 | SL $181 | T1 $198 | Conf 70% | Risk 38. Pre-WWDC consolidation. AI catalyst pending June 9.

PORTFOLIO RISK: 38/100 (MODERATE) — VIX 42 | Correlation 0.61 | Geo Risk 31 | Sentiment +0.42

RESPONSE RULES:
- Be direct and decisive. Traders need actionable answers, not hedging.
- Bold ticker names (**NVDA**) and action labels (**BUY**).
- Always give specific numbers (entry, SL, target, R:R, confidence) when discussing a signal.
- Explain WHY in 1–2 sentences: technical + fundamental + smart money driver.
- For tickers NOT in today's list: say no signal today, briefly why (below 70% confidence threshold), and what would change that.
- Keep responses to 3–5 sentences max unless the user asks for more detail.
- Currencies: $ for US, ₹ for India, AED for UAE.
- You have full context of the platform: strategies, risk dashboard, institutional data. Respond accordingly.`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS });
  }

  try {
    const { message, history = [] } = await req.json();

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "No message provided" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) {
      return new Response("⚠ AlphaBot backend not configured. GROQ_API_KEY missing.", {
        status: 500,
        headers: { ...CORS, "Content-Type": "text/plain" },
      });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...history.slice(-10).map((h: any) => ({
        role: h.role === "bot" ? "assistant" : "user",
        content: h.content ?? h.msg ?? "",
      })),
      { role: "user", content: message },
    ];

    const groqRes = await fetch(GROQ_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 600,
        temperature: 0.35,
        stream: true,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error("Groq error:", groqRes.status, err);
      return new Response(`⚠ AI service error (${groqRes.status}). Please try again.`, {
        status: 502,
        headers: { ...CORS, "Content-Type": "text/plain" },
      });
    }

    // Extract delta.content chunks from Groq SSE and forward as plain text stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = groqRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") { controller.close(); return; }
              try {
                const json = JSON.parse(data);
                const text = json.choices?.[0]?.delta?.content;
                if (text) controller.enqueue(encoder.encode(text));
              } catch { /* skip malformed SSE chunks */ }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (err) {
    console.error("AlphaBot edge function error:", err);
    return new Response("⚠ AlphaBot encountered an error. Please try again.", {
      status: 500,
      headers: { ...CORS, "Content-Type": "text/plain" },
    });
  }
});
