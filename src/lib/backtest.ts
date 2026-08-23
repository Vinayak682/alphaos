/**
 * AlphaOS — Backtesting engine.
 *
 * Runs entirely client-side on CORS-enabled feeds (Twelve Data for equities,
 * Binance for crypto), so unlike Morning Brain it survives the static export.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT THIS CAN AND CANNOT TEST
 *
 * The strategies in src/lib/strategies.ts are written as prose for humans. Many
 * of their conditions cannot be evaluated from OHLCV at all — "EPS growth >= 25%
 * YoY", "RS Rating >= 85 vs S&P 500", "mutual fund accumulation weeks",
 * "promoter sell flag". No free data source provides them.
 *
 * So each spec below is an explicit, executable APPROXIMATION of one library
 * strategy, using only what price and volume can express. Every spec carries a
 * `notModelled` list naming the conditions it drops. The UI shows that list.
 * Reporting these results as if they backtested the full published rules would
 * overstate them badly — a fundamentals-gated momentum strategy is not the same
 * strategy once you remove the fundamentals gate.
 *
 * Costs are charged on both sides; a zero-cost backtest flatters every result,
 * and short-holding-period strategies most of all.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface Candle {
  date: string;
  open: number; high: number; low: number; close: number; volume: number;
}

export interface Trade {
  entryDate: string; entryPrice: number;
  exitDate: string;  exitPrice: number;
  qty: number;
  pnl: number; pnlPct: number;
  bars: number;
  exitReason: string;
}

export interface EquityPoint { date: string; value: number }

export interface Metrics {
  startEquity: number;
  endEquity: number;
  totalReturnPct: number;
  cagrPct: number | null;
  buyHoldReturnPct: number;
  tradeCount: number;
  winRate: number;
  profitFactor: number | null;
  avgWinPct: number;
  avgLossPct: number;
  maxDrawdownPct: number;
  sharpe: number | null;
  exposurePct: number;      // % of bars holding a position
  avgBarsHeld: number;
  years: number;
}

export interface BacktestResult {
  trades: Trade[];
  equity: EquityPoint[];
  metrics: Metrics;
  spec: RuleSpec;
  symbol: string;
  from: string;
  to: string;
}

export interface BacktestConfig {
  startEquity: number;
  /** Fraction of equity committed per trade. */
  positionPct: number;
  /** Commission per side, as a fraction (0.0005 = 5bps). */
  commission: number;
  /** Slippage per side, as a fraction. */
  slippage: number;
}

export const DEFAULT_CONFIG: BacktestConfig = {
  startEquity: 10_000,
  positionPct: 1,
  commission: 0.0005,
  slippage: 0.0005,
};

// ── Rolling indicator series ─────────────────────────────────────────────────
// technicals.ts returns only the latest value; a backtest needs the whole
// series, aligned index-for-index with the candles (null before warm-up).

export function smaSeries(v: number[], p: number): (number | null)[] {
  const out: (number | null)[] = new Array(v.length).fill(null);
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += v[i];
    if (i >= p) sum -= v[i - p];
    if (i >= p - 1) out[i] = sum / p;
  }
  return out;
}

export function emaSeries(v: number[], p: number): (number | null)[] {
  const out: (number | null)[] = new Array(v.length).fill(null);
  if (v.length < p) return out;
  const k = 2 / (p + 1);
  let prev = v.slice(0, p).reduce((a, b) => a + b, 0) / p;
  out[p - 1] = prev;
  for (let i = p; i < v.length; i++) {
    prev = v[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

export function rsiSeries(v: number[], p = 14): (number | null)[] {
  const out: (number | null)[] = new Array(v.length).fill(null);
  if (v.length <= p) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= p; i++) {
    const d = v[i] - v[i - 1];
    if (d > 0) gain += d; else loss -= d;
  }
  let ag = gain / p, al = loss / p;
  out[p] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  for (let i = p + 1; i < v.length; i++) {
    const d = v[i] - v[i - 1];
    ag = (ag * (p - 1) + (d > 0 ? d : 0)) / p;
    al = (al * (p - 1) + (d < 0 ? -d : 0)) / p;
    out[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return out;
}

export function atrSeries(c: Candle[], p = 14): (number | null)[] {
  const out: (number | null)[] = new Array(c.length).fill(null);
  const tr: number[] = [0];
  for (let i = 1; i < c.length; i++) {
    tr.push(Math.max(
      c[i].high - c[i].low,
      Math.abs(c[i].high - c[i - 1].close),
      Math.abs(c[i].low - c[i - 1].close),
    ));
  }
  let sum = 0;
  for (let i = 1; i < c.length; i++) {
    sum += tr[i];
    if (i > p) sum -= tr[i - p];
    if (i >= p) out[i] = sum / p;
  }
  return out;
}

export interface Indicators {
  sma20: (number | null)[]; sma50: (number | null)[]; sma150: (number | null)[]; sma200: (number | null)[];
  ema12: (number | null)[]; ema26: (number | null)[];
  rsi14: (number | null)[];
  atr14: (number | null)[];
  volAvg50: (number | null)[];
  macd: (number | null)[];
  macdSignal: (number | null)[];
}

export function buildIndicators(candles: Candle[]): Indicators {
  const close = candles.map((c) => c.close);
  const vol   = candles.map((c) => c.volume);
  const ema12 = emaSeries(close, 12);
  const ema26 = emaSeries(close, 26);
  const macd  = close.map((_, i) =>
    ema12[i] != null && ema26[i] != null ? (ema12[i] as number) - (ema26[i] as number) : null);
  const macdVals = macd.map((m) => m ?? 0);
  const sigRaw = emaSeries(macdVals, 9);
  const macdSignal = macd.map((m, i) => (m == null ? null : sigRaw[i]));

  return {
    sma20: smaSeries(close, 20),
    sma50: smaSeries(close, 50),
    sma150: smaSeries(close, 150),
    sma200: smaSeries(close, 200),
    ema12, ema26,
    rsi14: rsiSeries(close, 14),
    atr14: atrSeries(candles, 14),
    volAvg50: smaSeries(vol, 50),
    macd, macdSignal,
  };
}

// ── Executable rule specs ────────────────────────────────────────────────────

export interface RuleCtx {
  i: number;
  c: Candle[];
  ind: Indicators;
}

export interface RuleSpec {
  id: string;
  label: string;
  /** id in src/lib/strategies.ts that this approximates. */
  approximates: string;
  summary: string;
  /** Conditions from the published rules that price data cannot express. */
  notModelled: string[];
  entry: (x: RuleCtx) => boolean;
  exit: (x: RuleCtx, entryPrice: number, barsHeld: number) => string | null;
  stopLossPct?: number;
  takeProfitPct?: number;
  warmup: number;
}

const at = (s: (number | null)[], i: number) => s[i];
const gt = (a: number | null | undefined, b: number | null | undefined) =>
  a != null && b != null && a > b;

export const RULE_SPECS: RuleSpec[] = [
  {
    id: "golden-cross",
    label: "Golden Cross Momentum",
    approximates: "us-momentum-sma",
    summary: "Long while SMA50 > SMA200 and price holds above SMA50. Exit on death cross or an 8% stop.",
    notModelled: [
      "EPS growth ≥ 25% YoY (no free fundamentals feed)",
      "RS Rating ≥ 85 vs S&P 500",
      "VCP base geometry and pivot detection",
      "Mutual fund accumulation weeks",
    ],
    warmup: 200,
    stopLossPct: 8,
    entry: ({ i, c, ind }) =>
      gt(at(ind.sma50, i), at(ind.sma200, i)) &&
      gt(c[i].close, at(ind.sma50, i)) &&
      !gt(at(ind.sma50, i - 1), at(ind.sma200, i - 1)),
    exit: ({ i, c, ind }) => {
      if (!gt(at(ind.sma50, i), at(ind.sma200, i))) return "Death cross";
      if (!gt(c[i].close, at(ind.sma50, i))) return "Lost SMA50";
      return null;
    },
  },
  {
    id: "rsi-reversion",
    label: "RSI Mean Reversion",
    approximates: "us-mean-reversion",
    summary: "Buy RSI(14) < 30 while price is above SMA200. Exit at RSI > 55, a 6% stop, or 20 bars.",
    notModelled: ["News-driven dislocation filter", "Sector relative strength screen"],
    warmup: 200,
    stopLossPct: 6,
    entry: ({ i, c, ind }) => {
      const r = at(ind.rsi14, i);
      return r != null && r < 30 && gt(c[i].close, at(ind.sma200, i));
    },
    exit: ({ i, ind }, _e, bars) => {
      const r = at(ind.rsi14, i);
      if (r != null && r > 55) return "RSI recovered";
      if (bars >= 20) return "Time exit (20 bars)";
      return null;
    },
  },
  {
    id: "macd-trend",
    label: "MACD Trend Follow",
    approximates: "crypto-macro-quant",
    summary: "Enter on MACD crossing above signal with price over SMA50. Exit on the reverse cross or a 10% stop.",
    notModelled: ["On-chain flows", "Funding rates and open interest", "Macro liquidity regime"],
    warmup: 60,
    stopLossPct: 10,
    entry: ({ i, c, ind }) =>
      gt(at(ind.macd, i), at(ind.macdSignal, i)) &&
      !gt(at(ind.macd, i - 1), at(ind.macdSignal, i - 1)) &&
      gt(c[i].close, at(ind.sma50, i)),
    exit: ({ i, ind }) =>
      !gt(at(ind.macd, i), at(ind.macdSignal, i)) ? "MACD cross down" : null,
  },
  {
    id: "breakout-volume",
    label: "Volume Breakout",
    approximates: "us-fvg-hunter",
    summary: "Buy a 20-day high on volume ≥ 1.5× the 50-day average. Exit on a 20-day low or a 7% stop.",
    notModelled: ["Fair value gap detection", "Order block / liquidity sweep logic", "Intraday session structure"],
    warmup: 60,
    stopLossPct: 7,
    entry: ({ i, c, ind }) => {
      if (i < 21) return false;
      const hi20 = Math.max(...c.slice(i - 20, i).map((x) => x.close));
      const va = at(ind.volAvg50, i);
      return c[i].close > hi20 && va != null && c[i].volume >= va * 1.5;
    },
    exit: ({ i, c }) => {
      if (i < 21) return null;
      const lo20 = Math.min(...c.slice(i - 20, i).map((x) => x.close));
      return c[i].close < lo20 ? "20-day low" : null;
    },
  },
  {
    id: "trend-ride",
    label: "Long-Term Trend Ride",
    approximates: "uae-value-compounder",
    summary: "Hold while price is above SMA150. Exit when it closes below. No fixed stop — trend-following.",
    notModelled: ["Dividend yield screen", "Payout ratio and balance sheet quality", "Sovereign backing assessment"],
    warmup: 150,
    entry: ({ i, c, ind }) =>
      gt(c[i].close, at(ind.sma150, i)) && !gt(c[i - 1].close, at(ind.sma150, i - 1)),
    exit: ({ i, c, ind }) =>
      !gt(c[i].close, at(ind.sma150, i)) ? "Lost SMA150" : null,
  },
];

// ── Engine ───────────────────────────────────────────────────────────────────

export function runBacktest(
  candles: Candle[],
  spec: RuleSpec,
  symbol: string,
  cfg: BacktestConfig = DEFAULT_CONFIG,
): BacktestResult | null {
  if (candles.length < spec.warmup + 30) return null;

  const ind = buildIndicators(candles);
  const trades: Trade[] = [];
  const equity: EquityPoint[] = [];

  let cash = cfg.startEquity;
  let qty = 0;
  let entryPrice = 0;
  let entryDate = "";
  let entryIdx = 0;
  let barsHeld = 0;
  let barsInMarket = 0;

  const buyFill  = (p: number) => p * (1 + cfg.slippage + cfg.commission);
  const sellFill = (p: number) => p * (1 - cfg.slippage - cfg.commission);

  const closeAt = (i: number, reason: string) => {
    const px = sellFill(candles[i].close);
    const proceeds = qty * px;
    const cost = qty * entryPrice;
    cash += proceeds;
    trades.push({
      entryDate, entryPrice,
      exitDate: candles[i].date, exitPrice: px,
      qty,
      pnl: proceeds - cost,
      pnlPct: ((px - entryPrice) / entryPrice) * 100,
      bars: i - entryIdx,
      exitReason: reason,
    });
    qty = 0; barsHeld = 0;
  };

  for (let i = spec.warmup; i < candles.length; i++) {
    const ctx: RuleCtx = { i, c: candles, ind };

    if (qty > 0) {
      barsHeld++; barsInMarket++;
      const chgPct = ((candles[i].close - entryPrice) / entryPrice) * 100;
      let reason: string | null = null;
      if (spec.stopLossPct != null && chgPct <= -spec.stopLossPct) reason = `Stop −${spec.stopLossPct}%`;
      else if (spec.takeProfitPct != null && chgPct >= spec.takeProfitPct) reason = `Target +${spec.takeProfitPct}%`;
      else reason = spec.exit(ctx, entryPrice, barsHeld);
      if (reason) closeAt(i, reason);
    } else if (spec.entry(ctx)) {
      const px = buyFill(candles[i].close);
      const alloc = cash * cfg.positionPct;
      qty = alloc / px;
      cash -= qty * px;
      entryPrice = px; entryDate = candles[i].date; entryIdx = i; barsHeld = 0;
    }

    // Mark to market every bar — full OHLCV is available here, so unlike the
    // portfolio curve this one is a true daily valuation.
    equity.push({ date: candles[i].date, value: cash + qty * candles[i].close });
  }

  if (qty > 0) closeAt(candles.length - 1, "Open at end");

  // ── Metrics ────────────────────────────────────────────────────────────────
  const endEquity = equity.length ? equity[equity.length - 1].value : cfg.startEquity;
  const totalReturnPct = ((endEquity - cfg.startEquity) / cfg.startEquity) * 100;

  const first = candles[spec.warmup], last = candles[candles.length - 1];
  const years = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (365.25 * 864e5);
  const cagrPct = years >= 1 && cfg.startEquity > 0
    ? ((endEquity / cfg.startEquity) ** (1 / years) - 1) * 100 : null;

  const buyHoldReturnPct = ((sellFill(last.close) - buyFill(first.close)) / buyFill(first.close)) * 100;

  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const grossWin = wins.reduce((a, t) => a + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));

  let peak = equity[0]?.value ?? cfg.startEquity, maxDd = 0;
  for (const p of equity) {
    if (p.value > peak) peak = p.value;
    const dd = (peak - p.value) / peak;
    if (dd > maxDd) maxDd = dd;
  }

  const rets: number[] = [];
  for (let i = 1; i < equity.length; i++) {
    const prev = equity[i - 1].value;
    if (prev > 0) rets.push((equity[i].value - prev) / prev);
  }
  const mean = rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;
  const sd = rets.length > 1
    ? Math.sqrt(rets.reduce((a, r) => a + (r - mean) ** 2, 0) / (rets.length - 1)) : 0;
  const sharpe = sd > 0 ? (mean / sd) * Math.sqrt(252) : null;

  return {
    trades, equity, spec, symbol,
    from: first.date, to: last.date,
    metrics: {
      startEquity: cfg.startEquity,
      endEquity,
      totalReturnPct,
      cagrPct,
      buyHoldReturnPct,
      tradeCount: trades.length,
      winRate: trades.length ? (wins.length / trades.length) * 100 : 0,
      profitFactor: grossLoss > 0 ? grossWin / grossLoss : null,
      avgWinPct: wins.length ? wins.reduce((a, t) => a + t.pnlPct, 0) / wins.length : 0,
      avgLossPct: losses.length ? losses.reduce((a, t) => a + t.pnlPct, 0) / losses.length : 0,
      maxDrawdownPct: maxDd * 100,
      sharpe,
      exposurePct: equity.length ? (barsInMarket / equity.length) * 100 : 0,
      avgBarsHeld: trades.length ? trades.reduce((a, t) => a + t.bars, 0) / trades.length : 0,
      years,
    },
  };
}
