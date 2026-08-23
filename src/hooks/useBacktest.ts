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

export interface Window { from?: string; to?: string }

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

export interface SweepRow {
  symbol: string;
  returnPct: number;
  buyHoldPct: number;
  trades: number;
  winRate: number;
  maxDdPct: number;
  beat: boolean;
  /** A "win" with no trades is cash sitting out a decline, not performance. */
  degenerate: boolean;
}

export interface SweepSkip { symbol: string; reason: string }

export interface BacktestState {
  result: BacktestResult | null;
  sweep: SweepRow[] | null;
  /** Symbols the sweep could not test. Surfaced so the denominator stays honest. */
  sweepSkipped: SweepSkip[];
  sweepProgress: { done: number; total: number } | null;
  running: boolean;
  error: string | null;
  run: (specId: string, symbol: string, window?: Window) => Promise<void>;
  runSweep: (specId: string, symbols: string[], window?: Window) => Promise<void>;
  reset: () => void;
}

export function useBacktest(): BacktestState {
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [sweep, setSweep] = useState<SweepRow[] | null>(null);
  const [sweepSkipped, setSweepSkipped] = useState<SweepSkip[]>([]);
  const [sweepProgress, setSweepProgress] = useState<{ done: number; total: number } | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (specId: string, symbol: string, window?: Window) => {
    const spec: RuleSpec | undefined = RULE_SPECS.find((s) => s.id === specId);
    if (!spec) { setError(`Unknown strategy spec "${specId}"`); return; }

    setRunning(true); setError(null); setResult(null);
    try {
      const candles = await fetchCandles(symbol, window?.from && window.from < "2015" ? 5000 : 2000);
      if (candles.length < spec.warmup + 30) {
        throw new Error(
          `Only ${candles.length} bars available; this strategy needs ${spec.warmup + 30}`
        );
      }
      const res = runBacktest(candles, spec, symbol, DEFAULT_CONFIG, window);
      if (!res) throw new Error("Backtest produced no result");
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  }, []);

  /**
   * Same spec across many symbols. One symbol is an anecdote; the aggregate is
   * the only thing that says whether a rule set has an edge.
   */
  const runSweep = useCallback(async (specId: string, symbols: string[], window?: Window) => {
    const spec = RULE_SPECS.find((s) => s.id === specId);
    if (!spec) { setError(`Unknown strategy spec "${specId}"`); return; }

    setRunning(true); setError(null); setSweep(null); setResult(null); setSweepSkipped([]);
    setSweepProgress({ done: 0, total: symbols.length });
    const rows: SweepRow[] = [];
    const skipped: SweepSkip[] = [];

    for (let i = 0; i < symbols.length; i++) {
      const sym = symbols[i];
      try {
        // Twelve Data allows 8 requests/minute. Firing 12 equity symbols
        // back-to-back gets the tail 429'd, which previously dropped symbols
        // silently and quietly shrank the denominator (3/13 reported as if it
        // were the full universe). Pace uncached equity fetches.
        const bars = window?.from && window.from < "2015" ? 5000 : 2000;
        if (!isCrypto(sym) && !readCache(sym, bars) && i > 0) {
          await new Promise((r) => setTimeout(r, 8000));
        }
        const c = await fetchCandles(sym, bars);
        const r = runBacktest(c, spec, sym, DEFAULT_CONFIG, window);
        if (r) {
          rows.push({
            symbol: sym,
            returnPct: r.metrics.totalReturnPct,
            buyHoldPct: r.metrics.buyHoldReturnPct,
            trades: r.metrics.tradeCount,
            winRate: r.metrics.winRate,
            maxDdPct: r.metrics.maxDrawdownPct,
            beat: r.metrics.totalReturnPct > r.metrics.buyHoldReturnPct,
            degenerate: r.metrics.tradeCount === 0,
          });
        } else {
          skipped.push({ symbol: sym, reason: `needs ${spec.warmup + 30} bars` });
        }
      } catch (e) {
        skipped.push({ symbol: sym, reason: e instanceof Error ? e.message : "fetch failed" });
      }
      setSweepProgress({ done: i + 1, total: symbols.length });
    }
    setSweep(rows);
    setSweepSkipped(skipped);
    setRunning(false);
  }, []);

  const reset = useCallback(() => { setResult(null); setSweep(null); setSweepSkipped([]); setError(null); }, []);

  return { result, sweep, sweepSkipped, sweepProgress, running, error, run, runSweep, reset };
}
