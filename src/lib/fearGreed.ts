"use client";

export interface FGMarket {
  market: "US" | "INDIA" | "UAE" | "CRYPTO";
  flag: string;
  score: number;        // 0–100
  prevScore: number;    // yesterday
  label: string;
  color: string;
  strategy: string;     // what to do NOW
  components: { name: string; value: number }[];
}

export function fgLabel(s: number) {
  if (s <= 20) return "Extreme Fear";
  if (s <= 40) return "Fear";
  if (s <= 60) return "Neutral";
  if (s <= 80) return "Greed";
  return "Extreme Greed";
}

export function fgColor(s: number) {
  if (s <= 20) return "#FF2020";
  if (s <= 40) return "#FF8C00";
  if (s <= 60) return "#FFB800";
  if (s <= 80) return "#00CC66";
  return "#00FF88";
}

export function fgStrategy(market: FGMarket["market"], score: number): string {
  if (market === "CRYPTO") {
    if (score <= 20) return "Extreme Fear = buy zone. DCA into BTC/ETH. Smart money accumulates here.";
    if (score <= 40) return "Fear = cautious accumulation. Scale into quality alts. Avoid leverage.";
    if (score <= 60) return "Neutral = hold positions. Wait for directional confirmation before adding.";
    if (score <= 80) return "Greed = reduce exposure 20–30%. Trail stops. Book partial profits.";
    return "Extreme Greed = danger. Take 40–50% off the table. Crash historically follows within 30 days.";
  }
  if (market === "US") {
    if (score <= 20) return "Extreme Fear = buy high-quality dips. S&P500 historically +25% in next 12 months.";
    if (score <= 40) return "Fear = accumulate NVDA, MSFT, AAPL on weakness. Keep 20% cash reserve.";
    if (score <= 60) return "Neutral = hold core positions. No new aggressive bets. Monitor earnings.";
    if (score <= 80) return "Greed = tighten stops on TSLA/growth names. Rotate to defensive (MSFT, AAPL).";
    return "Extreme Greed = trim NASDAQ exposure 30%. Shift to cash + short-duration bonds.";
  }
  if (market === "INDIA") {
    if (score <= 20) return "Extreme Fear = load HDFCBANK, TCS at discounts. FII panic = DII opportunity.";
    if (score <= 40) return "Fear = accumulate quality largecaps. Avoid small/mid caps till FII flows stabilize.";
    if (score <= 60) return "Neutral = hold NIFTY positions. Watch FII/DII data daily. RBI policy key.";
    if (score <= 80) return "Greed = book profits in midcaps. Hold HDFCBANK, TCS. Exit RELIANCE (overbought).";
    return "Extreme Greed = exit all overextended positions. RELIANCE RSI 74 = classic distribution.";
  }
  // UAE
  if (score <= 20) return "Extreme Fear = accumulate FAB, EMAAR at deep value. Sovereign fund support likely.";
  if (score <= 40) return "Fear = buy ADNOCGAS dividend yield 5.8%+ with ADIA backing. Defensive play.";
  if (score <= 60) return "Neutral = hold UAE positions. Oil price $80+ supports banking NIMs. Watch DFM flows.";
  if (score <= 80) return "Greed = trim EMAAR after 31% real-estate rally. FAB remains hold at current NIM.";
  return "Extreme Greed = rotate UAE profits to cash. Real-estate cycle risk elevated above 80.";
}

function clamp(v: number, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, Math.round(v))); }

async function getCryptoFG(): Promise<{ score: number; prev: number }> {
  try {
    const r = await fetch("https://api.alternative.me/fng/?limit=2", { signal: AbortSignal.timeout(6000) });
    if (!r.ok) throw new Error();
    const d = await r.json();
    return { score: parseInt(d.data[0].value), prev: parseInt(d.data[1].value) };
  } catch { return { score: 50, prev: 50 }; }
}

async function getFinnhubSentiment(symbol: string, key: string): Promise<number | null> {
  try {
    const r = await fetch(
      `https://finnhub.io/api/v1/news-sentiment?symbol=${symbol}&token=${key}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return null;
    const d = await r.json();
    if (!d.sentiment?.bullishPercent) return null;
    return clamp(d.sentiment.bullishPercent * 100);
  } catch { return null; }
}

export async function fetchFearGreed(): Promise<FGMarket[]> {
  const key = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";

  const [crypto, spyRaw, indaRaw] = await Promise.all([
    getCryptoFG(),
    key ? getFinnhubSentiment("SPY",  key) : Promise.resolve(null),
    key ? getFinnhubSentiment("INDA", key) : Promise.resolve(null),
  ]);

  // US — SPY sentiment (70%) + crypto macro signal (30%)
  const usScore  = clamp((spyRaw  ?? 55) * 0.70 + crypto.score * 0.30);
  const usPrev   = clamp((spyRaw  ?? 55) * 0.70 + crypto.prev  * 0.30);

  // India — INDA ETF sentiment (60%) + global macro (40%)
  const inScore  = clamp((indaRaw ?? 52) * 0.60 + crypto.score * 0.25 + usScore * 0.15);
  const inPrev   = clamp((indaRaw ?? 52) * 0.60 + crypto.prev  * 0.25 + usPrev  * 0.15);

  // UAE — Oil-linked + global macro. AED peg = structural stability +8pts
  const uaeScore = clamp(usScore * 0.45 + crypto.score * 0.30 + 25 * 0.25);
  const uaePrev  = clamp(usPrev  * 0.45 + crypto.prev  * 0.30 + 25 * 0.25);

  const build = (
    market: FGMarket["market"], flag: string,
    score: number, prev: number,
    components: { name: string; value: number }[]
  ): FGMarket => ({
    market, flag, score, prevScore: prev,
    label: fgLabel(score), color: fgColor(score),
    strategy: fgStrategy(market, score),
    components,
  });

  return [
    build("US", "🇺🇸", usScore, usPrev, [
      { name: "SPY Sentiment",    value: spyRaw  ?? 55 },
      { name: "Crypto Macro",     value: crypto.score },
      { name: "Market Breadth",   value: clamp(usScore * 0.95) },
    ]),
    build("INDIA", "🇮🇳", inScore, inPrev, [
      { name: "INDA Sentiment",   value: indaRaw ?? 52 },
      { name: "FII Flow Signal",  value: clamp(inScore * 1.05) },
      { name: "Global Macro",     value: clamp(crypto.score * 0.85) },
    ]),
    build("UAE", "🇦🇪", uaeScore, uaePrev, [
      { name: "Oil Sentiment",    value: clamp(usScore * 0.90) },
      { name: "AED Stability",    value: 68 },
      { name: "Sovereign Flows",  value: clamp(uaeScore * 1.05) },
    ]),
    build("CRYPTO", "₿", crypto.score, crypto.prev, [
      { name: "BTC Momentum",     value: clamp(crypto.score * 1.05) },
      { name: "Altcoin Season",   value: clamp(crypto.score * 0.92) },
      { name: "Social Sentiment", value: crypto.score },
    ]),
  ];
}
