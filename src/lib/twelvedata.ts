"use client";

/**
 * Twelve Data REST client for India (NSE) + UAE (DFM/ADX) stock prices.
 * Free tier: 800 API calls/day, covers 50+ global exchanges.
 * Symbols use exchange suffix: RELIANCE:NSE, EMAAR:DFM, FAB:ADX
 */

export interface TwelveDataQuote {
  symbol:    string;
  price:     number;
  change:    number;
  changePct: number;
  open:      number;
  high:      number;
  low:       number;
  prevClose: number;
  volume:    number;
  timestamp: number;
}

const API = "https://api.twelvedata.com";

function getKey(): string {
  return typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY ?? "")
    : "";
}

/**
 * Fetch a batch of quotes. Twelve Data supports comma-separated symbols
 * in a single call: /quote?symbol=RELIANCE:NSE,HDFCBANK:NSE,EMAAR:DFM
 * This counts as 1 API call per symbol in the batch.
 */
export async function fetchTwelveDataQuotes(
  symbols: string[],
): Promise<Map<string, TwelveDataQuote>> {
  const key = getKey();
  if (!key || symbols.length === 0) return new Map();

  const map = new Map<string, TwelveDataQuote>();

  // Twelve Data /quote supports batch via comma-separated symbols
  const joined = symbols.join(",");
  try {
    const r = await fetch(
      `${API}/quote?symbol=${encodeURIComponent(joined)}&apikey=${key}`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!r.ok) return map;
    const data = await r.json();

    // Single symbol returns object; multiple returns object keyed by symbol
    if (symbols.length === 1) {
      const d = data;
      if (d && d.close && d.status !== "error") {
        const baseSymbol = symbols[0].split(":")[0];
        map.set(baseSymbol, parseQuote(baseSymbol, d));
      }
    } else {
      for (const [sym, d] of Object.entries(data)) {
        const raw = d as Record<string, unknown>;
        if (raw && raw.close && raw.status !== "error") {
          const baseSymbol = sym.split(":")[0];
          map.set(baseSymbol, parseQuote(baseSymbol, raw));
        }
      }
    }
  } catch { /* network error — return empty */ }

  return map;
}

function parseQuote(symbol: string, d: Record<string, unknown>): TwelveDataQuote {
  const close     = parseFloat(d.close as string)     || 0;
  const prevClose = parseFloat(d.previous_close as string) || close;
  const change    = close - prevClose;
  const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

  return {
    symbol,
    price:     close,
    change,
    changePct,
    open:      parseFloat(d.open as string)   || close,
    high:      parseFloat(d.high as string)    || close,
    low:       parseFloat(d.low as string)     || close,
    prevClose,
    volume:    parseInt(d.volume as string)    || 0,
    timestamp: parseInt(d.timestamp as string) || Date.now() / 1000,
  };
}

// Symbol mapping helpers for Twelve Data exchange format
export const INDIA_SYMBOLS_TD: Record<string, string> = {
  RELIANCE:   "RELIANCE:NSE",
  HDFCBANK:   "HDFCBANK:NSE",
  TCS:        "TCS:NSE",
  INFY:       "INFY:NSE",
  SBIN:       "SBIN:NSE",
  TITAN:      "TITAN:NSE",
  WIPRO:      "WIPRO:NSE",
  BAJFINANCE: "BAJFINANCE:NSE",
  ITC:        "ITC:NSE",
  LTIM:       "LTIM:NSE",
  MARUTI:     "MARUTI:NSE",
  ASIANPAINT: "ASIANPAINT:NSE",
  SUNPHARMA:  "SUNPHARMA:NSE",
};

export const UAE_SYMBOLS_TD: Record<string, string> = {
  FAB:         "FAB:ADX",
  EMAAR:       "EMAAR:DFM",
  ADNOCGAS:    "ADNOC GAS:ADX",
  EMIRATESNBD: "EMIRATES NBD:DFM",
  DEWA:        "DEWA:DFM",
  ADCB:        "ADCB:ADX",
  DIB:         "DIB:DFM",
  ETISALAT:    "ETISALAT:ADX",
  DAMAC:       "DAMAC:DFM",
  DEYAAR:      "DEYAAR:DFM",
  ADNOCDIST:   "ADNOC DIST:ADX",
  ALDAR:       "ALDAR:ADX",
};
