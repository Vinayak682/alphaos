"use client";
/**
 * useMarketData — polls /api/quotes every 15s (free-tier safe)
 * Returns live Quote objects keyed by symbol
 */
import { useState, useEffect, useCallback, useRef } from "react";
import type { Quote } from "@/lib/polygon";

type QuoteMap = Record<string, Quote>;

const POLL_MS = 60_000; // 60s — matches server-side cache TTL

export function useMarketData(symbols: string[], market: "US" | "CRYPTO" | "INDIA" | "UAE" = "US") {
  const [quotes, setQuotes]     = useState<QuoteMap>({});
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const prevQuotes = useRef<QuoteMap>({});

  const fetch_ = useCallback(async () => {
    if (!symbols.length) return;
    try {
      const res = await fetch(
        `/api/quotes?symbols=${symbols.join(",")}&market=${market}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "fetch failed");

      const map: QuoteMap = {};
      for (const q of (data.quotes ?? []) as Quote[]) {
        map[q.symbol] = q;
      }
      prevQuotes.current = quotes;
      setQuotes(map);
      setLastUpdated(new Date());
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [symbols.join(","), market]); // eslint-disable-line

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, POLL_MS);
    return () => clearInterval(id);
  }, [fetch_]);

  // Detect which symbols just ticked up/down for flash animation
  const ticks: Record<string, "up" | "down" | null> = {};
  for (const sym of symbols) {
    const cur  = quotes[sym]?.price;
    const prev = prevQuotes.current[sym]?.price;
    if (cur !== undefined && prev !== undefined && cur !== prev) {
      ticks[sym] = cur > prev ? "up" : "down";
    } else {
      ticks[sym] = null;
    }
  }

  return { quotes, loading, error, lastUpdated, ticks };
}

// Convenience: single symbol
export function useQuote(symbol: string, market: "US" | "CRYPTO" | "INDIA" | "UAE" = "US") {
  const { quotes, loading, error, lastUpdated, ticks } = useMarketData([symbol], market);
  return {
    quote:       quotes[symbol.toUpperCase()] ?? null,
    loading,
    error,
    lastUpdated,
    tick:        ticks[symbol.toUpperCase()] ?? null,
  };
}
