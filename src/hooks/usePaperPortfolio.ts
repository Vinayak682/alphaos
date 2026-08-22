"use client";
import { useState, useEffect, useCallback } from "react";
import { MOCK_PORTFOLIO } from "@/lib/constants";

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

function computeStats(portfolio: PaperPortfolio | null, positions: PaperPosition[]): PortfolioStats {
  if (!portfolio) return MOCK_PORTFOLIO as PortfolioStats;

  const positionValue = positions.reduce((sum, p) => {
    return sum + p.quantity * (p.current_price ?? p.entry_price);
  }, 0);

  const totalValue = portfolio.cash_balance + positionValue;
  const totalPnl = totalValue - portfolio.initial_balance;
  const totalPnlPct = (totalPnl / portfolio.initial_balance) * 100;

  const unrealisedPnl = positions.reduce((sum, p) => {
    const cur = p.current_price ?? p.entry_price;
    return sum + (p.side === "LONG"
      ? (cur - p.entry_price) * p.quantity
      : (p.entry_price - cur) * p.quantity);
  }, 0);

  const today = new Date().toDateString();
  const dayPositions = positions.filter(
    (p) => new Date(p.opened_at).toDateString() === today
  );
  const dayPnl = dayPositions.reduce((sum, p) => {
    const cur = p.current_price ?? p.entry_price;
    return sum + (p.side === "LONG"
      ? (cur - p.entry_price) * p.quantity
      : (p.entry_price - cur) * p.quantity);
  }, 0);

  const gainers = positions.filter((p) => {
    const cur = p.current_price ?? p.entry_price;
    return p.side === "LONG" ? cur >= p.entry_price : cur <= p.entry_price;
  });

  return {
    totalValue,
    cashBalance: portfolio.cash_balance,
    openPositions: positions.length,
    totalPnl: unrealisedPnl,
    totalPnlPct,
    dayPnl,
    dayPnlPct: totalValue > 0 ? (dayPnl / (totalValue - dayPnl)) * 100 : 0,
    winRate: positions.length > 0 ? (gainers.length / positions.length) * 100 : 0,
  };
}

export function usePaperPortfolio(): UsePaperPortfolioReturn {
  const [portfolio, setPortfolio] = useState<PaperPortfolio | null>(null);
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/paper-trades");
      if (!res.ok) return;
      const data = await res.json();
      if (data.portfolio) setPortfolio(data.portfolio);
      if (data.positions) setPositions(data.positions);
    } catch {
      // API unavailable — keep mock data
    } finally {
      setLoading(false);
    }
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

  return { portfolio, positions, stats, loading, refresh, openTrade, closeTrade };
}
