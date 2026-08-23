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
  /** Buy & hold's drawdown over the same window. Without this the strategy's
   *  drawdown is unreadable — 32% looks bad until you see the benchmark took
   *  60%. Omitting it led to exactly that misreading. */
  buyHoldMaxDdPct: number;
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
  /**
   * Optional. When present the engine ignores entry/exit and rebalances toward
   * this fraction of equity (0..1) each bar.
   *
   * Measured on 10 symbols: binary in/out returned a median 23.3% in
   * 2019-2026 against a 120.1% for the same signal expressed as 100/50/0
   * exposure — the return/drawdown ratio went 1.90 -> 4.27. Being fully out is
   * expensive when the trend is only partially broken.
   */
  targetExposure?: (x: RuleCtx) => number;
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
    id: "trend-ride-slow",
    label: "Trend Ride — slow exit",
    approximates: "us-momentum-sma",
    summary: "Golden-cross entry, but exits on SMA200 rather than SMA50. Fewer whipsaws.",
    notModelled: ["Same fundamentals gaps as Golden Cross Momentum"],
    warmup: 200,
    entry: ({ i, c, ind }) =>
      gt(at(ind.sma50, i), at(ind.sma200, i)) && gt(c[i].close, at(ind.sma50, i)) &&
      !gt(at(ind.sma50, i - 1), at(ind.sma200, i - 1)),
    exit: ({ i, c, ind }) => {
      if (!gt(at(ind.sma50, i), at(ind.sma200, i))) return "Death cross";
      if (!gt(c[i].close, at(ind.sma200, i))) return "Lost SMA200";
      return null;
    },
  },
  {
    id: "scaled-trend",
    label: "Scaled Trend Exposure",
    approximates: "us-momentum-sma",
    summary: "Same trend signal, but sized 100% / 50% / 0% instead of all-or-nothing. Measured as the single largest improvement over binary entry.",
    notModelled: ["Same fundamentals gaps as Golden Cross Momentum"],
    warmup: 200,
    entry: () => false,
    exit: () => null,
    targetExposure: ({ i, c, ind }) => {
      const up = gt(at(ind.sma50, i), at(ind.sma200, i));
      const above50 = gt(c[i].close, at(ind.sma50, i));
      const above200 = gt(c[i].close, at(ind.sma200, i));
      if (up && above50) return 1;
      if (above200) return 0.5;
      return 0;
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
  /** Optional inclusive ISO date window, e.g. the 2006-2010 GFC regime. */
  window?: { from?: string; to?: string },
): BacktestResult | null {
  if (window) {
    candles = candles.filter((c) =>
      (!window.from || c.date >= window.from) && (!window.to || c.date <= window.to));
  }
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

    if (spec.targetExposure) {
      const target = Math.max(0, Math.min(1, spec.targetExposure(ctx)));
      const held = qty * candles[i].close;
      const total = cash + held;
      const diff = total * target - held;
      // 2% band stops the rebalance churning on noise; costs still apply.
      if (Math.abs(diff) > total * 0.02) {
        if (diff > 0) {
          const px = buyFill(candles[i].close);
          const add = diff / px;
          qty += add; cash -= add * px;
          if (entryPrice === 0) { entryPrice = px; entryDate = candles[i].date; entryIdx = i; }
        } else {
          const px = sellFill(candles[i].close);
          const rem = Math.min(qty, -diff / px);
          qty -= rem; cash += rem * px;
          if (qty <= 1e-9 && entryPrice > 0) {
            trades.push({
              entryDate, entryPrice,
              exitDate: candles[i].date, exitPrice: px, qty: rem,
              pnl: rem * (px - entryPrice),
              pnlPct: ((px - entryPrice) / entryPrice) * 100,
              bars: i - entryIdx, exitReason: "Exposure → 0",
            });
            entryPrice = 0;
          }
        }
      }
      if (qty > 0) barsInMarket++;
      equity.push({ date: candles[i].date, value: cash + qty * candles[i].close });
      continue;
    }

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

  // Benchmark drawdown over the identical window.
  let bhPeak = candles[spec.warmup].close, bhDd = 0;
  for (let i = spec.warmup; i < candles.length; i++) {
    const px = candles[i].close;
    if (px > bhPeak) bhPeak = px;
    const dd = (bhPeak - px) / bhPeak;
    if (dd > bhDd) bhDd = dd;
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
      buyHoldMaxDdPct: bhDd * 100,
      sharpe,
      exposurePct: equity.length ? (barsInMarket / equity.length) * 100 : 0,
      avgBarsHeld: trades.length ? trades.reduce((a, t) => a + t.bars, 0) / trades.length : 0,
      years,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO BACKTEST
//
// Measured as a bigger lever than any single-symbol rule change: ten symbols
// equal-weighted and trend-gated returned the SAME 24.8% as equal-weight buy &
// hold through 2006-2010, while cutting max drawdown from 53.1% to 20.6%.
// Diversification plus a trend filter beats a cleverer entry rule.
//
// Each symbol is a sleeve with a 1/N target weight, scaled by that symbol's own
// signal. Rebalancing happens inside a no-trade band and pays costs every time.
// The benchmark is equal-weight buy & hold of the identical basket over the
// identical window, so the comparison is like-for-like.
// ─────────────────────────────────────────────────────────────────────────────

export interface SleeveStat {
  symbol: string;
  /** Net P&L in currency: final holding value + net cash flow. */
  pnl: number;
  /** Share of total portfolio P&L contributed by this sleeve. */
  contributionPct: number;
  exposurePct: number;
  rebalances: number;
}

export interface PortfolioResult {
  equity: EquityPoint[];
  benchmark: EquityPoint[];
  symbols: string[];
  from: string;
  to: string;
  spec: RuleSpec;
  metrics: {
    totalReturnPct: number;
    cagrPct: number | null;
    maxDrawdownPct: number;
    benchmarkReturnPct: number;
    benchmarkMaxDdPct: number;
    sharpe: number | null;
    /** Benchmark Sharpe over the same window. Reporting the strategy's Sharpe
     *  alone is the same omission as reporting its drawdown alone. */
    benchmarkSharpe: number | null;
    rebalances: number;
    avgExposurePct: number;
    years: number;
  };
  sleeves: SleeveStat[];
}

/** Trading days present in every series — a sleeve missing a day must not shift the others. */
function alignDates(series: Record<string, Candle[]>): string[] {
  const lists = Object.values(series).map((c) => new Set(c.map((x) => x.date)));
  if (!lists.length) return [];
  const [first, ...rest] = lists;
  return [...first].filter((d) => rest.every((s) => s.has(d))).sort();
}

export function runPortfolioBacktest(
  series: Record<string, Candle[]>,
  spec: RuleSpec,
  cfg: BacktestConfig = DEFAULT_CONFIG,
  window?: { from?: string; to?: string },
): PortfolioResult | null {
  const symbols = Object.keys(series);
  if (!symbols.length) return null;

  let dates = alignDates(series);
  if (window) {
    dates = dates.filter((d) =>
      (!window.from || d >= window.from) && (!window.to || d <= window.to));
  }
  if (dates.length < spec.warmup + 30) return null;

  // Re-index every symbol onto the shared calendar so indicators line up.
  const byDate: Record<string, Map<string, Candle>> = {};
  for (const s of symbols) byDate[s] = new Map(series[s].map((c) => [c.date, c]));
  const aligned: Record<string, Candle[]> = {};
  for (const s of symbols) aligned[s] = dates.map((d) => byDate[s].get(d)!);

  const ind: Record<string, Indicators> = {};
  for (const s of symbols) ind[s] = buildIndicators(aligned[s]);

  const buyFill  = (p: number) => p * (1 + cfg.slippage + cfg.commission);
  const sellFill = (p: number) => p * (1 - cfg.slippage - cfg.commission);

  let cash = cfg.startEquity;
  const qty: Record<string, number> = {};
  const inPos: Record<string, boolean> = {};
  const entryPx: Record<string, number> = {};
  const barsHeld: Record<string, number> = {};
  // Net cash flow per sleeve: negative when buying, positive when selling.
  // Contribution = final holding value + net cash flow. The previous version
  // took a snapshot of qty*price minus an equal slice, so every flat sleeve
  // reported an identical -1/N and the column was meaningless.
  const sleeveFlow: Record<string, number> = {};
  const sleeveBars: Record<string, number> = {};
  const sleeveRebal: Record<string, number> = {};
  for (const s of symbols) {
    qty[s] = 0; inPos[s] = false; entryPx[s] = 0; barsHeld[s] = 0;
    sleeveFlow[s] = 0; sleeveBars[s] = 0; sleeveRebal[s] = 0;
  }

  const equity: EquityPoint[] = [];
  let rebalances = 0;
  let exposureAcc = 0;

  for (let i = spec.warmup; i < dates.length; i++) {
    const held = symbols.reduce((a, s) => a + qty[s] * aligned[s][i].close, 0);
    const total = cash + held;

    for (const s of symbols) {
      const ctx: RuleCtx = { i, c: aligned[s], ind: ind[s] };
      let target: number;

      if (spec.targetExposure) {
        target = Math.max(0, Math.min(1, spec.targetExposure(ctx)));
      } else {
        // Binary specs: run the same entry/exit state machine per sleeve.
        if (inPos[s]) {
          barsHeld[s]++;
          const chg = ((aligned[s][i].close - entryPx[s]) / entryPx[s]) * 100;
          const stopped = spec.stopLossPct != null && chg <= -spec.stopLossPct;
          const took    = spec.takeProfitPct != null && chg >= spec.takeProfitPct;
          if (stopped || took || spec.exit(ctx, entryPx[s], barsHeld[s])) inPos[s] = false;
        } else if (spec.entry(ctx)) {
          inPos[s] = true; entryPx[s] = aligned[s][i].close; barsHeld[s] = 0;
        }
        target = inPos[s] ? 1 : 0;
      }

      const want = (total / symbols.length) * target;
      const cur  = qty[s] * aligned[s][i].close;
      const diff = want - cur;

      // Band is on total equity, so a 1% wobble in one sleeve does not churn.
      if (Math.abs(diff) > total * 0.01) {
        rebalances++; sleeveRebal[s]++;
        if (diff > 0) {
          const px = buyFill(aligned[s][i].close);
          const add = diff / px;
          qty[s] += add; cash -= add * px; sleeveFlow[s] -= add * px;
        } else {
          const px = sellFill(aligned[s][i].close);
          const rem = Math.min(qty[s], -diff / px);
          qty[s] -= rem; cash += rem * px; sleeveFlow[s] += rem * px;
        }
      }
      if (qty[s] > 0) sleeveBars[s]++;
    }

    const nowHeld = symbols.reduce((a, s) => a + qty[s] * aligned[s][i].close, 0);
    exposureAcc += total > 0 ? nowHeld / total : 0;
    equity.push({ date: dates[i], value: cash + nowHeld });
  }

  const sleevePnl: Record<string, number> = {};
  for (const s of symbols) {
    sleevePnl[s] = qty[s] * aligned[s][dates.length - 1].close + sleeveFlow[s];
  }
  const totalAbsPnl = Object.values(sleevePnl).reduce((a, b) => a + Math.abs(b), 0) || 1;

  // Benchmark: equal-weight buy & hold, bought once at the warmup bar.
  const benchQty: Record<string, number> = {};
  for (const s of symbols) {
    benchQty[s] = (cfg.startEquity / symbols.length) / buyFill(aligned[s][spec.warmup].close);
  }
  const benchmark: EquityPoint[] = [];
  for (let i = spec.warmup; i < dates.length; i++) {
    benchmark.push({
      date: dates[i],
      value: symbols.reduce((a, s) => a + benchQty[s] * aligned[s][i].close, 0),
    });
  }

  const dd = (pts: EquityPoint[]) => {
    let peak = pts[0]?.value ?? 0, m = 0;
    for (const p of pts) { if (p.value > peak) peak = p.value; const d = (peak - p.value) / peak; if (d > m) m = d; }
    return m * 100;
  };

  const end = equity[equity.length - 1].value;
  const benchEnd = benchmark[benchmark.length - 1].value;
  const years = (new Date(dates[dates.length - 1]).getTime() - new Date(dates[spec.warmup]).getTime()) / (365.25 * 864e5);

  const rets: number[] = [];
  for (let i = 1; i < equity.length; i++) {
    const prev = equity[i - 1].value;
    if (prev > 0) rets.push((equity[i].value - prev) / prev);
  }
  const mean = rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;
  const sd = rets.length > 1 ? Math.sqrt(rets.reduce((a, r) => a + (r - mean) ** 2, 0) / (rets.length - 1)) : 0;

  const bRets: number[] = [];
  for (let i = 1; i < benchmark.length; i++) {
    const prev = benchmark[i - 1].value;
    if (prev > 0) bRets.push((benchmark[i].value - prev) / prev);
  }
  const bMean = bRets.length ? bRets.reduce((a, b) => a + b, 0) / bRets.length : 0;
  const bSd = bRets.length > 1
    ? Math.sqrt(bRets.reduce((a, r) => a + (r - bMean) ** 2, 0) / (bRets.length - 1)) : 0;

  return {
    equity, benchmark, symbols, spec,
    from: dates[spec.warmup], to: dates[dates.length - 1],
    metrics: {
      totalReturnPct: ((end - cfg.startEquity) / cfg.startEquity) * 100,
      cagrPct: years >= 1 ? ((end / cfg.startEquity) ** (1 / years) - 1) * 100 : null,
      maxDrawdownPct: dd(equity),
      benchmarkReturnPct: ((benchEnd - cfg.startEquity) / cfg.startEquity) * 100,
      benchmarkMaxDdPct: dd(benchmark),
      sharpe: sd > 0 ? (mean / sd) * Math.sqrt(252) : null,
      benchmarkSharpe: bSd > 0 ? (bMean / bSd) * Math.sqrt(252) : null,
      rebalances,
      avgExposurePct: equity.length ? (exposureAcc / equity.length) * 100 : 0,
      years,
    },
    sleeves: symbols.map((s) => ({
      symbol: s,
      contributionPct: (sleevePnl[s] / totalAbsPnl) * 100,
      pnl: sleevePnl[s],
      exposurePct: equity.length ? (sleeveBars[s] / equity.length) * 100 : 0,
      rebalances: sleeveRebal[s],
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WALK-FORWARD RESULT
//
// Recorded because it is the only test here that was not tuned on its own data,
// and it overturned the in-sample conclusion.
//
// Protocol: rank five portfolio variants on 2006-2015 by Sharpe, then run the
// winner ONCE on 2016-2026 and accept the result. 10 US symbols, equal-weight,
// each sleeve trend-gated, costs 5bps per side.
//
//   In-sample winner : slowexit, Sharpe 0.87 vs buy & hold 0.60  (+0.27 edge)
//   Out-of-sample    : Sharpe 1.07 vs buy & hold 1.17            (-0.10 edge)
//
// The edge did not survive. Across all five variants the correlation between
// in-sample and out-of-sample edge was +0.19 — in-sample ranking carried almost
// no information about out-of-sample ranking.
//
// What DID generalise, without exception: drawdown reduction. Every variant
// roughly halved it out-of-sample (4.6%-23.7% against buy & hold's 50.0%).
//
// REPLICATED ON CRYPTO. Same protocol, 7 pairs, tuned 2018-2022 (a full cycle
// including two crashes), tested once on 2023-2026:
//   In-sample winner : scaled, Sharpe 1.19 vs buy & hold 1.10  (+0.09 edge)
//   Out-of-sample    : Sharpe 0.51 vs buy & hold 0.71          (-0.21 edge)
// Zero of five variants held a positive out-of-sample edge, versus two of five
// on equities. Drawdown reduction held again: 16.0%-36.4% against 53.1%.
//
//   asset class   in-sample edge   out-of-sample edge   drawdown saved
//   equities            +0.27            -0.10              38.4pp
//   crypto              +0.09            -0.21              16.7pp
//
// Two independent asset classes, different decades, different volatility
// regimes, same outcome: the return edge is an artifact of the tuning window,
// the drawdown reduction is real.
//
// Conclusion: these rules are a risk-management tool, not an alpha source.
// Any single-window backtest suggesting otherwise — including the ones this
// page renders — should be read as an artifact of that window.
// ─────────────────────────────────────────────────────────────────────────────
export const WALK_FORWARD = {
  equities: {
    universe: "10 US equities",
    tunedOn: "2006–2015", testedOn: "2016–2026",
    chosenVariant: "slowexit",
    inSampleEdge: 0.27, outOfSampleEdge: -0.10,
    outOfSampleSharpe: 1.07, outOfSampleBenchmarkSharpe: 1.17,
    outOfSampleMaxDdPct: 11.7, outOfSampleBenchmarkMaxDdPct: 50.0,
    variantsWithPositiveOosEdge: 2,
  },
  crypto: {
    universe: "7 crypto pairs",
    tunedOn: "2018–2022", testedOn: "2023–2026",
    chosenVariant: "scaled",
    inSampleEdge: 0.09, outOfSampleEdge: -0.21,
    outOfSampleSharpe: 0.51, outOfSampleBenchmarkSharpe: 0.71,
    outOfSampleMaxDdPct: 36.4, outOfSampleBenchmarkMaxDdPct: 53.1,
    variantsWithPositiveOosEdge: 0,
  },
  variantsTested: 5,
  // Correlation between in-sample and out-of-sample edge. Two different numbers,
  // both real — always state which population a quoted figure comes from.
  edgeCorrelationEquities: 0.19, // 5 equity variants only
  edgeCorrelationAll: 0.26, // all 10 runs, equities + crypto
} as const;
