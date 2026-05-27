/**
 * AlphaOS — Polygon.io API Client
 * Free Tier Compatible — uses aggregates + reference endpoints only
 *
 * Free endpoints used:
 *   ✅ /v2/aggs/ticker/{ticker}/range/{mult}/{span}/{from}/{to}  — OHLCV candles
 *   ✅ /v1/marketstatus/now                                      — market open/close
 *   ✅ /v3/reference/tickers/{ticker}                            — company details
 *
 * NOT used (paid only):
 *   ❌ /v2/snapshot/...  — requires Stocks Starter ($29/mo)
 *   ❌ WebSocket streams — requires paid plan
 */

const BASE = "https://api.polygon.io";
const KEY  = process.env.POLYGON_API_KEY!;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Quote {
  symbol:    string;
  price:     number;   // latest close
  open:      number;
  high:      number;
  low:       number;
  close:     number;
  prevClose: number;
  change:    number;
  changePct: number;
  volume:    number;
  vwap:      number;
  timestamp: number;
  market:    "US" | "CRYPTO" | "INDIA" | "UAE";
  source:    "polygon" | "fallback";
}

export interface Candle {
  time:   number;  // Unix ms
  open:   number;
  high:   number;
  low:    number;
  close:  number;
  volume: number;
  vwap?:  number;
}

export interface TickerDetail {
  symbol:      string;
  name:        string;
  market:      string;
  exchange:    string;
  currency:    string;
  description: string;
  logoUrl?:    string;
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

async function polyFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(BASE + path);
  url.searchParams.set("apiKey", KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Polygon ${path} → ${res.status} ${res.statusText}${text ? ": " + text.slice(0, 120) : ""}`);
  }
  return res.json() as Promise<T>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the most recent business days as YYYY-MM-DD strings */
function recentTradingDays(n = 5): { from: string; to: string } {
  const to   = new Date();
  const from = new Date(to);
  // Go back n*2 calendar days to safely cover weekends/holidays
  from.setDate(from.getDate() - n * 2);
  return {
    from: from.toISOString().slice(0, 10),
    to:   to.toISOString().slice(0, 10),
  };
}

// ─── Single ticker quote via daily aggregates ─────────────────────────────────

export async function getDailyQuote(symbol: string, market: "US" | "CRYPTO" = "US"): Promise<Quote | null> {
  try {
    const { from, to } = recentTradingDays(5);
    const poly = market === "CRYPTO" ? `X:${symbol.replace("USDT", "USD").replace("BUSD", "USD")}` : symbol.toUpperCase();

    const data = await polyFetch<{ results?: AggResult[]; ticker: string }>(
      `/v2/aggs/ticker/${poly}/range/1/day/${from}/${to}`,
      { adjusted: "true", sort: "asc", limit: "10" }
    );

    const results = data.results ?? [];
    if (results.length === 0) return null;

    const today    = results[results.length - 1];
    const prev     = results.length > 1 ? results[results.length - 2] : today;
    const price    = today.c;
    const prevClose = prev.c;
    const change   = price - prevClose;
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      symbol:    symbol.toUpperCase(),
      price,
      open:      today.o,
      high:      today.h,
      low:       today.l,
      close:     today.c,
      prevClose,
      change,
      changePct,
      volume:    today.v,
      vwap:      today.vw ?? price,
      timestamp: today.t,
      market,
      source:    "polygon",
    };
  } catch {
    return null;
  }
}

// ─── Batch quotes — runs in parallel ─────────────────────────────────────────

export async function getBatchQuotes(
  symbols: string[],
  market: "US" | "CRYPTO" = "US"
): Promise<Quote[]> {
  const results = await Promise.allSettled(
    symbols.map((s) => getDailyQuote(s, market))
  );
  return results
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((q): q is Quote => q !== null);
}

// ─── Historical candles ───────────────────────────────────────────────────────

export async function getCandles(
  symbol:     string,
  timespan:   "minute" | "hour" | "day" | "week" = "day",
  from:       string,
  to:         string,
  multiplier  = 1
): Promise<Candle[]> {
  const poly = symbol.includes("USDT") || symbol.includes("BTC") || symbol.includes("ETH")
    ? `X:${symbol.replace("USDT", "USD")}`
    : symbol.toUpperCase();

  const data = await polyFetch<{ results?: AggResult[] }>(
    `/v2/aggs/ticker/${poly}/range/${multiplier}/${timespan}/${from}/${to}`,
    { adjusted: "true", sort: "asc", limit: "500" }
  );

  return (data.results ?? []).map((r) => ({
    time:   r.t,
    open:   r.o,
    high:   r.h,
    low:    r.l,
    close:  r.c,
    volume: r.v,
    vwap:   r.vw,
  }));
}

// ─── Ticker details ───────────────────────────────────────────────────────────

export async function getTickerDetail(symbol: string): Promise<TickerDetail | null> {
  try {
    const data = await polyFetch<{ results?: PolyTickerDetail }>(
      `/v3/reference/tickers/${symbol.toUpperCase()}`
    );
    const r = data.results;
    if (!r) return null;
    return {
      symbol:      r.ticker,
      name:        r.name,
      market:      r.market,
      exchange:    r.primary_exchange,
      currency:    r.currency_name,
      description: r.description ?? "",
      logoUrl:     r.branding?.logo_url,
    };
  } catch {
    return null;
  }
}

// ─── Market status ────────────────────────────────────────────────────────────

export async function getMarketStatus(): Promise<{ market: string; open: boolean; serverTime: string }> {
  try {
    const data = await polyFetch<{ market: string; serverTime: string }>(
      "/v1/marketstatus/now"
    );
    return { market: data.market, open: data.market === "open", serverTime: data.serverTime };
  } catch {
    return { market: "unknown", open: false, serverTime: new Date().toISOString() };
  }
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface AggResult {
  o: number; h: number; l: number; c: number; v: number; vw?: number; t: number;
}

interface PolyTickerDetail {
  ticker:           string;
  name:             string;
  market:           string;
  primary_exchange: string;
  currency_name:    string;
  description?:     string;
  branding?:        { logo_url?: string; icon_url?: string };
}
