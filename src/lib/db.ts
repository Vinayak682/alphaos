/**
 * AlphaOS — DB fetch layer
 * Tries Supabase first, falls back to static data from institutions.ts / strategies.ts
 * This means the app works with or without Supabase configured.
 */
import { supabase, supabaseReady } from "./supabase";
import {
  US_INSTITUTIONS, INDIA_SUPERINVESTORS, UAE_DIVIDEND_STOCKS,
  STRATEGY_EXACT_PARAMS, WAHA_FUNDS, UAE_SOVEREIGN_FUNDS,
} from "./institutions";
import { STRATEGIES } from "./strategies";

// ─── US Institutions ─────────────────────────────────────────
export async function fetchUSInstitutions() {
  if (!supabaseReady || !supabase) return US_INSTITUTIONS;
  const { data, error } = await supabase
    .from("us_institutions")
    .select("*")
    .order("portfolio_value_b", { ascending: false });
  if (error || !data?.length) return US_INSTITUTIONS;

  // Map snake_case DB columns → camelCase frontend shape
  return data.map((r: Record<string, unknown>) => ({
    id:             r.id,
    name:           r.name,
    manager:        r.manager,
    reportingPeriod: r.reporting_period,
    portfolioValueB: Number(r.portfolio_value_b),
    uniqueStocks:   r.unique_stocks,
    topSectors:     (r.top_sectors as unknown[]) ?? [],
    topHoldings:    (r.top_holdings as unknown[]) ?? [],
    recentBuys:     (r.recent_buys as unknown[]) ?? [],
    recentSells:    (r.recent_sells as unknown[]) ?? [],
    strategy:       r.strategy,
    strategyDetail: r.strategy_detail,
    performance:    r.performance,
    color:          r.color ?? "blue",
  }));
}

// ─── Indian Superinvestors ────────────────────────────────────
export async function fetchIndiaInvestors() {
  if (!supabaseReady || !supabase) return INDIA_SUPERINVESTORS;
  const { data, error } = await supabase
    .from("india_superinvestors")
    .select("*")
    .order("portfolio_inr_cr", { ascending: false });
  if (error || !data?.length) return INDIA_SUPERINVESTORS;
  return data.map((r: Record<string, unknown>) => ({
    id:              r.id,
    name:            r.name,
    firm:            r.firm,
    portfolioINRCr:  Number(r.portfolio_inr_cr),
    stockCount:      r.stock_count,
    topHoldings:     (r.top_holdings as unknown[]) ?? [],
    framework:       r.framework,
    entryDiscipline: r.entry_discipline,
    exitRule:        r.exit_rule,
    sizing:          r.sizing,
    color:           r.color ?? "green",
  }));
}

// ─── UAE Dividend Stocks ──────────────────────────────────────
export async function fetchUAEStocks() {
  if (!supabaseReady || !supabase) return UAE_DIVIDEND_STOCKS;
  const { data, error } = await supabase
    .from("uae_dividend_stocks")
    .select("*")
    .order("market_cap_aed", { ascending: false });
  if (error || !data?.length) return UAE_DIVIDEND_STOCKS;
  return data.map((r: Record<string, unknown>) => ({
    ticker:              r.ticker,
    exchange:            r.exchange as "ADX" | "DFM",
    name:                r.name,
    sector:              r.sector,
    marketCapAED:        Number(r.market_cap_aed),
    dividendYield:       Number(r.dividend_yield),
    avgDailyVolShares:   Number(r.avg_daily_vol_shares),
    sovereignHolder:     r.sovereign_holder,
    color:               r.color ?? "blue",
  }));
}

// ─── Strategies ───────────────────────────────────────────────
export async function fetchStrategies() {
  if (!supabaseReady || !supabase) return STRATEGIES;
  const { data, error } = await supabase
    .from("strategies")
    .select("*")
    .order("pnl", { ascending: false });
  if (error || !data?.length) return STRATEGIES;
  return data.map((r: Record<string, unknown>) => ({
    id:            r.id,
    name:          r.name,
    trader:        r.trader,
    markets:       (r.markets as string[]) ?? [],
    style:         r.style,
    riskLevel:     r.risk_level,
    description:   r.description,
    keyPrinciples: (r.key_principles as string[]) ?? [],
    entry:         (r.entry as object) ?? {},
    exit:          (r.exit_rules as object) ?? {},
    risk:          (r.risk as object) ?? {},
    performance:   (r.performance as object) ?? {},
    equityCurve:   (r.equity_curve as unknown[]) ?? [],
    maxDrawdownSeries: [],
    tags:          (r.tags as string[]) ?? [],
    color:         r.color ?? "blue",
    status:        r.status ?? "paused",
    pnl:           Number(r.pnl),
    signals:       Number(r.signals),
  }));
}

// ─── Strategy Exact Params ────────────────────────────────────
export async function fetchStrategyParams() {
  if (!supabaseReady || !supabase) return STRATEGY_EXACT_PARAMS;
  const { data, error } = await supabase
    .from("strategy_exact_params")
    .select("*")
    .order("id");
  if (error || !data?.length) return STRATEGY_EXACT_PARAMS;
  return data.map((r: Record<string, unknown>) => ({
    name:            r.name,
    regime:          r.regime,
    entryTrigger:    r.entry_trigger,
    exitTrigger:     r.exit_trigger,
    hardStopLoss:    r.hard_stop_loss,
    trailingStop:    r.trailing_stop,
    volumeRule:      r.volume_rule,
    positionSizing:  r.position_sizing,
    targetRR:        r.target_rr,
    targetSharpe:    r.target_sharpe,
  }));
}

// ─── Waha + Sovereign helpers ─────────────────────────────────
export async function fetchWahaFunds() {
  if (!supabaseReady || !supabase) return WAHA_FUNDS;
  const { data, error } = await supabase.from("waha_funds").select("*");
  if (error || !data?.length) return WAHA_FUNDS;
  return data.map((r: Record<string, unknown>) => ({
    name: r.name, aum: r.aum, inception: r.inception,
    cumulativeReturn: r.cumulative_return, focus: r.focus, strategy: r.strategy,
  }));
}

export async function fetchSovereignFunds() {
  if (!supabaseReady || !supabase) return UAE_SOVEREIGN_FUNDS;
  const { data, error } = await supabase.from("uae_sovereign_funds").select("*");
  if (error || !data?.length) return UAE_SOVEREIGN_FUNDS;
  return data.map((r: Record<string, unknown>) => ({
    name: r.name, estimatedAUM: r.estimated_aum, focus: r.focus, strategy: r.strategy,
  }));
}
