/**
 * POST /api/morning-brain
 * Runs the AI signal generation pipeline:
 * 1. Fetch 60 days OHLCV for each symbol (Polygon US, Yahoo India/UAE, Binance Crypto)
 * 2. Compute RSI, MACD, EMA, ATR
 * 3. Fetch recent Finnhub news per symbol
 * 4. Call Claude API → structured BUY/SELL/HOLD/EXIT signal per symbol
 * 5. Write to Supabase signals_generated table
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServiceClient } from "@/lib/supabase";
import { getCandles } from "@/lib/polygon";
import { computeIndicators } from "@/lib/technicals";

const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";
const GROQ_KEY    = process.env.GROQ_API_KEY ?? "";

// Default watchlist — can be overridden via POST body
const DEFAULT_SYMBOLS = [
  { symbol: "NVDA",     market: "US",     exchange: "NASDAQ", currency: "$"   },
  { symbol: "MSFT",     market: "US",     exchange: "NASDAQ", currency: "$"   },
  { symbol: "AAPL",     market: "US",     exchange: "NASDAQ", currency: "$"   },
  { symbol: "META",     market: "US",     exchange: "NASDAQ", currency: "$"   },
  { symbol: "TSLA",     market: "US",     exchange: "NASDAQ", currency: "$"   },
  { symbol: "BTCUSDT",  market: "CRYPTO", exchange: "Binance",currency: "$"   },
  { symbol: "ETHUSDT",  market: "CRYPTO", exchange: "Binance",currency: "$"   },
  { symbol: "HDFCBANK", market: "INDIA",  exchange: "NSE",    currency: "₹"   },
  { symbol: "RELIANCE", market: "INDIA",  exchange: "NSE",    currency: "₹"   },
  { symbol: "TCS",      market: "INDIA",  exchange: "NSE",    currency: "₹"   },
  { symbol: "FAB",      market: "UAE",    exchange: "ADX",    currency: "د.إ" },
  { symbol: "EMAAR",    market: "UAE",    exchange: "DFM",    currency: "د.إ" },
  // Commodities. These are US-listed trackers, so they ride the existing US
  // (Polygon) path — GLD for gold, USO for WTI, BNO for Brent. The real
  // $/barrel and $/oz benchmark series live in src/lib/commodities.ts.
  { symbol: "GLD",      market: "US",     exchange: "NYSE",   currency: "$"   },
  { symbol: "USO",      market: "US",     exchange: "NYSE",   currency: "$"   },
  { symbol: "BNO",      market: "US",     exchange: "NYSE",   currency: "$"   },
];

// ── Fetch OHLCV ────────────────────────────────────────────────────────────────
function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

async function fetchOHLCV(symbol: string, market: string) {
  const to   = toDateStr(new Date());
  const from = toDateStr(new Date(Date.now() - 90 * 86400000)); // 90 days back

  try {
    if (market === "US" || market === "CRYPTO") {
      return await getCandles(symbol, "day", from, to);
    }

    // India / UAE — Yahoo Finance
    const ticker = market === "INDIA" ? `${symbol}.NS` : `${symbol}.AE`;
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=3mo`;
    const r = await fetch(url, { next: { revalidate: 0 } });
    if (!r.ok) return [];
    const d = await r.json();
    const result = d?.chart?.result?.[0];
    if (!result) return [];
    const { timestamp, indicators: { quote: [{ open, high, low, close, volume }] } } = result;
    return timestamp.map((t: number, i: number) => ({
      time: t * 1000, open: open[i], high: high[i], low: low[i],
      close: close[i], volume: volume[i], vwap: close[i],
    })).filter((c: { close: number }) => c.close != null);
  } catch { return []; }
}

// ── Fetch news ────────────────────────────────────────────────────────────────
async function fetchNews(symbol: string): Promise<string[]> {
  if (!FINNHUB_KEY) return [];
  try {
    const to   = toDateStr(new Date());
    const from = toDateStr(new Date(Date.now() - 3 * 86400000));
    const r = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_KEY}`,
      { next: { revalidate: 0 } }
    );
    if (!r.ok) return [];
    const items = await r.json();
    return (items as { headline: string; summary: string }[])
      .slice(0, 3)
      .map((n) => `${n.headline}${n.summary ? ` — ${n.summary.slice(0, 120)}` : ""}`);
  } catch { return []; }
}

// ── Per-symbol prompt ─────────────────────────────────────────────────────────
function buildSinglePrompt(a: SymbolData): string {
  return `You are AlphaOS Morning Brain — an institutional-grade AI trading analyst.
Today: ${new Date().toDateString()}

Analyze ${a.symbol} (${a.market} · ${a.exchange}) and output a single JSON object. No other text.

Data:
- Price: ${a.currency}${a.ind.currentClose.toLocaleString()} | 1d: ${a.ind.priceChange1d > 0 ? "+" : ""}${a.ind.priceChange1d}% | 5d: ${a.ind.priceChange5d > 0 ? "+" : ""}${a.ind.priceChange5d}%
- Trend: ${a.ind.trend}
- RSI(14): ${a.ind.rsi ?? "N/A"}
- MACD: ${a.ind.macd ?? "N/A"} | Signal: ${a.ind.macdSignal ?? "N/A"} | Hist: ${a.ind.macdHist ?? "N/A"}
- EMA9: ${a.ind.ema9 ?? "N/A"} | EMA21: ${a.ind.ema21 ?? "N/A"} | EMA50: ${a.ind.ema50 ?? "N/A"}
- Above EMA50: ${a.ind.aboveEma50} | Above EMA200: ${a.ind.aboveEma200}
- ATR(14): ${a.ind.atr ?? "N/A"}
- News: ${a.news.length > 0 ? a.news.join(" | ") : "None"}

Output this exact JSON (no markdown, no extra text):
{"ticker":"${a.symbol}","market":"${a.market}","exchange":"${a.exchange}","currency":"${a.currency}","action":"BUY","entry_price":0.0,"stop_loss":0.0,"target_1":0.0,"target_2":0.0,"rr_ratio":0.0,"confidence":0,"risk_score":0,"rationale":"...","news_item":"..."}

Rules:
- action: BUY, SELL, HOLD, or EXIT only
- confidence: 0-100, risk_score: 0-100
- For HOLD/EXIT: stop_loss/target_1/target_2/rr_ratio = null
- entry_price must be near current price
- rationale: 2 sentences with specific indicator values
- Output ONLY the JSON object, nothing else`;
}

async function callAI(prompt: string, googleKey: string, modelUsed: string): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });
    return (msg.content[0] as { text: string }).text;
  }
  if (googleKey) {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 800, temperature: 0.1 },
        }),
      }
    );
    const d = await r.json();
    return d.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }
  if (GROQ_KEY) {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        // gpt-oss spends part of the budget on an internal reasoning channel, so a
        // tight cap truncates the JSON body mid-object. Keep headroom and ask for
        // low reasoning effort + a guaranteed JSON object.
        max_tokens: 3000,
        reasoning_effort: "low",
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content ?? "";
  }
  throw new Error("No AI key configured");
  // modelUsed is determined by caller
  void modelUsed;
}

interface SymbolData {
  symbol: string; market: string; exchange: string; currency: string;
  ind: ReturnType<typeof computeIndicators>;
  news: string[];
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const symbols = body.symbols ?? DEFAULT_SYMBOLS;

    // 1. Fetch OHLCV + compute indicators for all symbols in parallel
    const analyses: SymbolData[] = [];
    await Promise.allSettled(
      symbols.map(async (s: typeof DEFAULT_SYMBOLS[0]) => {
        const candles = await fetchOHLCV(s.symbol, s.market);
        if (candles.length < 30) return; // not enough data

        type Candle = { close: number; high: number; low: number };
        const closes = candles.map((c: Candle) => c.close);
        const highs  = candles.map((c: Candle) => c.high);
        const lows   = candles.map((c: Candle) => c.low);
        const ind = computeIndicators(closes, highs, lows);
        const news = await fetchNews(s.symbol);
        analyses.push({ ...s, ind, news });
      })
    );

    if (analyses.length === 0) {
      return NextResponse.json({ error: "Could not fetch price data for any symbol" }, { status: 500 });
    }

    // 2. Call AI per symbol in parallel (small focused prompt = reliable JSON)
    const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY ?? "";
    const modelUsed = process.env.ANTHROPIC_API_KEY
      ? "claude-sonnet-4-6"
      : GOOGLE_AI_KEY ? "gemini-2.0-flash" : "openai/gpt-oss-120b";

    const signalResults = await Promise.allSettled(
      analyses.map(async (a) => {
        const prompt = buildSinglePrompt(a);
        const raw = await callAI(prompt, GOOGLE_AI_KEY, modelUsed);
        // Extract JSON object from response
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) { console.warn(`[morning-brain] no JSON for ${a.symbol}:`, raw.slice(0, 200)); return null; }
        return JSON.parse(match[0]);
      })
    );

    const signals = signalResults
      .filter((r): r is PromiseFulfilledResult<Record<string, unknown>> => r.status === "fulfilled" && r.value !== null)
      .map((r) => r.value);

    console.log(`[morning-brain] signals parsed: ${signals.length}/${analyses.length}`);

    // 4. Enrich with computed technicals and write to Supabase
    const db = getServiceClient();
    const enriched = signals.map((sig: Record<string, unknown>) => {
      const analysis = analyses.find((a) => a.symbol === sig.ticker);
      return {
        ticker: sig.ticker,
        exchange: sig.exchange,
        market: sig.market,
        action: sig.action,
        currency: sig.currency ?? "$",
        entry_price: sig.entry_price,
        stop_loss: sig.stop_loss,
        target_1: sig.target_1,
        target_2: sig.target_2,
        rr_ratio: sig.rr_ratio,
        confidence: sig.confidence,
        risk_score: sig.risk_score,
        rationale: sig.rationale,
        news_item: sig.news_item,
        rsi: analysis?.ind.rsi,
        macd: analysis?.ind.macd,
        macd_signal: analysis?.ind.macdSignal,
        ema_9: analysis?.ind.ema9,
        ema_21: analysis?.ind.ema21,
        ema_50: analysis?.ind.ema50,
        generated_at: new Date().toISOString(),
        model: modelUsed,
        status: "ACTIVE",
      };
    });

    // The signals are already generated at this point. A database problem must not
    // throw them away — persist if we can, otherwise return them with a warning so
    // the pipeline stays usable (and testable) while Supabase is down.
    let persisted = false;
    let warning: string | undefined;

    if (db) {
      try {
        // Expire old signals first
        await db.from("signals_generated").update({ status: "EXPIRED" }).eq("status", "ACTIVE");
        // Insert new
        const { error } = await db.from("signals_generated").insert(enriched);
        if (error) warning = `Signals generated but not saved: ${error.message}`;
        else persisted = true;
      } catch (e) {
        warning = `Signals generated but Supabase is unreachable: ${String(e)}`;
      }
    } else {
      warning = "Signals generated but not saved: no SUPABASE_SERVICE_ROLE_KEY configured";
    }

    if (warning) console.warn(`[morning-brain] ${warning}`);

    return NextResponse.json({
      success: true,
      persisted,
      ...(warning ? { warning } : {}),
      count: enriched.length,
      signals: enriched,
      symbolsAnalyzed: analyses.length,
      model: enriched[0]?.model,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
