"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchGoldSpot,
  fetchGoldHistory,
  fetchGoldOHLC,
  fetchPerBarrel,
  fetchProxyQuotes,
  computeSeriesStats,
  analyseSeries,
  correlation,
  COMMODITY_PROXIES,
  type CommodityQuote,
  type HistoryPoint,
  type PerUnitSeries,
  type SeriesStats,
} from "@/lib/commodities";
import type { Indicators } from "@/lib/technicals";

const QUOTE_POLL_MS = 60_000;

export interface CommoditiesState {
  // Live
  gold: CommodityQuote | null;
  proxies: Map<string, CommodityQuote>;
  // History
  goldHistory: HistoryPoint[];
  wti: PerUnitSeries | null;
  brent: PerUnitSeries | null;
  // Analysis
  goldStats: SeriesStats | null;
  wtiStats: SeriesStats | null;
  brentStats: SeriesStats | null;
  goldIndicators: Indicators | null;
  brentWtiSpread: number | null;
  goldOilRatio: number | null;
  wtiBrentCorrelation: number | null;
  // Meta
  loading: boolean;
  refreshing: boolean;
  lastUpdated: Date | null;
  errors: string[];
  refresh: () => void;
}

export function useCommodities(): CommoditiesState {
  const [gold, setGold] = useState<CommodityQuote | null>(null);
  const [proxies, setProxies] = useState<Map<string, CommodityQuote>>(new Map());
  const [goldHistory, setGoldHistory] = useState<HistoryPoint[]>([]);
  const [goldIndicators, setGoldIndicators] = useState<Indicators | null>(null);
  const [wti, setWti] = useState<PerUnitSeries | null>(null);
  const [brent, setBrent] = useState<PerUnitSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  /** Quotes only — cheap, safe to poll. */
  const loadQuotes = useCallback(async () => {
    const [spot, px] = await Promise.all([
      fetchGoldSpot(),
      fetchProxyQuotes(COMMODITY_PROXIES),
    ]);
    if (!mounted.current) return;
    if (spot) setGold(spot);
    if (px.size) setProxies(px);
    setLastUpdated(new Date());
  }, []);

  /** History + indicators — expensive and heavily cached, so load once. */
  const loadHistory = useCallback(async () => {
    const problems: string[] = [];

    const [hist, ohlc, wtiSeries, brentSeries] = await Promise.all([
      fetchGoldHistory(400),
      fetchGoldOHLC(400),
      fetchPerBarrel("WTI", "monthly"),
      fetchPerBarrel("BRENT", "monthly"),
    ]);
    if (!mounted.current) return;

    if (hist.length) setGoldHistory(hist);
    else problems.push("Gold history unavailable (Twelve Data limit or missing key)");

    if (ohlc.closes.length >= 30) {
      setGoldIndicators(analyseSeries(ohlc.closes, ohlc.highs, ohlc.lows));
    }

    if (wtiSeries) setWti(wtiSeries);
    else problems.push("WTI per-barrel history unavailable (Alpha Vantage daily limit)");

    if (brentSeries) setBrent(brentSeries);
    else problems.push("Brent per-barrel history unavailable (Alpha Vantage daily limit)");

    setErrors(problems);
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([loadQuotes(), loadHistory()]).finally(() => {
      if (mounted.current) setRefreshing(false);
    });
  }, [loadQuotes, loadHistory]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.all([loadQuotes(), loadHistory()]);
      if (!cancelled && mounted.current) setLoading(false);
    })();
    const id = setInterval(loadQuotes, QUOTE_POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [loadQuotes, loadHistory]);

  // ── Derived analysis ────────────────────────────────────────────────────────
  const goldStats  = goldHistory.length ? computeSeriesStats(goldHistory) : null;
  const wtiStats   = wti ? computeSeriesStats(wti.points) : null;
  const brentStats = brent ? computeSeriesStats(brent.points) : null;

  const wtiLatest   = wtiStats?.latest ?? null;
  const brentLatest = brentStats?.latest ?? null;

  // Brent normally trades at a premium to WTI; the spread is a freight/quality signal.
  const brentWtiSpread =
    brentLatest != null && wtiLatest != null ? brentLatest - wtiLatest : null;

  // Ounces of gold per barrel of oil — a classic macro ratio.
  const goldOilRatio =
    gold?.price != null && brentLatest != null && brentLatest > 0
      ? gold.price / brentLatest
      : null;

  const wtiBrentCorrelation =
    wti && brent
      ? correlation(wti.points.map((p) => p.value), brent.points.map((p) => p.value))
      : null;

  return {
    gold,
    proxies,
    goldHistory,
    wti,
    brent,
    goldStats,
    wtiStats,
    brentStats,
    goldIndicators,
    brentWtiSpread,
    goldOilRatio,
    wtiBrentCorrelation,
    loading,
    refreshing,
    lastUpdated,
    errors,
    refresh,
  };
}
