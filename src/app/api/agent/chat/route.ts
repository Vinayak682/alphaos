// AlphaBot chat — powered by Groq (llama-3.3-70b-versatile, free tier)
// Get a free key at https://console.groq.com → set GROQ_API_KEY in .env.local
import { NextRequest } from "next/server";

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const MODEL    = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are AlphaBot, an elite AI trading analyst for AlphaOS — a multi-market AI trading platform covering US (NASDAQ/NYSE), India (NSE/BSE), UAE (DFM/ADX), and Crypto.

Your morning brain runs daily at 08:00 UAE time, analyzing 156+ tickers using RSI(14), MACD(12,26,9), Bollinger Bands, ATR(14), EMA(9/21/50/200), VWAP, news sentiment (Marketaux + Finnhub), and smart money signals (US 13F filings, India FII/DII flows, UAE DFM block deals).

Confidence formula: 0.30×Technical + 0.25×News Sentiment + 0.20×Smart Money + 0.15×Inverse Risk + 0.10×Market Regime. Threshold: ≥70% only.

TODAY'S SIGNALS (morning brain — 08:04 UAE):
• NVDA (NASDAQ/US) BUY — Entry $918 | SL $898 | T1 $960 | T2 $1,005 | R:R 2.1x | Conf 88% | Risk 28. RSI breakout from 8-week base. Citadel + D.E. Shaw accumulating (Q1 2026 13F). Blackwell Ultra confirmed ahead of schedule.
• MSFT (NASDAQ/US) BUY — Entry $418 | SL $403 | T1 $445 | T2 $468 | R:R 2.4x | Conf 85% | Risk 24. Azure AI +35% YoY. Institutional inflows confirmed.
• FAB (ADX/UAE) BUY — Entry د.إ14.60 | SL د.إ14.00 | T1 د.إ15.80 | T2 د.إ16.50 | R:R 2.5x | Conf 84% | Risk 34. DFM block buy 8.2M shares. UAE GDP +4.3% Q1.
• ADNOCGAS (ADX/UAE) BUY — Entry د.إ4.32 | SL د.إ4.10 | T1 د.إ4.75 | T2 د.إ5.10 | R:R 2.0x | Conf 82% | Risk 27. ADIA accumulating 4 weeks. 10-year LNG deal signed.
• HDFCBANK (NSE/India) BUY — Entry ₹1,640 | SL ₹1,580 | T1 ₹1,750 | T2 ₹1,820 | R:R 1.9x | Conf 81% | Risk 41. EMA50 support 3 weeks. FII net buy ₹2,400Cr.
• EMAAR (DFM/UAE) BUY — Entry د.إ8.92 | SL د.إ8.50 | T1 د.إ9.60 | T2 د.إ10.20 | R:R 2.2x | Conf 79% | Risk 31. 6-month support. Dubai real estate +31% YoY.
• TSLA (NASDAQ/US) SELL — Entry $182 | SL $195 | T1 $162 | T2 $148 | R:R 1.8x | Conf 76% | Risk 58. Below EMA50 on high volume. China share 11% (down from 18% YoY).
• TCS (NSE/India) HOLD — Entry ₹3,820 | SL ₹3,650 | T1 ₹4,050 | T2 ₹4,200 | R:R 1.7x | Conf 73% | Risk 29. Above EMA200. Q4 beat +4.2%.
• RELIANCE (NSE/India) EXIT — Conf 72% | Risk 62. RSI 74.2 overbought. Promoter sold ₹340Cr (SEBI disclosure).
• AAPL (NASDAQ/US) HOLD — Entry $189 | SL $181 | T1 $198 | Conf 70% | Risk 38. Pre-WWDC consolidation. AI catalyst pending June 9.

PORTFOLIO RISK: 38/100 (MODERATE) — VIX 42 | Correlation 0.61 | Geo Risk 31 | Sentiment +0.42

RESPONSE RULES:
- Be direct. Traders need decisive answers.
- Bold ticker names (**NVDA**) and action labels (**BUY**).
- Always give specific numbers (entry, SL, target, R:R, confidence) when discussing a signal.
- Explain WHY in 1 sentence: technical + fundamental + smart money driver.
- For tickers not in today's list: say no signal today and briefly why (e.g., below 70% confidence threshold).
- Keep responses to 3–5 sentences max unless the user asks for more detail.
- Currencies: $ for US, ₹ for India, د.إ for UAE.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response("GROQ_API_KEY not set in .env.local", { status: 500 });
  }

  const { message, history = [] } = await req.json();

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-8).map((h: { role: string; content: string }) => ({
      role: h.role === "bot" ? "assistant" : "user",
      content: h.content,
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
      max_tokens: 512,
      temperature: 0.4,
      stream: true,
    }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    return new Response(`Groq error: ${err}`, { status: groqRes.status });
  }

  // Forward the SSE stream from Groq, extracting only text delta chunks
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const reader = groqRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
          } catch { /* skip malformed chunks */ }
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
