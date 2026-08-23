"use client";

/**
 * Live tiles for the /markets overview strip.
 *
 * This strip used to be a hardcoded MARKET_OVERVIEW array — S&P 500 5,892.40,
 * SENSEX 81,204, BTC dominance 54.2% — sitting above a table that was by then
 * showing real prices. Every figure was wrong (actual SENSEX 77,540, actual BTC
 * dominance 59.4%).
 *
 * Only tiles with a real free source are returned. Two things are deliberately
 * NOT included, because the obvious source is wrong rather than missing:
 *   - ADX / DFM indices: asking the Edge Function for "DFM" returns AED 1.41,
 *     which is the Dubai Financial Market *company share*, not the index.
 *   - NIFTY 50: does not resolve through the Edge Function's symbol map, unlike
 *     SENSEX and BANKNIFTY.
 *
 * Where only a proxy exists, the label says so. VIXY is a VIX *futures ETF*, not
 * the VIX index, and UUP is a dollar-index fund, not DXY itself — printing their
 * prices under "VIX" and "DXY" would repeat the original mistake in a new place.
 */

import { useState, useEffect } from "react";
import { fetchLivePrices } from "@/lib/market-data";
import { fetchPerBarrel } from "@/lib/commodities";

const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";
const TWELVE_KEY  = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY ?? "";

export interface OverviewTile {
  label: string;
  value: string;
  changePct: number | null;
  sub: string;
}

async function finnhub(symbol: string): Promise<{ price: number; changePct: number } | null> {
  if (!FINNHUB_KEY) return null;
  try {
    const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
    if (!r.ok) return null;
    const d = await r.json();
    return typeof d.c === "number" && d.c > 0 ? { price: d.c, changePct: d.dp ?? 0 } : null;
  } catch { return null; }
}

async function twelve(pair: string): Promise<{ price: number; changePct: number } | null> {
  if (!TWELVE_KEY) return null;
  try {
    const r = await fetch(`https://api.twelvedata.com/quote?symbol=${pair}&apikey=${TWELVE_KEY}`);
    if (!r.ok) return null;
    const d = await r.json();
    if (d.code || !d.close) return null;
    return { price: Number(d.close), changePct: Number(d.percent_change ?? 0) };
  } catch { return null; }
}

const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

async function usTiles(): Promise<OverviewTile[]> {
  const [spy, qqq, vixy, uup] = await Promise.all([
    finnhub("SPY"), finnhub("QQQ"), finnhub("VIXY"), finnhub("UUP"),
  ]);
  const out: OverviewTile[] = [];
  if (spy)  out.push({ label: "S&P 500",     value: `$${fmt(spy.price)}`,  changePct: spy.changePct,  sub: "via SPY ETF" });
  if (qqq)  out.push({ label: "NASDAQ 100",  value: `$${fmt(qqq.price)}`,  changePct: qqq.changePct,  sub: "via QQQ ETF" });
  if (vixy) out.push({ label: "Volatility",  value: `$${fmt(vixy.price)}`, changePct: vixy.changePct, sub: "VIXY — VIX futures ETF, not the index" });
  if (uup)  out.push({ label: "US Dollar",   value: `$${fmt(uup.price)}`,  changePct: uup.changePct,  sub: "UUP fund — tracks DXY, not the index level" });
  return out;
}

async function indiaTiles(): Promise<OverviewTile[]> {
  const out: OverviewTile[] = [];
  const prices = await fetchLivePrices(["SENSEX", "BANKNIFTY"], "INDIA");
  // The Edge Function echoes Yahoo's symbols back, not the ones we asked for.
  const sensex = prices.get("BSESN")   ?? prices.get("SENSEX");
  const bank   = prices.get("NSEBANK") ?? prices.get("BANKNIFTY");
  if (sensex) out.push({ label: "SENSEX",     value: fmt(sensex.price, 0), changePct: sensex.changePct, sub: "BSE 30" });
  if (bank)   out.push({ label: "NIFTY BANK", value: fmt(bank.price, 0),   changePct: bank.changePct,   sub: "Financials" });
  const inr = await twelve("USD/INR");
  if (inr) out.push({ label: "USD/INR", value: fmt(inr.price), changePct: inr.changePct, sub: "Rupee" });
  return out;
}

async function uaeTiles(): Promise<OverviewTile[]> {
  const out: OverviewTile[] = [];
  const aed = await twelve("USD/AED");
  if (aed) out.push({ label: "USD/AED", value: fmt(aed.price, 4), changePct: aed.changePct, sub: "Pegged rate" });
  const brent = await fetchPerBarrel("BRENT", "monthly");
  const last = brent?.points.at(-1);
  if (last) {
    const prev = brent!.points.at(-2);
    out.push({
      label: "Brent Crude",
      value: `$${fmt(last.value)}`,
      changePct: prev ? ((last.value - prev.value) / prev.value) * 100 : null,
      sub: `$/bbl · ${last.date}`,
    });
  }
  return out;
}

async function cryptoTiles(): Promise<OverviewTile[]> {
  const out: OverviewTile[] = [];
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/global");
    if (r.ok) {
      const g = (await r.json()).data;
      out.push({
        label: "BTC Dominance",
        value: `${g.market_cap_percentage.btc.toFixed(1)}%`,
        changePct: null, sub: "Share of total cap",
      });
      out.push({
        label: "Total MCap",
        value: `$${(g.total_market_cap.usd / 1e12).toFixed(2)}T`,
        changePct: g.market_cap_change_percentage_24h_usd ?? null,
        sub: "Global crypto",
      });
    }
  } catch { /* skip */ }

  try {
    const r = await fetch("https://api.alternative.me/fng/?limit=1");
    if (r.ok) {
      const d = (await r.json()).data?.[0];
      if (d) out.push({ label: "Fear / Greed", value: d.value, changePct: null, sub: d.value_classification });
    }
  } catch { /* skip */ }

  try {
    const r = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=ETHBTC");
    if (r.ok) {
      const d = await r.json();
      out.push({
        label: "ETH/BTC",
        value: Number(d.lastPrice).toFixed(5),
        changePct: Number(d.priceChangePercent),
        sub: "Alt ratio",
      });
    }
  } catch { /* skip */ }
  return out;
}

export function useMarketOverview(market: string) {
  const [tiles, setTiles] = useState<OverviewTile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const fn = market === "US" ? usTiles
        : market === "INDIA" ? indiaTiles
        : market === "UAE" ? uaeTiles
        : cryptoTiles;
      const t = await fn();
      if (cancelled) return;
      setTiles(t);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [market]);

  return { tiles, loading };
}
