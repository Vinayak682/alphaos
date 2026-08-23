"use client";

/**
 * Fetches historical OHLCV and runs a backtest, entirely client-side.
 *
 * Both sources are CORS-enabled, so this works on the static GitHub Pages
 * export — unlike Morning Brain, which needs an API route.
 *   Equities → Twelve Data time_series (free tier reaches back to ~2006)
 *   Crypto   → Binance klines (1000 daily bars)
 *
 * Candles are cached for 12h. Twelve Data allows 800 credits/day and each run
 * costs one, so re-running a strategy on a symbol you have already loaded is
 * free.
 */

import { useState, useCallback } from "react";
import {
  runBacktest, RULE_SPECS, DEFAULT_CONFIG,
  type Candle, type BacktestResult, type RuleSpec,
} from "@/lib/backtest";

const TWELVE_KEY = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY ?? "";
const CACHE_TTL = 12 * 60 * 60 * 1000;

function cacheKey(symbol: string, bars: number) {
  return `alphaos:bt:${symbol}:${bars}`;
}

function readCache(symbol: string, bars: number): Candle[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(symbol, bars));
    if (!raw) return null;
    const { at, data } = JSON.parse(raw);
    if (Date.now() - at > CACHE_TTL) return null;
    return data as Candle[];
  } catch { return null; }
}

function writeCache(symbol: string, bars: number, data: Candle[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey(symbol, bars), JSON.stringify({ at: Date.now(), data }));
  } catch { /* quota — a few thousand candles can exceed it; non-fatal */ }
}

const isCrypto = (s: string) => /USDT$/i.test(s);

async function fetchCandles(symbol: string, bars = 2000): Promise<Candle[]> {
  const cached = readCache(symbol, bars);
  if (cached) return cached;

  let out: Candle[] = [];

  if (isCrypto(symbol)) {
    const r = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=${Math.min(bars, 1000)}`
    );
    if (!r.ok) throw new Error(`Binance ${r.status}`);
    const rows = (await r.json()) as unknown[][];
    out = rows.map((k) => ({
      date: new Date(k[0] as number).toISOString().slice(0, 10),
      open: Number(k[1]), high: Number(k[2]), low: Number(k[3]),
      close: Number(k[4]), volume: Number(k[5]),
    }));
  } else {
    if (!TWELVE_KEY) throw new Error("No Twelve Data key configured");
    const r = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=${bars}&apikey=${TWELVE_KEY}`
    );
    if (!r.ok) throw new Error(`Twelve Data ${r.status}`);
    const d = await r.json();
    if (!Array.isArray(d.values)) throw new Error(d.message ?? "No data returned");
    // Twelve Data returns newest → oldest.
    out = d.values.map((v: Record<string, string>) => ({
      date: v.datetime,
      open: Number(v.open), high: Number(v.high), low: Number(v.low),
      close: Number(v.close), volume: Number(v.volume ?? 0),
    })).reverse();
  }

  out = out.filter((c) => Number.isFinite(c.close) && c.close > 0);
  writeCache(symbol, bars, out);
  return out;
}

export interface BacktestState {
  result: BacktestResult | null;
  running: boolean;
  error: string | null;
  run: (specId: string, symbol: string) => Promise<void>;
  reset: () => void;
}

export function useBacktest(): BacktestState {
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (specId: string, symbol: string) => {
    const spec: RuleSpec | undefined = RULE_SPECS.find((s) => s.id === specId);
    if (!spec) { setError(`Unknown strategy spec "${specId}"`); return; }

    setRunning(true); setError(null); setResult(null);
    try {
      const candles = await fetchCandles(symbol);
      if (candles.length < spec.warmup + 30) {
        throw new Error(
          `Only ${candles.length} bars available; this strategy needs ${spec.warmup + 30}`
        );
      }
      const res = runBacktest(candles, spec, symbol, DEFAULT_CONFIG);
      if (!res) throw new Error("Backtest produced no result");
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }, []);

  const reset = useCallback(() => { setResult(null); setError(null); }, []);

  return { result, running, error, run, reset };
}
