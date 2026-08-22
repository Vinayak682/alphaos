/**
 * AlphaOS — Commodities (Oil & Gold)
 *
 * Every source here is CORS-enabled, so this layer works client-side and
 * therefore survives the static GitHub Pages export (no API routes, no
 * Supabase Edge Function). Verified 2026-08-22:
 *
 *   Gold spot + history   → Twelve Data  (XAU/USD, free tier)
 *   Oil $/barrel history  → Alpha Vantage (WTI + BRENT, "dollars per barrel")
 *   Live proxies/equities → Finnhub      (USO, BNO, GLD, majors, miners)
 *
 * Known free-tier limits, which is why everything is cached:
 *   Twelve Data   800 credits/day, 8 req/min
 *   Alpha Vantage 25 req/day  ← the tight one; per-barrel data is monthly
 *   Finnhub       60 req/min
 */

import { computeIndicators, type Indicators } from "@/lib/technicals";

const TWELVE_KEY   = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY ?? "";
const FINNHUB_KEY  = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";
// Alpha Vantage's "demo" key serves WTI/BRENT, so the feature degrades rather
// than dies when no key is configured. Get a free one at alphavantage.co.
const ALPHA_KEY    = process.env.NEXT_PUBLIC_ALPHAVANTAGE_API_KEY || "demo";

// ── Types ─────────────────────────────────────────────────────────────────────

export type OilGrade = "WTI" | "BRENT";
export type CommodityKind = "ENERGY" | "METAL";

export interface CommodityQuote {
  symbol: string;
  name: string;
  kind: CommodityKind;
  unit: string;           // "per barrel" | "per troy ounce" | "per share"
  price: number;
  change: number;
  changePct: number;
  open?: number;
  high?: number;
  low?: number;
  prevClose?: number;
  week52Low?: number;
  week52High?: number;
  source: string;
  isLive: boolean;
  asOf: string;
}

export interface HistoryPoint {
  date: string;   // ISO yyyy-mm-dd
  value: number;
}

export interface PerUnitSeries {
  name: string;
  unit: string;           // "dollars per barrel"
  interval: string;       // "monthly" | "daily"
  points: HistoryPoint[]; // oldest → newest
  source: string;
}

export interface SeriesStats {
  latest: number;
  first: number;
  min: HistoryPoint;
  max: HistoryPoint;
  mean: number;
  median: number;
  stdev: number;
  volatilityPct: number;   // stdev as % of mean
  changePct: number;       // first → latest
  cagrPct: number | null;  // annualised, null if span < 1y
  maxDrawdownPct: number;
  currentDrawdownPct: number;
  spanYears: number;
}

// ── Small localStorage cache (TTL) ────────────────────────────────────────────

interface CacheEntry<T> { at: number; data: T }

function cacheGet<T>(key: string, ttlMs: number): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`alphaos:comm:${key}`);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.at > ttlMs) return null;
    return entry.data;
  } catch { return null; }
}

function cacheSet<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `alphaos:comm:${key}`,
      JSON.stringify({ at: Date.now(), data } satisfies CacheEntry<T>)
    );
  } catch { /* quota — non-fatal */ }
}

const MIN = 60_000;
const TTL_QUOTE   = 2 * MIN;        // live quotes
const TTL_DAILY   = 60 * MIN;       // daily bars
const TTL_MONTHLY = 12 * 60 * MIN;  // per-barrel monthly series

// ── Gold: spot + history (Twelve Data) ────────────────────────────────────────

export async function fetchGoldSpot(): Promise<CommodityQuote | null> {
  const cached = cacheGet<CommodityQuote>("gold-spot", TTL_QUOTE);
  if (cached) return cached;
  if (!TWELVE_KEY) return null;

  try {
    const r = await fetch(
      `https://api.twelvedata.com/quote?symbol=XAU/USD&apikey=${TWELVE_KEY}`
    );
    if (!r.ok) return null;
    const d = await r.json();
    if (d.code || !d.close) return null;

    const quote: CommodityQuote = {
      symbol: "XAU/USD",
      name: "Gold Spot",
      kind: "METAL",
      unit: "per troy ounce",
      price: Number(d.close),
      change: Number(d.change ?? 0),
      changePct: Number(d.percent_change ?? 0),
      open: Number(d.open),
      high: Number(d.high),
      low: Number(d.low),
      prevClose: Number(d.previous_close),
      week52Low: d.fifty_two_week ? Number(d.fifty_two_week.low) : undefined,
      week52High: d.fifty_two_week ? Number(d.fifty_two_week.high) : undefined,
      source: "Twelve Data",
      isLive: Boolean(d.is_market_open),
      asOf: d.datetime ?? new Date().toISOString().slice(0, 10),
    };
    cacheSet("gold-spot", quote);
    return quote;
  } catch { return null; }
}

/** Daily XAU/USD closes, oldest → newest. */
export async function fetchGoldHistory(days = 400): Promise<HistoryPoint[]> {
  const key = `gold-hist-${days}`;
  const cached = cacheGet<HistoryPoint[]>(key, TTL_DAILY);
  if (cached) return cached;
  if (!TWELVE_KEY) return [];

  try {
    const r = await fetch(
      `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=1day&outputsize=${days}&apikey=${TWELVE_KEY}`
    );
    if (!r.ok) return [];
    const d = await r.json();
    if (!Array.isArray(d.values)) return [];

    // Twelve Data returns newest → oldest; flip it.
    const points: HistoryPoint[] = d.values
      .map((v: { datetime: string; close: string }) => ({
        date: v.datetime,
        value: Number(v.close),
      }))
      .filter((p: HistoryPoint) => Number.isFinite(p.value))
      .reverse();

    cacheSet(key, points);
    return points;
  } catch { return []; }
}

/** Full OHLC for gold, so technical indicators can be computed. */
export async function fetchGoldOHLC(days = 400): Promise<
  { closes: number[]; highs: number[]; lows: number[] }
> {
  if (!TWELVE_KEY) return { closes: [], highs: [], lows: [] };
  const key = `gold-ohlc-${days}`;
  const cached = cacheGet<{ closes: number[]; highs: number[]; lows: number[] }>(key, TTL_DAILY);
  if (cached) return cached;

  try {
    const r = await fetch(
      `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=1day&outputsize=${days}&apikey=${TWELVE_KEY}`
    );
    if (!r.ok) return { closes: [], highs: [], lows: [] };
    const d = await r.json();
    if (!Array.isArray(d.values)) return { closes: [], highs: [], lows: [] };

    const rows = [...d.values].reverse() as Array<{ high: string; low: string; close: string }>;
    const out = {
      closes: rows.map((v) => Number(v.close)),
      highs:  rows.map((v) => Number(v.high)),
      lows:   rows.map((v) => Number(v.low)),
    };
    cacheSet(key, out);
    return out;
  } catch { return { closes: [], highs: [], lows: [] }; }
}

// ── Oil: real $/barrel history (Alpha Vantage) ────────────────────────────────

/**
 * Actual dollars-per-barrel, not an ETF proxy.
 * BRENT monthly reaches back to 1987; WTI to 1986.
 */
export async function fetchPerBarrel(
  grade: OilGrade,
  interval: "daily" | "weekly" | "monthly" = "monthly"
): Promise<PerUnitSeries | null> {
  const key = `oil-${grade}-${interval}`;
  const ttl = interval === "monthly" ? TTL_MONTHLY : TTL_DAILY;
  const cached = cacheGet<PerUnitSeries>(key, ttl);
  if (cached) return cached;

  try {
    const r = await fetch(
      `https://www.alphavantage.co/query?function=${grade}&interval=${interval}&apikey=${ALPHA_KEY}`
    );
    if (!r.ok) return null;
    const d = await r.json();
    // Alpha Vantage signals throttling/limits with Note/Information, not HTTP codes.
    if (!Array.isArray(d.data)) return null;

    const points: HistoryPoint[] = d.data
      .map((row: { date: string; value: string }) => ({
        date: row.date,
        value: Number(row.value),
      }))
      .filter((p: HistoryPoint) => Number.isFinite(p.value) && p.value > 0)
      .reverse(); // AV returns newest → oldest

    if (!points.length) return null;

    const series: PerUnitSeries = {
      name: d.name ?? `Crude Oil Prices ${grade}`,
      unit: d.unit ?? "dollars per barrel",
      interval: d.interval ?? interval,
      points,
      source: "Alpha Vantage / EIA",
    };
    cacheSet(key, series);
    return series;
  } catch { return null; }
}

// ── Live proxies & related equities (Finnhub) ─────────────────────────────────

export interface ProxyMeta {
  symbol: string;
  name: string;
  kind: CommodityKind;
  group: "OIL_PROXY" | "GOLD_PROXY" | "OIL_MAJOR" | "GOLD_MINER" | "SERVICES";
  note: string;
}

/** US-listed instruments that track or are driven by oil and gold. */
export const COMMODITY_PROXIES: ProxyMeta[] = [
  // Direct commodity trackers
  { symbol: "USO",  name: "United States Oil Fund",     kind: "ENERGY", group: "OIL_PROXY",  note: "Tracks WTI front-month futures" },
  { symbol: "BNO",  name: "United States Brent Oil Fund",kind: "ENERGY", group: "OIL_PROXY",  note: "Tracks Brent front-month futures" },
  { symbol: "XLE",  name: "Energy Select Sector SPDR",  kind: "ENERGY", group: "OIL_PROXY",  note: "US large-cap energy basket" },
  { symbol: "GLD",  name: "SPDR Gold Shares",           kind: "METAL",  group: "GOLD_PROXY", note: "Largest physically-backed gold ETF" },
  { symbol: "IAU",  name: "iShares Gold Trust",         kind: "METAL",  group: "GOLD_PROXY", note: "Lower-fee physical gold ETF" },
  { symbol: "GDX",  name: "VanEck Gold Miners ETF",     kind: "METAL",  group: "GOLD_PROXY", note: "Leveraged beta to the gold price" },
  // Integrated majors
  { symbol: "XOM",  name: "ExxonMobil",                 kind: "ENERGY", group: "OIL_MAJOR",  note: "US supermajor" },
  { symbol: "CVX",  name: "Chevron",                    kind: "ENERGY", group: "OIL_MAJOR",  note: "US supermajor" },
  { symbol: "SHEL", name: "Shell",                      kind: "ENERGY", group: "OIL_MAJOR",  note: "UK/NL supermajor" },
  { symbol: "BP",   name: "BP",                         kind: "ENERGY", group: "OIL_MAJOR",  note: "UK supermajor" },
  { symbol: "TTE",  name: "TotalEnergies",              kind: "ENERGY", group: "OIL_MAJOR",  note: "French supermajor" },
  { symbol: "COP",  name: "ConocoPhillips",             kind: "ENERGY", group: "OIL_MAJOR",  note: "US independent E&P" },
  { symbol: "OXY",  name: "Occidental Petroleum",       kind: "ENERGY", group: "OIL_MAJOR",  note: "Permian-weighted, Berkshire holding" },
  // Oilfield services
  { symbol: "SLB",  name: "SLB (Schlumberger)",         kind: "ENERGY", group: "SERVICES",   note: "Largest oilfield services firm" },
  { symbol: "HAL",  name: "Halliburton",                kind: "ENERGY", group: "SERVICES",   note: "Pressure pumping / completions" },
  // Gold miners
  { symbol: "NEM",  name: "Newmont",                    kind: "METAL",  group: "GOLD_MINER", note: "World's largest gold producer" },
  { symbol: "GOLD", name: "Barrick Mining",             kind: "METAL",  group: "GOLD_MINER", note: "Major global producer" },
  { symbol: "AEM",  name: "Agnico Eagle Mines",         kind: "METAL",  group: "GOLD_MINER", note: "Canada-weighted producer" },
];

export async function fetchProxyQuote(meta: ProxyMeta): Promise<CommodityQuote | null> {
  if (!FINNHUB_KEY) return null;
  const cached = cacheGet<CommodityQuote>(`proxy-${meta.symbol}`, TTL_QUOTE);
  if (cached) return cached;

  try {
    const r = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${meta.symbol}&token=${FINNHUB_KEY}`
    );
    if (!r.ok) return null;
    const d = await r.json();
    if (typeof d.c !== "number" || d.c === 0) return null;

    const quote: CommodityQuote = {
      symbol: meta.symbol,
      name: meta.name,
      kind: meta.kind,
      unit: "per share",
      price: d.c,
      change: d.d ?? 0,
      changePct: d.dp ?? 0,
      open: d.o,
      high: d.h,
      low: d.l,
      prevClose: d.pc,
      source: "Finnhub",
      isLive: true,
      asOf: d.t ? new Date(d.t * 1000).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10),
    };
    cacheSet(`proxy-${meta.symbol}`, quote);
    return quote;
  } catch { return null; }
}

/** Batch fetch with a small concurrency cap to stay inside Finnhub's rate limit. */
export async function fetchProxyQuotes(
  metas: ProxyMeta[] = COMMODITY_PROXIES
): Promise<Map<string, CommodityQuote>> {
  const out = new Map<string, CommodityQuote>();
  const BATCH = 6;
  for (let i = 0; i < metas.length; i += BATCH) {
    const slice = metas.slice(i, i + BATCH);
    const results = await Promise.allSettled(slice.map(fetchProxyQuote));
    results.forEach((res, j) => {
      if (res.status === "fulfilled" && res.value) out.set(slice[j].symbol, res.value);
    });
  }
  return out;
}

// ── Analysis ──────────────────────────────────────────────────────────────────

export function computeSeriesStats(points: HistoryPoint[]): SeriesStats | null {
  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const latest = values[values.length - 1];
  const first = values[0];

  let min = points[0];
  let max = points[0];
  for (const p of points) {
    if (p.value < min.value) min = p;
    if (p.value > max.value) max = p;
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  const stdev = Math.sqrt(variance);

  // Peak-to-trough drawdown across the whole series
  let peak = values[0];
  let maxDrawdown = 0;
  for (const v of values) {
    if (v > peak) peak = v;
    const dd = (peak - v) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const spanMs = new Date(points[points.length - 1].date).getTime()
               - new Date(points[0].date).getTime();
  const spanYears = spanMs / (365.25 * 24 * 3600 * 1000);
  const cagrPct = spanYears >= 1 && first > 0
    ? ((latest / first) ** (1 / spanYears) - 1) * 100
    : null;

  return {
    latest,
    first,
    min,
    max,
    mean,
    median,
    stdev,
    volatilityPct: mean > 0 ? (stdev / mean) * 100 : 0,
    changePct: first > 0 ? ((latest - first) / first) * 100 : 0,
    cagrPct,
    maxDrawdownPct: maxDrawdown * 100,
    currentDrawdownPct: max.value > 0 ? ((max.value - latest) / max.value) * 100 : 0,
    spanYears,
  };
}

/** Technical read on a close series, reusing the Morning Brain indicator engine. */
export function analyseSeries(
  closes: number[],
  highs?: number[],
  lows?: number[]
): Indicators | null {
  if (closes.length < 30) return null;
  return computeIndicators(closes, highs ?? closes, lows ?? closes);
}

/** Pearson correlation over the overlapping tail of two series. */
export function correlation(a: number[], b: number[]): number | null {
  const n = Math.min(a.length, b.length);
  if (n < 3) return null;
  const x = a.slice(-n);
  const y = b.slice(-n);
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a1 = x[i] - mx;
    const b1 = y[i] - my;
    num += a1 * b1;
    dx += a1 * a1;
    dy += b1 * b1;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? null : num / den;
}

/** Resample a long series down to at most `max` evenly-spaced points, keeping the last. */
export function downsample(points: HistoryPoint[], max = 240): HistoryPoint[] {
  if (points.length <= max) return points;
  const step = points.length / max;
  const out: HistoryPoint[] = [];
  for (let i = 0; i < max; i++) out.push(points[Math.floor(i * step)]);
  if (out[out.length - 1] !== points[points.length - 1]) out.push(points[points.length - 1]);
  return out;
}

/** Plain-language regime label from a stats block. */
export function regimeLabel(stats: SeriesStats): {
  label: string; tone: "bull" | "bear" | "neutral"; detail: string;
} {
  const dd = stats.currentDrawdownPct;
  if (dd < 5) {
    return { label: "AT / NEAR HIGHS", tone: "bull",
      detail: `Within ${dd.toFixed(1)}% of the ${stats.max.date.slice(0, 7)} peak.` };
  }
  if (dd < 20) {
    return { label: "UPTREND — PULLBACK", tone: "bull",
      detail: `${dd.toFixed(1)}% below the peak set ${stats.max.date.slice(0, 7)}.` };
  }
  if (dd < 40) {
    return { label: "CORRECTION", tone: "neutral",
      detail: `${dd.toFixed(1)}% off the high — historically a mid-cycle reset zone.` };
  }
  return { label: "DEEP BEAR", tone: "bear",
    detail: `${dd.toFixed(1)}% below the ${stats.max.date.slice(0, 7)} peak.` };
}

// ─────────────────────────────────────────────────────────────────────────────
// World reference data.
//
// These are curated static figures for context, NOT a live feed — no free API
// publishes them. Each block carries its vintage; treat the numbers as
// approximate round figures for orientation, not for settlement.
// ─────────────────────────────────────────────────────────────────────────────

export interface Benchmark {
  code: string;
  name: string;
  region: string;
  grade: string;
  priced: string;
  role: string;
  tracked: boolean;   // can AlphaOS price it on free tiers?
}

export const OIL_BENCHMARKS: Benchmark[] = [
  { code: "BRENT", name: "Brent Crude", region: "North Sea / global", grade: "Light sweet (~38° API, 0.4% S)",
    priced: "ICE Futures Europe", role: "Prices roughly two-thirds of internationally traded crude", tracked: true },
  { code: "WTI", name: "West Texas Intermediate", region: "US (Cushing, Oklahoma)", grade: "Light sweet (~40° API, 0.24% S)",
    priced: "NYMEX / CME", role: "US benchmark; landlocked delivery point at Cushing", tracked: true },
  { code: "DUBAI", name: "Dubai / Oman", region: "Middle East → Asia", grade: "Medium sour (~31° API, 2% S)",
    priced: "Platts / DME", role: "Benchmark for Gulf crude sold into Asia", tracked: false },
  { code: "OPEC", name: "OPEC Reference Basket", region: "OPEC members", grade: "Weighted blend of member crudes",
    priced: "OPEC Secretariat", role: "Policy reference for OPEC output decisions", tracked: false },
  { code: "URALS", name: "Urals", region: "Russia", grade: "Medium sour (~31° API, 1.3% S)",
    priced: "Argus / Platts", role: "Russian export blend; trades at a policy-driven discount", tracked: false },
  { code: "MURBAN", name: "Murban", region: "UAE (ADNOC)", grade: "Light sour (~40° API, 0.78% S)",
    priced: "ICE Futures Abu Dhabi", role: "UAE flagship export grade — direct AlphaOS/UAE relevance", tracked: false },
];

export interface CountryStat {
  country: string;
  flag: string;
  value: number;
  note?: string;
}

/** Approximate crude + condensate output, million barrels/day. Vintage: 2024–25. */
export const TOP_OIL_PRODUCERS: CountryStat[] = [
  { country: "United States",  flag: "🇺🇸", value: 13.2, note: "Shale-led; Permian dominant" },
  { country: "Saudi Arabia",   flag: "🇸🇦", value: 9.0,  note: "Holds most global spare capacity" },
  { country: "Russia",         flag: "🇷🇺", value: 9.0,  note: "Exports redirected to Asia" },
  { country: "Canada",         flag: "🇨🇦", value: 5.0,  note: "Oil sands; TMX expansion" },
  { country: "Iraq",           flag: "🇮🇶", value: 4.3,  note: "OPEC's second largest" },
  { country: "China",          flag: "🇨🇳", value: 4.2,  note: "Large producer, far larger importer" },
  { country: "Brazil",         flag: "🇧🇷", value: 3.5,  note: "Pre-salt growth engine" },
  { country: "UAE",            flag: "🇦🇪", value: 3.3,  note: "ADNOC; Murban benchmark" },
  { country: "Iran",           flag: "🇮🇷", value: 3.2,  note: "Sanctioned exports" },
  { country: "Kuwait",         flag: "🇰🇼", value: 2.5,  note: "OPEC member" },
];

/** Approximate proven crude reserves, billion barrels. Vintage: 2024. */
export const OIL_RESERVES: CountryStat[] = [
  { country: "Venezuela",    flag: "🇻🇪", value: 303, note: "Mostly heavy Orinoco crude" },
  { country: "Saudi Arabia", flag: "🇸🇦", value: 267, note: "Low lifting cost" },
  { country: "Iran",         flag: "🇮🇷", value: 209 },
  { country: "Canada",       flag: "🇨🇦", value: 163, note: "Oil sands" },
  { country: "Iraq",         flag: "🇮🇶", value: 145 },
  { country: "UAE",          flag: "🇦🇪", value: 113 },
  { country: "Kuwait",       flag: "🇰🇼", value: 102 },
  { country: "Russia",       flag: "🇷🇺", value: 80  },
  { country: "United States",flag: "🇺🇸", value: 74  },
  { country: "Libya",        flag: "🇱🇾", value: 48  },
];

/** Approximate crude imports, million barrels/day. Vintage: 2024. */
export const TOP_OIL_IMPORTERS: CountryStat[] = [
  { country: "China",         flag: "🇨🇳", value: 11.3, note: "Largest importer; demand sets the marginal price" },
  { country: "India",         flag: "🇮🇳", value: 4.9,  note: "Fastest-growing major importer" },
  { country: "United States", flag: "🇺🇸", value: 6.5,  note: "Imports heavy, exports light" },
  { country: "South Korea",   flag: "🇰🇷", value: 2.8 },
  { country: "Japan",         flag: "🇯🇵", value: 2.5 },
  { country: "Germany",       flag: "🇩🇪", value: 1.8 },
];

export const OPEC_PLUS_NOTE =
  "OPEC+ groups the 12 OPEC members with 10 allies including Russia, Kazakhstan and Mexico. " +
  "Together they control roughly 40% of world production and nearly all spare capacity, which " +
  "is why quota announcements move Brent more than most demand data.";

/** Approximate mine production, tonnes/year. Vintage: 2024. */
export const TOP_GOLD_PRODUCERS: CountryStat[] = [
  { country: "China",        flag: "🇨🇳", value: 380, note: "Largest producer and largest consumer" },
  { country: "Russia",       flag: "🇷🇺", value: 310 },
  { country: "Australia",    flag: "🇦🇺", value: 290 },
  { country: "Canada",       flag: "🇨🇦", value: 200 },
  { country: "United States",flag: "🇺🇸", value: 170, note: "Nevada dominant" },
  { country: "Ghana",        flag: "🇬🇭", value: 130, note: "Africa's largest" },
  { country: "Peru",         flag: "🇵🇪", value: 130 },
  { country: "Indonesia",    flag: "🇮🇩", value: 130, note: "Grasberg" },
  { country: "Uzbekistan",   flag: "🇺🇿", value: 110 },
  { country: "Mexico",       flag: "🇲🇽", value: 120 },
];

/** Approximate official gold holdings, tonnes. Vintage: 2024–25. */
export const CENTRAL_BANK_GOLD: CountryStat[] = [
  { country: "United States", flag: "🇺🇸", value: 8133, note: "~70% of FX reserves" },
  { country: "Germany",       flag: "🇩🇪", value: 3352 },
  { country: "Italy",         flag: "🇮🇹", value: 2452 },
  { country: "France",        flag: "🇫🇷", value: 2437 },
  { country: "Russia",        flag: "🇷🇺", value: 2336, note: "Steady accumulation" },
  { country: "China",         flag: "🇨🇳", value: 2280, note: "Reported buying most months" },
  { country: "Switzerland",   flag: "🇨🇭", value: 1040 },
  { country: "India",         flag: "🇮🇳", value: 880,  note: "RBI has been repatriating bullion" },
  { country: "Japan",         flag: "🇯🇵", value: 846  },
  { country: "Turkey",        flag: "🇹🇷", value: 615,  note: "Active buyer during lira stress" },
];

export interface DemandSlice { label: string; pct: number; note: string }

/** Approximate share of annual gold demand. Vintage: 2024. */
export const GOLD_DEMAND: DemandSlice[] = [
  { label: "Jewellery",        pct: 44, note: "India and China dominate; price-sensitive" },
  { label: "Central banks",    pct: 21, note: "Record buying since 2022 — the structural bid" },
  { label: "Bars & coins",     pct: 20, note: "Retail investment, spikes in crises" },
  { label: "ETFs",             pct: 8,  note: "Swing factor; tracks real rates closely" },
  { label: "Technology",       pct: 7,  note: "Electronics, dentistry — steady and small" },
];

export interface DriverNote { driver: string; effect: string; direction: "up" | "down" | "mixed" }

export const OIL_DRIVERS: DriverNote[] = [
  { driver: "OPEC+ quota cuts",        effect: "Removes barrels from a finely balanced market", direction: "up" },
  { driver: "US shale output growth",  effect: "Adds supply quickly when prices clear ~$60/bbl", direction: "down" },
  { driver: "Chinese demand",          effect: "Largest importer — the marginal buyer of seaborne crude", direction: "mixed" },
  { driver: "Middle East conflict",    effect: "Risk premium on Hormuz transit (~20% of seaborne oil)", direction: "up" },
  { driver: "Dollar strength",         effect: "Oil is dollar-priced; a stronger DXY weighs on it", direction: "down" },
  { driver: "Global recession risk",   effect: "Demand destruction hits crude before refined products", direction: "down" },
  { driver: "Strategic reserve policy",effect: "SPR releases cap rallies; refills put a floor under dips", direction: "mixed" },
];

export const GOLD_DRIVERS: DriverNote[] = [
  { driver: "Real interest rates",  effect: "The dominant driver — gold pays no yield, so falling real rates lift it", direction: "mixed" },
  { driver: "Central bank buying",  effect: "Structural, price-insensitive demand since 2022", direction: "up" },
  { driver: "Dollar strength",      effect: "Inverse relationship; a weaker dollar lifts dollar gold", direction: "mixed" },
  { driver: "Geopolitical stress",  effect: "Classic safe-haven bid during conflict and crisis", direction: "up" },
  { driver: "Inflation expectations",effect: "Store-of-value bid when CPI expectations un-anchor", direction: "up" },
  { driver: "ETF flows",            effect: "Amplifies moves in both directions", direction: "mixed" },
  { driver: "Indian festival/wedding demand", effect: "Seasonal Q4 physical demand — direct AlphaOS/India relevance", direction: "up" },
];

export interface ShockEvent { year: string; event: string; move: string; asset: "OIL" | "GOLD" | "BOTH" }

export const PRICE_SHOCKS: ShockEvent[] = [
  { year: "1973", event: "OPEC oil embargo",                    move: "Crude roughly quadrupled", asset: "OIL" },
  { year: "1979", event: "Iranian revolution",                  move: "Second oil shock; gold spiked to its 1980 peak", asset: "BOTH" },
  { year: "1990", event: "Iraq invades Kuwait",                 move: "Brent roughly doubled in months", asset: "OIL" },
  { year: "2008", event: "Global financial crisis",             move: "Crude ~$147 → ~$34; gold rallied as a haven", asset: "BOTH" },
  { year: "2014", event: "OPEC defends market share",           move: "Brent ~$115 → under $30 by early 2016", asset: "OIL" },
  { year: "2020", event: "COVID demand collapse",               move: "WTI front-month settled negative in April 2020", asset: "OIL" },
  { year: "2022", event: "Russia invades Ukraine",              move: "Brent back above $120; central banks accelerate gold buying", asset: "BOTH" },
];
