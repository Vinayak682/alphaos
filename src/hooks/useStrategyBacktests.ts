"use client";

/**
 * Runs the backtest for every strategy card that maps to an executable spec.
 *
 * Exists to remove a contradiction: the cards used to print winRate 68% /
 * +8.2% monthly next to a backtest panel measuring the same rules at 3 trades
 * over 7 years, badly behind buy & hold. Two numbers for one strategy, only one
 * of them measured.
 *
 * Cards that map to a spec now show MEASURED figures from this hook. Cards that
 * cannot be backtested from price data show no performance numbers at all —
 * see NOT_BACKTESTABLE in the page — rather than illustrative ones.
 */

import { useState, useEffect } from "react";
import { runBacktest, RULE_SPECS, DEFAULT_CONFIG, type BacktestResult, type Candle } from "@/lib/backtest";

const TWELVE_KEY = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY ?? "";
const TTL = 12 * 60 * 60 * 1000;

/** Which card maps to which executable spec, and on what symbol. */
export const CARD_SPECS: Record<number, { specId: string; symbol: string }> = {
  1: { specId: "golden-cross",  symbol: "NVDA" },
  2: { specId: "rsi-reversion", symbol: "AAPL" },
};

async function candles(symbol: string, bars = 2000): Promise<Candle[]> {
  const key = `alphaos:bt:${symbol}:${bars}`;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const { at, data } = JSON.parse(raw);
      if (Date.now() - at < TTL) return data as Candle[];
    }
  } catch { /* ignore */ }

  if (/USDT$/i.test(symbol)) {
    const r = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=1000`);
    if (!r.ok) throw new Error(`Binance ${r.status}`);
    const rows = (await r.json()) as unknown[][];
    const out = rows.map((k) => ({
      date: new Date(k[0] as number).toISOString().slice(0, 10),
      open: Number(k[1]), high: Number(k[2]), low: Number(k[3]),
      close: Number(k[4]), volume: Number(k[5]),
    }));
    try { window.localStorage.setItem(key, JSON.stringify({ at: Date.now(), data: out })); } catch {}
    return out;
  }

  if (!TWELVE_KEY) throw new Error("No Twelve Data key");
  const r = await fetch(
    `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=${bars}&apikey=${TWELVE_KEY}`
  );
  if (!r.ok) throw new Error(`Twelve Data ${r.status}`);
  const d = await r.json();
  if (!Array.isArray(d.values)) throw new Error(d.message ?? "no data");
  const out = d.values.map((v: Record<string, string>) => ({
    date: v.datetime,
    open: Number(v.open), high: Number(v.high), low: Number(v.low),
    close: Number(v.close), volume: Number(v.volume ?? 0),
  })).reverse();
  try { window.localStorage.setItem(key, JSON.stringify({ at: Date.now(), data: out })); } catch {}
  return out;
}

export interface StrategyBacktests {
  results: Record<number, BacktestResult>;
  loading: boolean;
  failed: number[];
}

export function useStrategyBacktests(): StrategyBacktests {
  const [results, setResults] = useState<Record<number, BacktestResult>>({});
  const [failed, setFailed] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out: Record<number, BacktestResult> = {};
      const bad: number[] = [];
      for (const [cardId, { specId, symbol }] of Object.entries(CARD_SPECS)) {
        const spec = RULE_SPECS.find((s) => s.id === specId);
        if (!spec) { bad.push(Number(cardId)); continue; }
        try {
          const c = await candles(symbol);
          const res = runBacktest(c, spec, symbol, DEFAULT_CONFIG);
          if (res) out[Number(cardId)] = res; else bad.push(Number(cardId));
        } catch {
          bad.push(Number(cardId));
        }
      }
      if (cancelled) return;
      setResults(out); setFailed(bad); setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { results, loading, failed };
}
