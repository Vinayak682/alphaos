/**
 * AlphaOS — Technical Indicators
 * Pure functions operating on close price arrays (oldest → newest).
 */

export interface Indicators {
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHist: number | null;
  ema9: number | null;
  ema21: number | null;
  ema50: number | null;
  ema200: number | null;
  atr: number | null;
  currentClose: number;
  priceChange1d: number;   // % change last 1 day
  priceChange5d: number;   // % change last 5 days
  priceChange20d: number;  // % change last 20 days
  aboveEma50: boolean;
  aboveEma200: boolean;
  trend: "BULLISH" | "BEARISH" | "NEUTRAL";
}

function ema(prices: number[], period: number): number[] {
  if (prices.length < period) return [];
  const k = 2 / (period + 1);
  const result: number[] = [];
  let val = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(val);
  for (let i = period; i < prices.length; i++) {
    val = prices[i] * k + val * (1 - k);
    result.push(val);
  }
  return result;
}

function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }
  // Wilder smoothing
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b) / period;
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return parseFloat((100 - 100 / (1 + rs)).toFixed(2));
}

function macd(closes: number[]): { macd: number; signal: number; hist: number } | null {
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  if (!ema12.length || !ema26.length) return null;

  // Align: ema26 starts later — offset = 26-12 = 14 in the ema12 array
  const offset = 26 - 12;
  const macdLine: number[] = [];
  for (let i = 0; i < ema26.length; i++) {
    macdLine.push(ema12[i + offset] - ema26[i]);
  }
  const signalLine = ema(macdLine, 9);
  if (!signalLine.length) return null;

  const last = signalLine.length - 1;
  const macdVal = macdLine[macdLine.length - 1];
  const sigVal = signalLine[last];
  return {
    macd: parseFloat(macdVal.toFixed(4)),
    signal: parseFloat(sigVal.toFixed(4)),
    hist: parseFloat((macdVal - sigVal).toFixed(4)),
  };
}

function atr(highs: number[], lows: number[], closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  const trs: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    trs.push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    ));
  }
  const avgTr = trs.slice(-period).reduce((a, b) => a + b) / period;
  return parseFloat(avgTr.toFixed(4));
}

export function computeIndicators(
  closes: number[],
  highs: number[],
  lows: number[]
): Indicators {
  const cur = closes[closes.length - 1];
  const prev1 = closes[closes.length - 2] ?? cur;
  const prev5 = closes[closes.length - 6] ?? cur;
  const prev20 = closes[closes.length - 21] ?? cur;

  const ema9val  = ema(closes, 9);
  const ema21val = ema(closes, 21);
  const ema50val = ema(closes, 50);
  const ema200val= ema(closes, 200);
  const macdRes  = macd(closes);
  const rsiVal   = rsi(closes);
  const atrVal   = atr(highs, lows, closes);

  const e50  = ema50val[ema50val.length - 1] ?? null;
  const e200 = ema200val[ema200val.length - 1] ?? null;
  const e9   = ema9val[ema9val.length - 1] ?? null;
  const e21  = ema21val[ema21val.length - 1] ?? null;

  const aboveEma50  = e50  != null && cur > e50;
  const aboveEma200 = e200 != null && cur > e200;

  let trend: Indicators["trend"] = "NEUTRAL";
  if (aboveEma50 && aboveEma200 && (rsiVal ?? 50) > 50) trend = "BULLISH";
  else if (!aboveEma50 && !aboveEma200 && (rsiVal ?? 50) < 50) trend = "BEARISH";

  return {
    rsi: rsiVal,
    macd: macdRes?.macd ?? null,
    macdSignal: macdRes?.signal ?? null,
    macdHist: macdRes?.hist ?? null,
    ema9: e9 ? parseFloat(e9.toFixed(4)) : null,
    ema21: e21 ? parseFloat(e21.toFixed(4)) : null,
    ema50: e50 ? parseFloat(e50.toFixed(4)) : null,
    ema200: e200 ? parseFloat(e200.toFixed(4)) : null,
    atr: atrVal,
    currentClose: cur,
    priceChange1d: parseFloat(((cur - prev1) / prev1 * 100).toFixed(2)),
    priceChange5d: parseFloat(((cur - prev5) / prev5 * 100).toFixed(2)),
    priceChange20d: parseFloat(((cur - prev20) / prev20 * 100).toFixed(2)),
    aboveEma50,
    aboveEma200,
    trend,
  };
}
