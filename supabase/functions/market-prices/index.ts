/**
 * AlphaOS — Market Prices Edge Function
 *
 * Server-side proxy that fetches real-time stock prices from Yahoo Finance
 * and Finnhub, returning clean JSON to the browser. Solves CORS restrictions
 * (Yahoo blocks browser-direct calls) and centralises all price fetching.
 *
 * Deploy:
 *   supabase functions deploy market-prices --project-ref mxwrfiihmfmlhtmynpal
 *
 * Usage:
 *   POST /functions/v1/market-prices
 *   Body: { "symbols": ["NVDA", "AAPL"], "market": "US" }
 *   Body: { "symbols": ["RELIANCE", "HDFCBANK"], "market": "INDIA" }
 *   Body: { "symbols": ["EMAAR", "EMIRATESNBD"], "market": "UAE" }
 *   Body: { "symbols": ["BTCUSDT", "ETHUSDT"], "market": "CRYPTO" }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Yahoo Finance symbol mapping
const INDIA_YAHOO: Record<string, string> = {
  RELIANCE: "RELIANCE.NS",
  HDFCBANK: "HDFCBANK.NS",
  TCS: "TCS.NS",
  INFY: "INFY.NS",
  SBIN: "SBIN.NS",
  TITAN: "TITAN.NS",
  WIPRO: "WIPRO.NS",
  BAJFINANCE: "BAJFINANCE.NS",
  ITC: "ITC.NS",
  MARUTI: "MARUTI.NS",
  ASIANPAINT: "ASIANPAINT.NS",
  SUNPHARMA: "SUNPHARMA.NS",
  LICI: "LICI.NS",
  NIFTY50: "^NSEI",
  SENSEX: "^BSESN",
  BANKNIFTY: "^NSEBANK",
};

const UAE_YAHOO: Record<string, string> = {
  EMAAR: "EMAAR.AE",
  EMIRATESNBD: "EMIRATESNBD.AE",
  DEWA: "DEWA.AE",
  DIB: "DIB.AE",
  DEYAAR: "DEYAAR.AE",
  DFM: "DFM.AE",
};

interface PriceResult {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  currency: string;
  source: string;
  timestamp: number;
}

// ── Yahoo Finance fetcher ─────────────────────────────────────────────────────
async function fetchYahoo(yahooSymbol: string): Promise<PriceResult | null> {
  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;

    const price = meta.regularMarketPrice;
    const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? price;
    const change = price - prevClose;
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      symbol: yahooSymbol.split(".")[0].replace("^", ""),
      price,
      change,
      changePct,
      open: meta.regularMarketDayHigh ? (meta.regularMarketDayLow + meta.regularMarketDayHigh) / 2 : price,
      high: meta.regularMarketDayHigh ?? price,
      low: meta.regularMarketDayLow ?? price,
      prevClose,
      volume: meta.regularMarketVolume ?? 0,
      currency: meta.currency ?? "USD",
      source: "yahoo",
      timestamp: meta.regularMarketTime ?? Math.floor(Date.now() / 1000),
    };
  } catch {
    return null;
  }
}

// ── Finnhub fetcher ───────────────────────────────────────────────────────────
async function fetchFinnhub(
  symbol: string,
  token: string,
): Promise<PriceResult | null> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${token}`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return null;
    const d = await res.json();
    if (!d.c || d.c === 0) return null;

    return {
      symbol,
      price: d.c,
      change: d.d ?? 0,
      changePct: d.dp ?? 0,
      open: d.o ?? d.c,
      high: d.h ?? d.c,
      low: d.l ?? d.c,
      prevClose: d.pc ?? d.c,
      volume: 0,
      currency: "USD",
      source: "finnhub",
      timestamp: d.t ?? Math.floor(Date.now() / 1000),
    };
  } catch {
    return null;
  }
}

// ── Binance fetcher ───────────────────────────────────────────────────────────
async function fetchBinance(symbols: string[]): Promise<PriceResult[]> {
  try {
    const param = symbols.map((s) => `"${s}"`).join(",");
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=[${param}]`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return [];
    const data: {
      symbol: string;
      lastPrice: string;
      priceChangePercent: string;
      highPrice: string;
      lowPrice: string;
      openPrice: string;
      prevClosePrice: string;
      quoteVolume: string;
    }[] = await res.json();

    return data.map((d) => ({
      symbol: d.symbol,
      price: parseFloat(d.lastPrice),
      change: parseFloat(d.lastPrice) - parseFloat(d.prevClosePrice),
      changePct: parseFloat(d.priceChangePercent),
      open: parseFloat(d.openPrice),
      high: parseFloat(d.highPrice),
      low: parseFloat(d.lowPrice),
      prevClose: parseFloat(d.prevClosePrice),
      volume: parseFloat(d.quoteVolume),
      currency: "USD",
      source: "binance",
      timestamp: Math.floor(Date.now() / 1000),
    }));
  } catch {
    return [];
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
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

  let body: { symbols: string[]; market: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { symbols, market } = body;
  if (!symbols?.length || !market) {
    return json({ error: "symbols[] and market required" }, 400);
  }

  const results: PriceResult[] = [];

  if (market === "US") {
    const token = Deno.env.get("FINNHUB_API_KEY") ?? "";
    const fetches = symbols.map((s) => fetchFinnhub(s, token));
    const settled = await Promise.allSettled(fetches);
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value) results.push(r.value);
    }
  } else if (market === "INDIA") {
    const fetches = symbols.map((s) => {
      const yahoo = INDIA_YAHOO[s] ?? `${s}.NS`;
      return fetchYahoo(yahoo);
    });
    const settled = await Promise.allSettled(fetches);
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value) results.push(r.value);
    }
  } else if (market === "UAE") {
    const fetches = symbols.map((s) => {
      const yahoo = UAE_YAHOO[s];
      if (!yahoo) return Promise.resolve(null);
      return fetchYahoo(yahoo);
    });
    const settled = await Promise.allSettled(fetches);
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value) results.push(r.value);
    }
  } else if (market === "CRYPTO") {
    const binanceResults = await fetchBinance(symbols);
    results.push(...binanceResults);
  }

  return json({
    market,
    prices: results,
    fetchedAt: new Date().toISOString(),
    count: results.length,
    requested: symbols.length,
  });
});
