"use client";

/**
 * AlphaOS — Unified Market Data Client
 *
 * All prices flow through the Supabase Edge Function `market-prices`,
 * which fetches from Finnhub (US), Yahoo Finance (India/UAE), and Binance (Crypto).
 * This avoids CORS issues and centralises data sourcing.
 */

export interface LivePrice {
  symbol:    string;
  price:     number;
  change:    number;
  changePct: number;
  open:      number;
  high:      number;
  low:       number;
  prevClose: number;
  volume:    number;
  currency:  string;
  source:    string;
  timestamp: number;
  isLive:    boolean;
}

export type Market = "US" | "INDIA" | "UAE" | "CRYPTO";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const EDGE_URL = `${SUPABASE_URL}/functions/v1/market-prices`;

const priceCache = new Map<string, { data: LivePrice; fetchedAt: number }>();
const CACHE_TTL_MS = 30_000;

export async function fetchLivePrices(
  symbols: string[],
  market: Market,
): Promise<Map<string, LivePrice>> {
  const map = new Map<string, LivePrice>();
  if (!SUPABASE_URL || !SUPABASE_KEY || symbols.length === 0) return map;

  // Return cached if fresh
  const now = Date.now();
  const uncached: string[] = [];
  for (const sym of symbols) {
    const key = `${market}:${sym}`;
    const cached = priceCache.get(key);
    if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      map.set(sym, cached.data);
    } else {
      uncached.push(sym);
    }
  }
  if (uncached.length === 0) return map;

  try {
    const res = await fetch(EDGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
      },
      body: JSON.stringify({ symbols: uncached, market }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) return map;
    const data = await res.json();

    for (const p of data.prices ?? []) {
      const lp: LivePrice = { ...p, isLive: true };
      map.set(p.symbol, lp);
      priceCache.set(`${market}:${p.symbol}`, { data: lp, fetchedAt: now });
    }
  } catch {
    // Network error — return whatever we have cached (even stale)
    for (const sym of uncached) {
      const key = `${market}:${sym}`;
      const stale = priceCache.get(key);
      if (stale) map.set(sym, { ...stale.data, isLive: false });
    }
  }

  return map;
}

export function clearPriceCache() {
  priceCache.clear();
}
