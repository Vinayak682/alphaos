"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchLivePrices, type LivePrice, type Market } from "@/lib/market-data";

const POLL_MS = 30_000;

export function useLivePrices(symbols: string[], market: Market) {
  const [prices, setPrices] = useState<Map<string, LivePrice>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const prevPrices = useRef<Map<string, number>>(new Map());

  const symKey = symbols.join(",");

  const load = useCallback(async () => {
    if (!symbols.length) return;
    try {
      const map = await fetchLivePrices(symbols, market);
      setPrices(map);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [symKey, market]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true);
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Flash detection: which symbols just ticked up/down
  const ticks: Record<string, "up" | "down" | null> = {};
  for (const sym of symbols) {
    const cur = prices.get(sym)?.price;
    const prev = prevPrices.current.get(sym);
    if (cur !== undefined && prev !== undefined && cur !== prev) {
      ticks[sym] = cur > prev ? "up" : "down";
    } else {
      ticks[sym] = null;
    }
  }

  // Update prev prices after computing ticks
  useEffect(() => {
    const next = new Map<string, number>();
    for (const [sym, lp] of prices) next.set(sym, lp.price);
    prevPrices.current = next;
  }, [prices]);

  const liveCount = Array.from(prices.values()).filter((p) => p.isLive).length;

  return { prices, loading, error, lastUpdated, ticks, liveCount };
}
