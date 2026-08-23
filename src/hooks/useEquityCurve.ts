"use client";

/**
 * Portfolio equity reconstructed from the real trade log.
 *
 * Replaces a hardcoded EQUITY_HISTORY array (261,200 -> 287,450) and a fixed
 * "↑ $26,250 (+10.1%)" label, neither of which had any connection to the
 * account.
 *
 * Construction: paper_trade_log stores cash_before/cash_after and a timestamp
 * for every OPEN and CLOSE. Replaying it gives cash at each event, and tracking
 * quantities gives the positions held at that moment. Equity at each event is
 * therefore cash + cost basis of what was open.
 *
 * HONEST LIMIT — this is a realised-equity curve, not a mark-to-market one.
 * Between trades there is no price history for held positions (that would need
 * one time_series request per symbol per day), so intermediate points value
 * holdings at cost. Only the final point is marked to market, from live quotes.
 * Opening a position is therefore equity-neutral, and the curve steps only on
 * realised P&L — which is why it reads flat until the BTCUSDT close.
 *
 * The UI labels it accordingly rather than implying a continuous valuation.
 */

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { usePaperPortfolio } from "@/hooks/usePaperPortfolio";

const DEMO_USER = "00000000-0000-0000-0000-000000000001";

export interface EquityPoint {
  at: string;      // ISO timestamp
  equity: number;
  label: string;   // what happened at this point
}

export interface EquityCurveState {
  points: EquityPoint[];
  changeAbs: number | null;
  changePct: number | null;
  spanLabel: string;      // e.g. "since 29 May" — never a fixed "7-Day"
  isReal: boolean;        // false => nothing to plot, UI must say so
  loading: boolean;
}

interface LogRow {
  created_at: string;
  action: "OPEN" | "CLOSE";
  symbol: string;
  quantity: number | string;
  price: number | string;
  cash_after: number | string;
}

const n = (v: unknown) => {
  const x = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(x) ? x : 0;
};

export function useEquityCurve(): EquityCurveState {
  const { stats, portfolio } = usePaperPortfolio();
  const [rows, setRows] = useState<LogRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) { setLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from("paper_trade_log")
          .select("created_at, action, symbol, quantity, price, cash_after")
          .eq("user_id", DEMO_USER)
          .order("created_at", { ascending: true });
        if (!cancelled && !error && data) setRows(data as LogRow[]);
      } catch { /* leave null */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const initial = n(portfolio?.initial_balance) || 100000;
  const points: EquityPoint[] = [];

  if (rows && rows.length) {
    // Opening balance, just before the first trade.
    points.push({ at: rows[0].created_at, equity: initial, label: "Opening balance" });

    // Replay the log, tracking open quantities at cost.
    const held = new Map<string, { qty: number; cost: number }>();
    for (const r of rows) {
      const qty = n(r.quantity);
      const px  = n(r.price);
      const cur = held.get(r.symbol) ?? { qty: 0, cost: 0 };
      if (r.action === "OPEN") {
        held.set(r.symbol, { qty: cur.qty + qty, cost: px });
      } else {
        const left = cur.qty - qty;
        if (left > 1e-9) held.set(r.symbol, { qty: left, cost: cur.cost });
        else held.delete(r.symbol);
      }
      const basis = Array.from(held.values()).reduce((a, h) => a + h.qty * h.cost, 0);
      points.push({
        at: r.created_at,
        equity: n(r.cash_after) + basis,
        label: `${r.action} ${r.symbol}`,
      });
    }

    // Final point: today, marked to market from live quotes.
    if (stats.totalValue > 0) {
      points.push({ at: new Date().toISOString(), equity: stats.totalValue, label: "Marked to market" });
    }
  }

  const first = points[0]?.equity ?? null;
  const last  = points[points.length - 1]?.equity ?? null;
  const changeAbs = first != null && last != null ? last - first : null;
  const changePct = first ? ((last as number) - first) / first * 100 : null;

  const spanLabel = points.length
    ? `since ${new Date(points[0].at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
    : "no trades yet";

  return {
    points,
    changeAbs,
    changePct,
    spanLabel,
    isReal: points.length > 1,
    loading,
  };
}
