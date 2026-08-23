"use client";

/**
 * Composite portfolio risk, computed from live data.
 *
 * Replaces a hardcoded RISK_INDEX = 38 and a fixed radar. Four of the six
 * original dimensions are genuinely computable from feeds already in use; the
 * other two are not, and are reported as unavailable rather than invented:
 *
 *   Correlation — needs aligned price history across every holding. The free
 *                 tiers give one series per request; a real correlation matrix
 *                 would blow the Twelve Data daily budget.
 *   Geo risk    — no free quantitative source exists at all.
 *
 * The weights below are a judgement call, not an industry standard. They are
 * surfaced in the UI so the number is auditable rather than authoritative.
 */

import { useState, useEffect } from "react";
import { usePaperPortfolio } from "@/hooks/usePaperPortfolio";

const TWELVE_KEY = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY ?? "";

/** Annualised realised vol (%) at which Market Volatility scores 100. Roughly 2008/2020 levels. */
const VOL_CEILING = 35;

export const RISK_WEIGHTS = {
  volatility:    0.35,
  concentration: 0.30,
  exposure:      0.20,
  sentiment:     0.15,
} as const;

export interface RiskDimension {
  dimension: string;
  value: number | null;      // 0-100, null when not computable
  fullMark: 100;
  weight: number;            // 0 for dimensions excluded from the composite
  basis: string;             // shown in the UI so the score can be audited
}

export interface RiskState {
  index: number | null;
  band: "LOW" | "MODERATE" | "ELEVATED" | "HIGH";
  dimensions: RiskDimension[];
  realisedVolPct: number | null;
  fearGreed: number | null;
  investedPct: number;
  loading: boolean;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/** 30-day annualised realised volatility of SPY, as an S&P 500 proxy. */
async function realisedVol(): Promise<number | null> {
  if (!TWELVE_KEY) return null;
  const CACHE = "alphaos:risk:spyvol";
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(CACHE) : null;
    if (raw) {
      const { at, v } = JSON.parse(raw);
      if (Date.now() - at < 60 * 60 * 1000) return v;
    }
  } catch { /* ignore */ }

  try {
    const r = await fetch(
      `https://api.twelvedata.com/time_series?symbol=SPY&interval=1day&outputsize=31&apikey=${TWELVE_KEY}`
    );
    if (!r.ok) return null;
    const d = await r.json();
    if (!Array.isArray(d.values) || d.values.length < 10) return null;

    const closes = d.values.map((v: { close: string }) => Number(v.close)).reverse();
    const rets: number[] = [];
    for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1);
    const annual = Math.sqrt(variance) * Math.sqrt(252) * 100;

    try {
      window.localStorage.setItem(CACHE, JSON.stringify({ at: Date.now(), v: annual }));
    } catch { /* quota */ }
    return annual;
  } catch { return null; }
}

async function fearGreedIndex(): Promise<number | null> {
  try {
    const r = await fetch("https://api.alternative.me/fng/?limit=1");
    if (!r.ok) return null;
    const v = Number((await r.json()).data?.[0]?.value);
    return Number.isFinite(v) ? v : null;
  } catch { return null; }
}

export function useRiskIndex(): RiskState {
  const { positions, stats } = usePaperPortfolio();
  const [vol, setVol] = useState<number | null>(null);
  const [fng, setFng] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [v, f] = await Promise.all([realisedVol(), fearGreedIndex()]);
      if (cancelled) return;
      setVol(v); setFng(f); setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Position-derived measures ─────────────────────────────────────────────
  const totalValue = stats.totalValue || 0;
  const weights = positions.map((p) => {
    const qty = Number(p.quantity);
    const px  = Number(p.current_price ?? p.entry_price);
    return totalValue > 0 ? (qty * px) / totalValue : 0;
  });

  // Herfindahl index over holdings as a share of the WHOLE portfolio, cash
  // included. A mostly-cash account is genuinely unconcentrated, so cash must
  // sit in the denominator or a single small position reads as 100% risk.
  const hhi = weights.reduce((sum, w) => sum + w * w, 0);
  const concentration = clamp(hhi * 100);

  // Share of the portfolio actually at market.
  const investedPct = clamp(weights.reduce((a, b) => a + b, 0) * 100);
  const exposure = investedPct;

  // Volatility: linear to a 35% annualised ceiling.
  const volatility = vol != null ? clamp((vol / VOL_CEILING) * 100) : null;

  // Sentiment: risk rises at BOTH extremes — complacency and panic — so the
  // score is distance from neutral, not the raw greed reading.
  const sentiment = fng != null ? clamp(Math.abs(fng - 50) * 2) : null;

  const dimensions: RiskDimension[] = [
    { dimension: "Volatility",    value: volatility,    fullMark: 100, weight: RISK_WEIGHTS.volatility,
      basis: vol != null ? `SPY 30d realised vol ${vol.toFixed(1)}% annualised (100 at ${VOL_CEILING}%)` : "unavailable" },
    { dimension: "Concentration", value: concentration, fullMark: 100, weight: RISK_WEIGHTS.concentration,
      basis: `Herfindahl over ${positions.length} holding${positions.length === 1 ? "" : "s"}, cash included` },
    { dimension: "Exposure",      value: exposure,      fullMark: 100, weight: RISK_WEIGHTS.exposure,
      basis: `${investedPct.toFixed(1)}% of portfolio at market` },
    { dimension: "Sentiment",     value: sentiment,     fullMark: 100, weight: RISK_WEIGHTS.sentiment,
      basis: fng != null ? `Fear & Greed ${fng}, scored as distance from neutral` : "unavailable" },
    { dimension: "Correlation",   value: null,          fullMark: 100, weight: 0,
      basis: "No free source — needs aligned history for every holding" },
    { dimension: "Geo Risk",      value: null,          fullMark: 100, weight: 0,
      basis: "No free quantitative source" },
  ];

  // Composite over available dimensions only, renormalised so a missing feed
  // lowers confidence rather than silently dragging the score toward zero.
  const scored = dimensions.filter((d) => d.value != null && d.weight > 0);
  const wSum = scored.reduce((a, d) => a + d.weight, 0);
  const index = wSum > 0
    ? Math.round(scored.reduce((a, d) => a + (d.value as number) * d.weight, 0) / wSum)
    : null;

  const band: RiskState["band"] =
    index == null ? "LOW"
    : index < 25 ? "LOW"
    : index < 50 ? "MODERATE"
    : index < 75 ? "ELEVATED"
    : "HIGH";

  return { index, band, dimensions, realisedVolPct: vol, fearGreed: fng, investedPct, loading };
}
