"use client";
import { useState, useEffect, useCallback } from "react";
import { MOCK_PORTFOLIO } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { fetchLivePrices, type Market } from "@/lib/market-data";

// Matches DEMO_USER in src/app/api/paper-trades/route.ts
const DEMO_USER = "00000000-0000-0000-0000-000000000001";

/** Where the numbers on screen actually came from. */
export type PortfolioSource = "api" | "supabase" | "mock";

export interface PaperPosition {
  id: string;
  symbol: string;
  name: string;
  market: string;
  side: "LONG" | "SHORT";
  quantity: number;
  entry_price: number;
  current_price: number;
  stop_loss?: number;
  take_profit?: number;
  currency: string;
  opened_at: string;
  status: "OPEN" | "CLOSED";
  pnl?: number;
  pnl_pct?: number;
}

export interface PaperPortfolio {
  cash_balance: number;
  initial_balance: number;
}

export interface PortfolioStats {
  totalValue: number;
  cashBalance: number;
  openPositions: number;
  totalPnl: number;
  totalPnlPct: number;
  dayPnl: number;
  dayPnlPct: number;
  winRate: number;
}

interface UsePaperPortfolioReturn {
  portfolio: PaperPortfolio | null;
  positions: PaperPosition[];
  stats: PortfolioStats;
  loading: boolean;
  /** "mock" means the figures are placeholders, not a real balance. */
  source: PortfolioSource;
  refresh: () => void;
  openTrade: (params: OpenTradeParams) => Promise<{ ok: boolean; error?: string }>;
  closeTrade: (positionId: string, closePrice: number) => Promise<{ ok: boolean; error?: string }>;
}

export interface OpenTradeParams {
  symbol: string;
  name?: string;
  market?: string;
  side: "LONG" | "SHORT";
  quantity: number;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  currency?: string;
}

/**
 * Postgres NUMERIC columns arrive over PostgREST as STRINGS, not numbers.
 * Without this coercion `cash_balance + positionValue` concatenates instead of
 * adding — which rendered Total Portfolio Value as $0.00 while Cash still
 * looked right, because division coerces but `+` does not.
 */
const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

function computeStats(portfolio: PaperPortfolio | null, positions: PaperPosition[]): PortfolioStats {
  if (!portfolio) return MOCK_PORTFOLIO as PortfolioStats;

  const cash    = num(portfolio.cash_balance);
  const initial = num(portfolio.initial_balance) || cash;

  // Normalise every position once so the maths below is plain arithmetic.
  const rows = positions.map((p) => {
    const entry = num(p.entry_price);
    const cur   = p.current_price != null ? num(p.current_price) : entry;
    const qty   = num(p.quantity);
    return {
      qty, entry, cur,
      openedAt: p.opened_at,
      pnl: p.side === "LONG" ? (cur - entry) * qty : (entry - cur) * qty,
    };
  });

  const positionValue = rows.reduce((sum, r) => sum + r.qty * r.cur, 0);
  const totalValue    = cash + positionValue;
  const totalPnlPct   = initial > 0 ? ((totalValue - initial) / initial) * 100 : 0;
  const unrealisedPnl = rows.reduce((sum, r) => sum + r.pnl, 0);

  const today  = new Date().toDateString();
  const dayPnl = rows
    .filter((r) => new Date(r.openedAt).toDateString() === today)
    .reduce((sum, r) => sum + r.pnl, 0);

  const gainers = rows.filter((r) => r.pnl >= 0).length;

  return {
    totalValue,
    cashBalance: cash,
    openPositions: rows.length,
    totalPnl: unrealisedPnl,
    totalPnlPct,
    dayPnl,
    dayPnlPct: totalValue - dayPnl > 0 ? (dayPnl / (totalValue - dayPnl)) * 100 : 0,
    winRate: rows.length > 0 ? (gainers / rows.length) * 100 : 0,
  };
}

/**
 * Read the portfolio straight from Supabase.
 *
 * The static GitHub Pages export has no /api/paper-trades — CI deletes
 * src/app/api before building — so without this the dashboard silently showed
 * MOCK_PORTFOLIO ($287k) instead of the real balance. anon/publishable keys
 * have SELECT on both tables under the existing RLS policies, so a direct read
 * works client-side. Writes still require the API route and its service key.
 */
async function loadFromSupabase(): Promise<
  { portfolio: PaperPortfolio; positions: PaperPosition[] } | null
> {
  if (!supabase) return null;
  try {
    const [portRes, posRes] = await Promise.all([
      supabase.from("paper_portfolios")
        .select("cash_balance, initial_balance")
        .eq("user_id", DEMO_USER).single(),
      supabase.from("paper_positions")
        .select("*")
        .eq("user_id", DEMO_USER).eq("status", "OPEN")
        .order("opened_at", { ascending: false }),
    ]);
    if (portRes.error || !portRes.data) return null;
    return {
      portfolio: portRes.data as PaperPortfolio,
      positions: (posRes.data ?? []) as PaperPosition[],
    };
  } catch {
    return null;
  }
}

/**
 * Refresh current_price for display only.
 *
 * The API route persists prices server-side; on the static export we cannot
 * write, so prices are refreshed in memory. Without this, P&L is frozen at
 * whatever current_price was last written by a local dev run.
 */
async function withLivePrices(positions: PaperPosition[]): Promise<PaperPosition[]> {
  if (!positions.length) return positions;
  const byMarket = new Map<string, string[]>();
  for (const p of positions) {
    const list = byMarket.get(p.market) ?? [];
    list.push(p.symbol);
    byMarket.set(p.market, list);
  }
  const priced = new Map<string, number>();
  await Promise.allSettled(
    Array.from(byMarket, async ([market, symbols]) => {
      const map = await fetchLivePrices(symbols, market as Market);
      for (const [sym, lp] of map) priced.set(`${market}:${sym}`, lp.price);
    })
  );
  if (!priced.size) return positions;
  return positions.map((p) => {
    const live = priced.get(`${p.market}:${p.symbol}`);
    return live && live > 0 ? { ...p, current_price: live } : p;
  });
}

export function usePaperPortfolio(): UsePaperPortfolioReturn {
  const [portfolio, setPortfolio] = useState<PaperPortfolio | null>(null);
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<PortfolioSource>("mock");

  const refresh = useCallback(async () => {
    // 1. API route — dev only, but it also persists refreshed prices.
    try {
      const res = await fetch("/api/paper-trades");
      if (res.ok) {
        const data = await res.json();
        if (data.portfolio) {
          setPortfolio(data.portfolio);
          setPositions(data.positions ?? []);
          setSource("api");
          setLoading(false);
          return;
        }
      }
    } catch {
      // fall through to the direct read
    }

    // 2. Direct Supabase read — this is the path on GitHub Pages.
    const direct = await loadFromSupabase();
    if (direct) {
      setPortfolio(direct.portfolio);
      setPositions(await withLivePrices(direct.positions));
      setSource("supabase");
      setLoading(false);
      return;
    }

    // 3. Neither available — computeStats falls back to MOCK_PORTFOLIO.
    setSource("mock");
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const openTrade = useCallback(async (params: OpenTradeParams) => {
    try {
      const res = await fetch("/api/paper-trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error };
      await refresh();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }, [refresh]);

  const closeTrade = useCallback(async (positionId: string, closePrice: number) => {
    try {
      const res = await fetch("/api/paper-trades", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionId, closePrice }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error };
      await refresh();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }, [refresh]);

  const stats = computeStats(portfolio, positions);

  return { portfolio, positions, stats, loading, source, refresh, openTrade, closeTrade };
}
