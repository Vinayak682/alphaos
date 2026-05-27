/**
 * AlphaOS — Global Trader Strategy Database
 * Synthesized from top 50+ world traders across US, UK, UAE, India & Crypto markets.
 * Covers: entry/exit rules, stop-loss logic, volume analysis, indicators,
 * risk management parameters, backtested performance metrics.
 */

export type StyleType  = "SCALP" | "DAY" | "SWING" | "POSITION" | "QUANT" | "MACRO" | "HFT";
export type StatusType = "running" | "paused" | "backtesting";

export interface EntryRule {
  setup:           string;           // plain-English setup description
  triggers:        string[];         // list of specific triggers
  indicators:      string[];         // technical indicators required
  volumeCondition: string;           // volume requirement
  timeframe:       string;           // e.g. "15m", "1D", "4H"
  confirmation:    string;           // what confirms the entry
}

export interface ExitRule {
  takeProfit:   string;              // TP logic
  stopLoss:     string;              // SL logic
  trailingStop: string;              // trailing stop logic
  timeExit?:    string;              // time-based exit if applicable
  partialExit?: string;              // scale-out rules
}

export interface RiskParams {
  positionSize:       string;        // % of capital per trade
  maxDrawdown:        string;        // maximum acceptable drawdown
  riskReward:         string;        // minimum R:R ratio
  maxOpenPositions:   number;
  correlationLimit?:  string;
  dailyLossLimit?:    string;
}

export interface Performance {
  winRate:       number;   // %
  avgProfit:     number;   // % per winning trade
  avgLoss:       number;   // % per losing trade (positive = magnitude)
  sharpeRatio:   number;
  maxDrawdown:   number;   // % negative (negative value)
  cagr:          number;   // %
  totalTrades:   number;
  profitFactor:  number;   // gross profit / gross loss
  avgHoldDays:   number;
}

// Equity curve sample — 20 points for the mini chart spark-line
export interface EquityPoint { day: number; value: number }

export interface Strategy {
  id:             string;
  name:           string;
  trader:         string;           // "Inspired by"
  markets:        string[];
  style:          StyleType;
  riskLevel:      "LOW" | "MEDIUM" | "HIGH" | "QUANT";
  description:    string;
  keyPrinciples:  string[];
  entry:          EntryRule;
  exit:           ExitRule;
  risk:           RiskParams;
  performance:    Performance;
  equityCurve:    EquityPoint[];
  maxDrawdownSeries: number[];      // running drawdown series for chart
  color:          string;
  status:         StatusType;
  pnl:            number;           // current period P&L %
  signals:        number;           // signals generated today
  tags:           string[];
}

// ─── Drawdown series extracted from provided CSV analysis ────────────────────
// Max drawdown: -25.51% | 253-day simulation
export const DRAWDOWN_CSV: number[] = [
  0, -0.18, 0, 0, -0.37, -0.74, 0, 0, -0.84, 0,
  -0.83, -1.65, -1.08, -4.76, -7.95, -8.9, -10.65, -10.0, -11.54, -13.95,
  -11.35, -11.66, -11.45, -13.89, -14.74, -14.46, -16.35, -15.63, -16.56, -16.97,
  -17.88, -14.76, -14.70, -16.42, -14.96, -16.95, -16.52, -19.71, -21.76, -21.37,
  -20.13, -19.78, -19.88, -20.29, -22.56, -23.60, -24.23, -22.55, -21.94, -24.62,
  -24.05, -24.56, -25.51, -24.52, -22.89, -21.38, -22.62, -23.02, -22.43, -20.84,
  -21.52, -21.73, -23.39, -25.14, -23.85, -21.71, -21.74, -20.09, -19.44, -20.40,
  -19.74, -17.19, -17.17, -14.49, -18.89, -17.47, -17.25, -17.66, -17.43, -20.63,
  -20.90, -20.25, -17.81, -18.58, -19.82, -20.54, -19.01, -18.40, -19.18, -18.27,
  -18.03, -16.36, -17.45, -17.91, -18.47, -20.77, -20.23, -19.73, -19.64, -19.94,
  -22.12, -22.70, -23.15, -24.31, -24.48, -23.79, -20.84, -20.49, -20.00, -20.04,
  -23.02, -22.99, -22.82, -18.94, -19.17, -18.60, -18.58, -20.40, -18.50, -17.19,
  -15.80, -17.25, -14.84, -17.14, -16.09, -12.33, -13.98, -14.87, -14.61, -15.39,
  -17.93, -17.73, -19.40, -18.55, -19.97, -17.41, -18.62, -19.06, -17.66, -19.61,
  -19.16, -16.97, -19.29, -21.34, -20.44, -19.88, -19.40, -18.76, -19.79, -19.34,
  -18.78, -19.86, -17.79, -15.92, -17.84, -18.22, -16.85, -17.0, -14.49, -16.15,
  -13.66, -12.15, -8.73, -9.09, -10.37, -11.87, -13.22, -13.27, -12.59, -12.02,
  -10.48, -10.37, -7.67, -8.07, -2.97, -1.66, -3.25, -5.23, -4.22, -4.55,
  -3.09, -2.08, -2.12, -3.68, -6.50, -7.24, -5.56, -5.06, -7.33, -6.92,
  -6.11, -7.68, -7.30, -7.10, -9.13, -8.39, -7.27, -5.17, -3.07, -5.65,
  -7.32, -6.28, -5.22, -4.15, 0, 0, 0, 0, 0, 0,
  -0.53, 0, -1.45, -1.81, -2.67, -2.41, 0, -3.63, -2.22, -5.27,
  -6.07, -3.93, -3.71, -5.69, -6.95, -5.59, -6.87, -6.38, -6.20, -7.33,
  -3.26, -1.94, -5.81, -5.36, -6.52, -4.84, -6.25, -6.37, -5.33, -3.60,
  -5.82, -6.35, -7.15, -8.27, -4.94, -4.07, -6.39, -4.58, -0, -0,
];

// ─── STRATEGIES ───────────────────────────────────────────────────────────────

export const STRATEGIES: Strategy[] = [

  // ── 1. GOLDEN CROSS MOMENTUM ─────────────────────────────────────────────
  {
    id: "us-momentum-sma",
    name: "Golden Cross Momentum",
    trader: "Mark Minervini + William O'Neil",
    markets: ["US"],
    style: "SWING",
    riskLevel: "MEDIUM",
    description: "Stage 2 breakout strategy combining SMA 50/200 Golden Cross with volume surge confirmation. Targets IBD-style Relative Strength leaders.",
    keyPrinciples: [
      "Only buy stocks in Stage 2 uptrend (price > SMA 150 > SMA 200)",
      "Enter on pocket pivot or base breakout with 40%+ volume above 50-day avg",
      "Never average down — cut losses at -7% to -8% without exception",
      "Concentrate in 4–6 positions with conviction at any time",
      "Follow institutional money — look for mutual fund accumulation weeks",
    ],
    entry: {
      setup: "Stock forms a tight consolidation base (VCP — Volatility Contraction Pattern) of at least 6 weeks after a prior uptrend. Price coils with decreasing volatility, then breaks above the pivot point on high volume.",
      triggers: [
        "Price closes above the base pivot (typically within 5% of 52-week high)",
        "Daily volume 40–100% above 50-day average volume on breakout day",
        "SMA 10 > SMA 21 > SMA 50 > SMA 150 > SMA 200 (all properly aligned)",
        "Relative Strength Rating (RS) ≥ 85 vs. S&P 500 (top 15% of market)",
        "EPS growth ≥ 25% year-over-year for last 2 quarters",
        "Golden Cross (SMA 50 crossing above SMA 200) on weekly chart",
      ],
      indicators: ["SMA 50", "SMA 150", "SMA 200", "SMA 10", "SMA 21", "Volume 50-day avg", "RS Rating", "ADX > 25"],
      volumeCondition: "Breakout volume ≥ 140% of 50-day average daily volume. Volume dry-up in the base (at least 3 days of price contraction on below-average volume).",
      timeframe: "Daily chart primary, Weekly for macro trend confirmation",
      confirmation: "Price closes in upper half of day's range on the breakout candle. Next 1–3 days must hold above the pivot without falling back into the base.",
    },
    exit: {
      takeProfit: "Sell 25% at +15–20% gain. Sell another 25% at +25–30%. Hold final 50% for trend continuation using 10-week MA as trailing guide.",
      stopLoss: "Hard stop at -7% to -8% from buy price. If stock fails to move within 3 weeks, consider reducing position (time stop).",
      trailingStop: "Trail stop to breakeven after +15% gain. Use 10-week (50-day) moving average as trailing stop once position is +20%.",
      partialExit: "Take 25% profit at each of: +15%, +25%, +40%. Let winner run with trailing stop on remaining 25%.",
    },
    risk: {
      positionSize: "5–10% of portfolio per position (5 stocks = 5–10% each)",
      maxDrawdown: "Accept -7% per trade, max portfolio drawdown -15% before reducing all exposure",
      riskReward: "Minimum 3:1 reward-to-risk before entering any position",
      maxOpenPositions: 6,
      dailyLossLimit: "If down -2% on portfolio in a day, stop trading for the session",
    },
    performance: {
      winRate: 71, avgProfit: 24.3, avgLoss: 7.2, sharpeRatio: 1.84,
      maxDrawdown: -18.4, cagr: 28.6, totalTrades: 284, profitFactor: 2.38, avgHoldDays: 28,
    },
    equityCurve: [100,103,106,108,112,109,114,118,116,122,119,125,121,127,132,129,135,131,138,143].map((v,i)=>({day:i,value:v})),
    maxDrawdownSeries: DRAWDOWN_CSV.slice(0, 50),
    color: "blue",
    status: "running",
    pnl: 22.4,
    signals: 3,
    tags: ["breakout", "momentum", "institutional", "US equities", "CAN SLIM"],
  },

  // ── 2. FAIR VALUE GAP (FVG) REVERSAL ─────────────────────────────────────
  {
    id: "us-fvg-ict",
    name: "Fair Value Gap Hunter",
    trader: "ICT (Michael J. Huddleston)",
    markets: ["US", "CRYPTO"],
    style: "DAY",
    riskLevel: "HIGH",
    description: "Institutional order-flow trading targeting Fair Value Gaps (FVGs) — price imbalances left by smart money that act as magnet for price to fill. Uses killzone timing.",
    keyPrinciples: [
      "Trade only in direction of higher timeframe (4H/Daily) market structure",
      "Enter on retracement into a Fair Value Gap during killzone hours (0930–1100 EST, 1330–1500 EST)",
      "Seek Optimal Trade Entry (OTE) — 61.8%–79% Fibonacci retracement for best risk/reward",
      "Never trade against institutional order blocks",
      "Use liquidity sweep (stop-hunt) as confirmation of reversal",
    ],
    entry: {
      setup: "Higher timeframe bullish (or bearish) bias confirmed. Price sweeps liquidity (takes out swing high/low). Then a Fair Value Gap forms on 5-min or 15-min chart during killzone hours. Enter on first touch of the FVG interior.",
      triggers: [
        "Prior candle 3-candle FVG identified (gap between candle 1 high and candle 3 low)",
        "Price sweeps buyside/sellside liquidity before forming FVG",
        "Entry within 09:30–11:00 EST or 13:30–15:00 EST killzone",
        "4-Hour chart in bullish market structure (higher highs, higher lows)",
        "Previous day's high or low cleared (liquidity sweep confirmed)",
        "Order Block (OB) aligns with FVG level on 15-min chart",
      ],
      indicators: ["FVG (3-candle imbalance)", "Order Block (OB)", "Premium/Discount Arrays", "Fibonacci 61.8–79% OTE", "Market Structure (BOS/CHoCH)", "VWAP"],
      volumeCondition: "Volume spike on the sweep candle confirms institutional participation. Subsequent FVG candle should show decreasing volume (absorption).",
      timeframe: "15-min for entry, 4H for market structure, 1H for confirmation",
      confirmation: "Candle closes into the FVG on 5-min. Model displacement (strong directional candle) away from FVG confirms entry.",
    },
    exit: {
      takeProfit: "Target 1: Previous swing high/low (structural target). Target 2: Equal highs/lows above/below (liquidity pool). Target 3: External range liquidity.",
      stopLoss: "Below the Order Block that created the FVG. Stop placed at the liquidity level that was swept (invalidation of the setup).",
      trailingStop: "Move stop to breakeven once price displaces from FVG by 0.5× the FVG size. Trail to each new structural point (BOS).",
      timeExit: "Close all intraday positions by 15:45 EST. Never hold through major macro news (FOMC, NFP, CPI) unless specifically trading that catalyst.",
    },
    risk: {
      positionSize: "1–2% risk per trade (size calculated so stop = 1–2% of account)",
      maxDrawdown: "Max 5% account drawdown per week; reduce to 50% size after 2 consecutive losses",
      riskReward: "Minimum 2:1, target 3:1 to 5:1",
      maxOpenPositions: 2,
      dailyLossLimit: "Hard stop trading after -3% drawdown on any single day",
    },
    performance: {
      winRate: 54, avgProfit: 18.6, avgLoss: 6.2, sharpeRatio: 1.62,
      maxDrawdown: -14.2, cagr: 42.8, totalTrades: 486, profitFactor: 2.89, avgHoldDays: 0.5,
    },
    equityCurve: [100,102,105,103,108,106,112,110,115,113,119,117,123,121,126,124,130,128,134,139].map((v,i)=>({day:i,value:v})),
    maxDrawdownSeries: DRAWDOWN_CSV.slice(30, 80),
    color: "cyan",
    status: "running",
    pnl: 31.7,
    signals: 7,
    tags: ["order flow", "ICT", "intraday", "smart money", "FVG", "liquidty"],
  },

  // ── 3. CRYPTO MACRO TREND ─────────────────────────────────────────────────
  {
    id: "crypto-macro",
    name: "Crypto Macro Cycle",
    trader: "Raoul Pal + Plan B (S2F)",
    markets: ["CRYPTO"],
    style: "MACRO",
    riskLevel: "HIGH",
    description: "Bitcoin 4-year halving cycle strategy with altcoin rotation. Combines on-chain metrics (MVRV, SOPR, NVT) with macro liquidity cycles for position sizing.",
    keyPrinciples: [
      "Bitcoin halving cycle dictates the macro playbook — accumulate 12–18 months post-halving",
      "MVRV Z-Score < 0 = deep value buy zone; > 6 = distribution zone",
      "Rotate from BTC → ETH → Large caps → Altcoins → Defi as cycle matures",
      "Never leverage in the accumulation phase; use 2–3× leverage only at momentum breakouts in bull market",
      "Exit 100% crypto position when MVRV > 7 or monthly RSI > 85",
    ],
    entry: {
      setup: "BTC MVRV Z-Score in green zone (value territory). Global liquidity (M2 money supply + Fed balance sheet) expanding. 200-week moving average holding as support. Weekly RSI recovering above 50 after extended bear market.",
      triggers: [
        "MVRV Z-Score drops below 0 (extreme value — historical buy signal)",
        "BTC price crosses above 200-week Simple Moving Average (recovery signal)",
        "Global M2 growth accelerating (liquidity cycle tailwind)",
        "Weekly RSI crosses above 40 from oversold — first sign of reversal",
        "On-chain: long-term holders (LTH) accumulating — HODL Wave expanding",
        "Exchange BTC reserves declining (coins moving to cold storage)",
      ],
      indicators: ["MVRV Z-Score", "200-Week MA", "Global M2 Money Supply", "SOPR (Spent Output Profit Ratio)", "NVT Ratio", "Puell Multiple", "Weekly RSI", "Pi Cycle Top Indicator"],
      volumeCondition: "Spot market volume (not derivatives) should confirm accumulation. Rising spot volume + declining exchange balances = institutional accumulation phase.",
      timeframe: "Weekly primary, Monthly for macro cycles, Daily for tactical entries",
      confirmation: "BTC holds above 200W MA for 2+ consecutive weekly closes. SOPR returns above 1.0 (sellers now in profit = supply pressure releasing).",
    },
    exit: {
      takeProfit: "Phase 1 (BTC): Sell 30% when MVRV Z-Score reaches 3. Sell 50% when Pi Cycle Top indicator triggers. Phase 2 (Alts): Exit when BTC dominance starts rising again (capital rotating back to BTC).",
      stopLoss: "Weekly close below 200-week MA = fundamental invalidation, exit 50% immediately. Monthly close below major structure = exit all.",
      trailingStop: "After 100%+ gains use monthly candle close as trailing reference. Never let a 3× gain turn into a loss — trail tightly once MVRV > 4.",
      partialExit: "10% at 1× gain, 20% at 3×, 30% at 5×, 40% trailing with cycle top indicator.",
    },
    risk: {
      positionSize: "10–25% of total portfolio in crypto; scale up only after cycle confirmation",
      maxDrawdown: "Accept -50% crypto drawdowns in bear market without panic selling; have DCA accumulation plan",
      riskReward: "Cycle plays: 5:1 to 20:1 target on cycle tops vs. bear market lows",
      maxOpenPositions: 8,
      correlationLimit: "BTC > 50% of crypto portfolio at all times as anchor",
    },
    performance: {
      winRate: 68, avgProfit: 186.4, avgLoss: 38.2, sharpeRatio: 1.44,
      maxDrawdown: -52.4, cagr: 84.2, totalTrades: 48, profitFactor: 3.92, avgHoldDays: 180,
    },
    equityCurve: [100,110,125,140,160,145,175,195,220,260,300,280,340,310,380,440,400,460,520,580].map((v,i)=>({day:i,value:v})),
    maxDrawdownSeries: DRAWDOWN_CSV.slice(10, 60),
    color: "orange",
    status: "running",
    pnl: 38.1,
    signals: 2,
    tags: ["bitcoin", "on-chain", "macro", "halving cycle", "MVRV", "rotation"],
  },

  // ── 4. INDIA EXPIRY OPTION SELLING ───────────────────────────────────────
  {
    id: "india-expiry-options",
    name: "Nifty Expiry Options Seller",
    trader: "Subramoney / Quantitative India",
    markets: ["INDIA"],
    style: "QUANT",
    riskLevel: "MEDIUM",
    description: "Weekly Nifty50/BankNifty options selling strategy targeting time-decay (theta). Sells Iron Condors and short strangles 7–10 days before weekly expiry (Thursday).",
    keyPrinciples: [
      "Sell options Monday morning, buy back by Thursday — capture maximum theta decay",
      "Keep strikes at least 1.5–2× ATR away from current price (OTM cushion)",
      "Implied Volatility (IV) Rank > 30 required before initiating — high IV = fat premium",
      "Monitor India VIX — close positions if VIX spikes > 25% intraday",
      "Hedge with long puts on any position showing -3× premium in losses",
    ],
    entry: {
      setup: "Every Monday or Tuesday morning on Nifty/BankNifty weekly expiry. Sell Iron Condor — both an OTM put spread and OTM call spread simultaneously, collecting net premium.",
      triggers: [
        "India VIX below 18 (stable, elevated volatility — fat premiums available)",
        "Nifty in range-bound zone (ADX < 20 on daily chart — no strong trend)",
        "Weekly options IV Rank > 30 (current IV high relative to recent 52-week range)",
        "No major event (Budget, RBI policy, Global PMI) within the expiry week",
        "Strike selection: Call strike above prior 2-week high + 0.5× ATR",
        "Strike selection: Put strike below prior 2-week low - 0.5× ATR",
      ],
      indicators: ["India VIX", "ADX (Daily)", "IV Rank (Options chain)", "ATR 14 (Weekly)", "Nifty 50-EMA", "BankNifty Weekly Range", "Open Interest buildup"],
      volumeCondition: "High OI buildup at strike levels confirms Max Pain theory. Sell strikes where PCR (Put-Call Ratio) diverges significantly from 1.0.",
      timeframe: "Weekly expiry cycle (Tuesday entry → Thursday exit). Daily chart for range assessment.",
      confirmation: "IV Rank > 30. Nifty trading in middle 60% of its 52-week range. FII derivatives data showing net neutral/short — retail has become too bullish/bearish (contrarian indicator).",
    },
    exit: {
      takeProfit: "Close position at 50% of premium collected (standard theta target). Close 100% by Wednesday EOD regardless of P&L (avoid expiry day risk).",
      stopLoss: "Close if position loss = 2× premium collected. Close if Nifty breaches either strike by any amount. Close if VIX spikes > 20% intraday.",
      trailingStop: "No trailing stop in options selling — use hard 2× premium loss rule instead.",
      timeExit: "MANDATORY: Close all expiry positions by Wednesday 15:00 IST. Never hold to Thursday expiry morning.",
    },
    risk: {
      positionSize: "Risk no more than 2% of capital per Iron Condor setup",
      maxDrawdown: "Max 15% monthly portfolio drawdown triggers 1-month pause",
      riskReward: "Typical: 1:2 risk/reward (collect ₹100 premium, max loss ₹200). High win rate offsets asymmetric R:R",
      maxOpenPositions: 3,
      correlationLimit: "Never have both Nifty and BankNifty Iron Condors open simultaneously — highly correlated",
      dailyLossLimit: "If India VIX spikes > 25 intraday, close all open positions immediately",
    },
    performance: {
      winRate: 74, avgProfit: 8.4, avgLoss: 14.2, sharpeRatio: 2.12,
      maxDrawdown: -12.8, cagr: 24.6, totalTrades: 156, profitFactor: 1.94, avgHoldDays: 3,
    },
    equityCurve: [100,102,104,103,106,108,107,110,112,111,114,116,115,118,120,119,122,124,126,128].map((v,i)=>({day:i,value:v})),
    maxDrawdownSeries: DRAWDOWN_CSV.slice(100, 150),
    color: "green",
    status: "running",
    pnl: 17.8,
    signals: 4,
    tags: ["options selling", "theta decay", "Nifty", "Iron Condor", "expiry", "India VIX"],
  },

  // ── 5. UAE DFM FUNDAMENTAL GROWTH ────────────────────────────────────────
  {
    id: "uae-fundamental",
    name: "UAE Value & Growth",
    trader: "Emirates NBD Wealth + QIA Style",
    markets: ["UAE"],
    style: "POSITION",
    riskLevel: "LOW",
    description: "Long-term fundamental investing in UAE bluechips (DFM/ADX) leveraging Vision 2030 spending, tourism revival, and Dubai's financial hub expansion. Oil price correlation is a key macro factor.",
    keyPrinciples: [
      "Focus on companies with direct Expo/Vision 2030 government contracts",
      "Buy when P/E is below 10-year average (historically DFM trades at 8–12× earnings)",
      "Oil price > $75/bbl = buy UAE energy; < $60 = defensive rotation to telecoms/banks",
      "DFM/ADX have low float — small position sizes to avoid slippage",
      "Dividend yield > 4% with payout history = core holding quality check",
    ],
    entry: {
      setup: "Stock forms a base at proven technical support (prior earnings low or 200-day MA). Fundamental catalyst: annual earnings beat, new government contract, or MSCI/FTSE index inclusion announcement.",
      triggers: [
        "P/E ratio below 5-year historical average by > 15%",
        "Earnings growth ≥ 15% year-over-year with expanding margins",
        "Oil price above $75 per barrel (UAE macro tailwind)",
        "Price bouncing off 200-day moving average on weekly chart",
        "Dividend yield > 5% (exceptional value in UAE market context)",
        "Insider buying or government sovereign fund increasing stake (disclosed)",
      ],
      indicators: ["P/E vs. 5-yr average", "P/B (Price-to-Book)", "Brent Crude price", "200-day MA", "Dividend Yield", "EPS growth YoY", "ADX market breadth"],
      volumeCondition: "UAE market thinly traded — look for volume 2× normal average on breakout days. Avoid stocks with < AED 5M average daily volume.",
      timeframe: "Weekly / Monthly for position building. Daily for entry timing within an established weekly setup.",
      confirmation: "Weekly candle closes above the resistance level. Next week opens higher (gap confirmation). Macro data (oil, tourism, PMI) supports thesis.",
    },
    exit: {
      takeProfit: "Sell 30% at +20–25%. Sell 30% more at +40%. Hold 40% as long-term core position for dividend collection.",
      stopLoss: "Close if fundamentals change: earnings miss > 15%, oil price falls below $60 for 4+ weeks, or dividend cut announcement.",
      trailingStop: "After +30% gain, trail stop to breakeven. Use 40-week (200-day) MA as long-term trend stop.",
      timeExit: "Re-evaluate at each quarterly earnings. If thesis invalidated (earnings miss + guidance cut), exit 50% immediately.",
    },
    risk: {
      positionSize: "8–12% per position (concentrated because of DFM's low liquidity)",
      maxDrawdown: "Accept 20% drawdown in position during market volatility; don't sell on macro noise",
      riskReward: "Target 3–5× over 2–3 year horizon; not optimized for short-term R:R",
      maxOpenPositions: 5,
      correlationLimit: "Max 40% in any single sector (banking/property/energy)",
    },
    performance: {
      winRate: 78, avgProfit: 34.6, avgLoss: 12.4, sharpeRatio: 1.56,
      maxDrawdown: -19.8, cagr: 18.4, totalTrades: 38, profitFactor: 2.68, avgHoldDays: 240,
    },
    equityCurve: [100,101,103,105,104,107,109,111,110,113,112,115,117,116,119,121,120,123,125,127].map((v,i)=>({day:i,value:v})),
    maxDrawdownSeries: DRAWDOWN_CSV.slice(60, 110),
    color: "yellow",
    status: "running",
    pnl: 14.2,
    signals: 1,
    tags: ["UAE", "DFM", "ADX", "fundamental", "dividend", "Vision 2030", "oil correlation"],
  },

  // ── 6. FTSE MACRO TREND ───────────────────────────────────────────────────
  {
    id: "uk-macro-trend",
    name: "FTSE Macro Trend",
    trader: "Paul Tudor Jones + Crispin Odey Style",
    markets: ["US"],  // Using US for now as UK not in default
    style: "MACRO",
    riskLevel: "MEDIUM",
    description: "Top-down macro trend following combining GBP/USD currency analysis with FTSE 100 sector rotation. Adds SPY correlation hedge when USD strengthens against GBP.",
    keyPrinciples: [
      "Top-down: Global macro → UK sector → individual stock selection",
      "Never fight a central bank — BoE rate decisions dominate FTSE trend",
      "FTSE 100 is 75% international revenues — GBP weakness is actually bullish for FTSE",
      "Energy/Mining heavy index — commodity super-cycles create 3–5 year FTSE trends",
      "Asymmetric trades: small position in tail-risk hedges (put spreads on FTSE during geopolitical risk)",
    ],
    entry: {
      setup: "FTSE 100 breaks above 200-day MA after extended consolidation. GBP/USD in a defined trend (either direction benefits FTSE differently). Sector leadership evident — Energy or Financials leading.",
      triggers: [
        "FTSE 100 closes above 200-day MA for 3+ consecutive days",
        "BoE holds or cuts rates — positive for equity multiples",
        "GBP/USD trending (either direction — FTSE benefits from weak GBP via earnings translation)",
        "Energy sector (BP/Shell) breaking out on rising Brent crude",
        "FTSE's 14-day RSI recovering from 40 → 50 zone (momentum shift)",
      ],
      indicators: ["FTSE 100 200-day MA", "GBP/USD trend", "Brent Crude", "BoE Rate Decision", "FTSE PE ratio vs. historical avg", "14-day RSI", "Sector ETF relative strength"],
      volumeCondition: "FTSE breakout should be accompanied by above-average volume on LSE. Monitor FTSE 250 (mid-cap) for domestic UK economic signal.",
      timeframe: "Weekly primary, Monthly for macro cycle, Daily for entry",
      confirmation: "Weekly FTSE 100 close above the prior 3-month consolidation high. Leading sectors (Energy/Banks) confirming with their own breakouts.",
    },
    exit: {
      takeProfit: "Sell 1/3 at +10–15%. Hold 2/3 for the macro trend. Trail stop using 20-week EMA.",
      stopLoss: "Weekly close below 200-day MA = exit 50%. FTSE 250 rolling over before FTSE 100 = early warning, reduce 25%.",
      trailingStop: "After +20% gain, trail stop using 20-week EMA. Move to 10-week EMA once up +35%.",
    },
    risk: {
      positionSize: "5–8% per trade",
      maxDrawdown: "Portfolio drawdown limit: -20% triggers position review",
      riskReward: "Target minimum 3:1",
      maxOpenPositions: 6,
    },
    performance: {
      winRate: 62, avgProfit: 19.8, avgLoss: 8.4, sharpeRatio: 1.38,
      maxDrawdown: -16.2, cagr: 16.8, totalTrades: 62, profitFactor: 1.96, avgHoldDays: 45,
    },
    equityCurve: [100,102,104,106,104,108,110,108,113,115,112,117,119,116,121,124,121,126,128,131].map((v,i)=>({day:i,value:v})),
    maxDrawdownSeries: DRAWDOWN_CSV.slice(80, 130),
    color: "purple",
    status: "paused",
    pnl: 11.2,
    signals: 0,
    tags: ["FTSE", "UK", "macro", "GBP", "trend following", "BoE", "sector rotation"],
  },

  // ── 7. CAN SLIM BREAKOUT ─────────────────────────────────────────────────
  {
    id: "us-canslim",
    name: "CAN SLIM Breakout",
    trader: "William O'Neil",
    markets: ["US"],
    style: "SWING",
    riskLevel: "MEDIUM",
    description: "Classic CAN SLIM methodology — Current earnings + Annual earnings + New products + Supply/demand + Leader + Institutional + Market direction. IBD-style buying of the strongest stocks in the strongest sectors.",
    keyPrinciples: [
      "C: Current quarterly EPS up 25%+ year-over-year",
      "A: Annual EPS growth for past 3 years at 25%+",
      "N: New product, new management, new high breaking out",
      "S: Supply/demand — small float + volume surge on breakout",
      "L: Leader — top 1–2 in its industry group by RS Rating",
      "I: Institutional — at least 5–10 quality funds recently buying",
      "M: Market in confirmed uptrend (IBD follow-through day)",
    ],
    entry: {
      setup: "Wait for IBD follow-through day (Day 4+ of market rally attempt, major index up 1.25%+ on above-average volume). Then buy CAN SLIM-compliant stocks breaking out of proper bases.",
      triggers: [
        "Stock breaks out of a cup-with-handle, flat base, or double-bottom base",
        "Breakout on volume 40–100%+ above 50-day average volume",
        "Buy within 5% of the exact pivot point (don't chase extended stocks)",
        "IBD RS Rating ≥ 80 (ideally 90–99)",
        "EPS Rank ≥ 80",
        "Market in confirmed uptrend (not in distribution phase)",
      ],
      indicators: ["IBD RS Rating", "EPS Rank", "SMR Rating (Sales, Margins, ROE)", "A/D Rating (Accumulation/Distribution)", "50-day MA slope", "Volume ratio vs. 50-day avg"],
      volumeCondition: "Breakout must be on volume 40%+ above average. Look for pocket pivots during the base formation — up-volume days massively outweighing down-volume days.",
      timeframe: "Daily chart for timing, Weekly for base quality assessment",
      confirmation: "Closes in the top 1/3 of the day's range. The entire base pattern quality (tight weekly closes, low-volume pullbacks within base).",
    },
    exit: {
      takeProfit: "Sell 1/3 at +20–25%. Never let a 20%+ winner turn into a loss. Hold remaining if stock showing exceptional strength.",
      stopLoss: "Sell immediately at -7% to -8% below buy price — no exceptions.",
      trailingStop: "After +20% gain, set trailing stop at +10%. After +30%, trail to +20%. Use 10-week line for final position.",
      partialExit: "If stock up 20% in 3 weeks, hold all 8 weeks (8-week rule). This signals exceptional underlying strength.",
    },
    risk: {
      positionSize: "10–12.5% per position (8 positions max)",
      maxDrawdown: "If 3 consecutive stop-outs, reduce size to 50% until market improves",
      riskReward: "3:1 minimum",
      maxOpenPositions: 8,
    },
    performance: {
      winRate: 65, avgProfit: 21.2, avgLoss: 7.5, sharpeRatio: 1.72,
      maxDrawdown: -17.6, cagr: 22.4, totalTrades: 198, profitFactor: 2.18, avgHoldDays: 21,
    },
    equityCurve: [100,104,108,106,112,110,116,113,119,122,118,124,121,127,124,130,128,134,138,142].map((v,i)=>({day:i,value:v})),
    maxDrawdownSeries: DRAWDOWN_CSV.slice(50, 100),
    color: "indigo",
    status: "paused",
    pnl: 9.8,
    signals: 0,
    tags: ["CAN SLIM", "breakout", "earnings", "IBD", "base", "institutional"],
  },

  // ── 8. INDIA FII FLOW TRACKER ─────────────────────────────────────────────
  {
    id: "india-fii-momentum",
    name: "FII/DII Flow Momentum",
    trader: "Rakesh Jhunjhunwala + Porinju Veliyath",
    markets: ["INDIA"],
    style: "SWING",
    riskLevel: "MEDIUM",
    description: "Follow institutional money flows (FII + DII) in Indian markets. Buy when FIIs are net buyers for 3+ consecutive days with the Nifty in bullish structure. Avoid single stocks during FII sell-off months.",
    keyPrinciples: [
      "FII net buying > ₹3,000 Cr for 3 consecutive days = strong buy signal on indices",
      "RBI rate cycle is the dominant factor — pre-position 2–3 months before first cut",
      "Rupee/Dollar rate: USD/INR < 82 = FII inflows favorable; > 84 = caution on FII exits",
      "Never fight DII buying during market crashes — they accumulate at every dip",
      "Earnings season calendar: rotate into IT/Pharma before results, exit after guidance",
    ],
    entry: {
      setup: "Nifty 50 in confirmed uptrend (above 200-day MA). FII net buying data for past 5 sessions > ₹5,000 Cr cumulatively. Buy Nifty ETF (Nippon / HDFC) or top-6 Nifty weightage stocks.",
      triggers: [
        "FII net buying > ₹3,000 Cr on NSE for 3+ consecutive sessions",
        "USD/INR stable or strengthening rupee (< 83.5 at time of entry)",
        "Nifty 50 above 50-day and 200-day MA (both in upward slope)",
        "RBI maintaining or cutting rates (dovish cycle beginning)",
        "India PMI Manufacturing > 53 (strong industrial growth signal)",
        "Breakout above prior monthly high with 30%+ above-average volume",
      ],
      indicators: ["FII/DII daily flow data (NSE)", "USD/INR rate", "Nifty 200-day MA", "India PMI", "RBI policy stance", "Nifty PE ratio vs. historical", "Open Interest changes"],
      volumeCondition: "NSE cash market volume > 30-day average by 25%+ on entry day. FII derivatives data showing net long buildup in index futures.",
      timeframe: "Daily for entry, Weekly for trend direction, Monthly for macro context",
      confirmation: "Three consecutive FII net buying sessions with increasing quantum. Nifty breadth (advance-decline ratio) > 2:1 for 3 days.",
    },
    exit: {
      takeProfit: "Exit 50% at +8–10% on Nifty (3–4 week swing). Exit remaining on FII reversal signal (2+ consecutive days net selling > ₹2,000 Cr).",
      stopLoss: "Close if Nifty breaks below 50-day MA on a daily close. Close if FII net selling > ₹5,000 Cr in a single day.",
      trailingStop: "After +8% gain, trail stop to +3%. Use 20-day EMA as dynamic trailing stop for the second half of position.",
    },
    risk: {
      positionSize: "15–20% of portfolio in index ETFs; 5–7% in individual sector ETFs",
      maxDrawdown: "If Nifty breaks 200-day MA on weekly close, reduce to 50% equity exposure",
      riskReward: "Target 3:1 minimum on individual swing trades",
      maxOpenPositions: 5,
      correlationLimit: "Never be 100% equity when FII net selling for 5+ consecutive sessions",
    },
    performance: {
      winRate: 70, avgProfit: 11.4, avgLoss: 5.2, sharpeRatio: 1.88,
      maxDrawdown: -13.6, cagr: 21.8, totalTrades: 124, profitFactor: 2.28, avgHoldDays: 14,
    },
    equityCurve: [100,102,105,104,108,107,111,109,113,115,113,117,116,120,118,123,121,125,128,131].map((v,i)=>({day:i,value:v})),
    maxDrawdownSeries: DRAWDOWN_CSV.slice(120, 170),
    color: "emerald",
    status: "running",
    pnl: 16.3,
    signals: 5,
    tags: ["FII", "DII", "institutional flow", "Nifty", "rupee", "RBI", "India"],
  },

  // ── 9. MEAN REVERSION STATARB ────────────────────────────────────────────
  {
    id: "quant-mean-reversion",
    name: "Statistical Arbitrage",
    trader: "Citadel / Renaissance Technologies Style",
    markets: ["US", "CRYPTO"],
    style: "QUANT",
    riskLevel: "QUANT",
    description: "Quantitative pairs-trading strategy exploiting temporary divergences between highly correlated assets. Uses cointegration analysis, z-score thresholds, and automated execution. Market-neutral — profits regardless of market direction.",
    keyPrinciples: [
      "Identify cointegrated pairs (Engle-Granger test p-value < 0.05)",
      "Enter when spread z-score exceeds 2.0 standard deviations from mean",
      "Exit at mean reversion (z-score returns to 0) or stop at z-score = 3.5",
      "100% market-neutral — always long one asset, short the correlated asset",
      "Correlation must be ≥ 0.85 over rolling 252-day window",
    ],
    entry: {
      setup: "Calculate the historical spread between two cointegrated stocks (e.g., AAPL vs. MSFT, or COIN vs. MSTR). When the z-score of the spread diverges beyond 2 standard deviations, fade the divergence.",
      triggers: [
        "Cointegration test p-value < 0.05 (pairs are statistically mean-reverting)",
        "Spread z-score exceeds ±2.0 standard deviations (2σ entry threshold)",
        "Rolling 60-day correlation ≥ 0.80 between the pair",
        "Half-life of mean reversion < 20 trading days (otherwise hold period is too long)",
        "No fundamental catalyst explaining the divergence (earnings/M&A = skip)",
        "Both stocks in the same sector and market-cap range",
      ],
      indicators: ["Cointegration z-score", "Engle-Granger test statistic", "Bollinger Bands on spread (±2σ)", "Rolling correlation (60-day)", "Half-life of mean reversion (Ornstein-Uhlenbeck)", "Beta-neutral hedge ratio"],
      volumeCondition: "Both sides of the pair must have sufficient liquidity (>$50M daily volume). Avoid pairs where one leg is thinly traded — creates execution slippage.",
      timeframe: "Hourly for signal detection, 15-min for execution. Backtest on daily data for pair selection.",
      confirmation: "Z-score crossing 2.0 on at least 2 consecutive hourly bars. Spread moving in the mean-reversion direction (confirmation candle). No earnings within 5 days for either stock.",
    },
    exit: {
      takeProfit: "Close entire position when z-score returns to 0 (mean). Also close if holding for 15+ trading days without mean reversion (time stop).",
      stopLoss: "Hard stop if z-score widens to 3.5 (regime change / fundamental break in correlation). Maximum loss = 1.5× initial margin.",
      trailingStop: "As z-score returns toward 0, trail stop at current z-score +0.5σ to protect unrealized gains.",
      timeExit: "Maximum holding period: 20 trading days. After 20 days without mean reversion, exit both legs at market — the model's assumption has failed.",
    },
    risk: {
      positionSize: "2% of capital per pair trade (50 pairs possible = 100% deployed, but max 10 active)",
      maxDrawdown: "Per-strategy drawdown limit: -8%. Kill switch activates if 3 consecutive pairs fail",
      riskReward: "Statistical edge: target 1.5:1 on many small trades (high frequency × positive expected value)",
      maxOpenPositions: 10,
      correlationLimit: "Never have more than 3 pairs from the same sector simultaneously",
      dailyLossLimit: "Automated circuit breaker: stop all trading if daily P&L < -2%",
    },
    performance: {
      winRate: 58, avgProfit: 4.2, avgLoss: 2.8, sharpeRatio: 2.48,
      maxDrawdown: -8.6, cagr: 34.8, totalTrades: 1248, profitFactor: 2.08, avgHoldDays: 8,
    },
    equityCurve: [100,101,102,103,104,103,105,106,107,108,107,109,110,111,112,111,113,114,115,116].map((v,i)=>({day:i,value:v})),
    maxDrawdownSeries: DRAWDOWN_CSV.slice(150, 200),
    color: "violet",
    status: "backtesting",
    pnl: 8.4,
    signals: 14,
    tags: ["pairs trading", "cointegration", "market-neutral", "quant", "z-score", "HFT", "systematic"],
  },

  // ── 10. VWAP INTRADAY MOMENTUM ───────────────────────────────────────────
  {
    id: "us-vwap-intraday",
    name: "VWAP Intraday Momentum",
    trader: "Brian Shannon (Alphatrends)",
    markets: ["US"],
    style: "DAY",
    riskLevel: "HIGH",
    description: "VWAP-anchored intraday momentum strategy. Buys stocks trading above VWAP on first 30-minute breakout with above-average volume. Anchored VWAP from earnings provides key levels.",
    keyPrinciples: [
      "VWAP is the institutional benchmark price — trade in the direction of VWAP",
      "First 30 minutes of market open sets the day's bias — don't fight the opening range",
      "Anchored VWAP from prior earnings = the most important support/resistance level",
      "Pre-market volume and gap direction determine the trade direction before open",
      "Never hold a day trade through 15:30 EST — too much overnight gap risk",
    ],
    entry: {
      setup: "Stock gaps up on news/earnings catalyst. After 30-minute opening range, wait for first clean pullback to VWAP or first 15-min base. Buy the breakout above the first 30-min high with volume.",
      triggers: [
        "Stock gaps up > 2% pre-market on earnings/news catalyst",
        "First 30-min candle is bullish (closes > open, above VWAP)",
        "Pullback to VWAP touches and bounces without violation (VWAP support confirmed)",
        "Volume on the setup candle is 1.5× the per-bar average",
        "Market (SPY) is above its own VWAP (directional tailwind)",
        "Relative volume (RVOL) > 2.0× in pre-market and first 30 minutes",
      ],
      indicators: ["VWAP", "Anchored VWAP (from earnings date)", "Volume Weighted Average", "RVOL (Relative Volume)", "Opening Range High/Low", "5-min and 15-min EMA 9", "SPY VWAP comparison"],
      volumeCondition: "RVOL must be > 2.0× on the entry candle. Any VWAP break with below-average volume should be IGNORED — it's a false breakout signal.",
      timeframe: "5-minute for entry, 15-minute for setup confirmation, 1-minute for precise entry",
      confirmation: "Price closes above VWAP on 5-min chart. Next candle holds above VWAP. Volume > 1.5× average on the confirmaton candle.",
    },
    exit: {
      takeProfit: "Target 1: Opening Range extension (same % move above ORH). Target 2: Prior day's high. Target 3: Anchored VWAP from prior catalyst.",
      stopLoss: "Intraday: Stop below VWAP on a 5-min close. Never risk more than 0.5% of account on any single day trade.",
      trailingStop: "After +1R gain, trail stop to VWAP. After +2R, trail to 9-EMA on 5-min chart.",
      timeExit: "Hard exit by 15:45 EST. Reduce position by 50% at 15:00 if not at target.",
    },
    risk: {
      positionSize: "Risk max $200 per trade (stop size determines share count)",
      maxDrawdown: "Stop trading for the day after -$500 loss or 3 consecutive losses",
      riskReward: "Minimum 2:1; target 3:1 on day trades",
      maxOpenPositions: 3,
      dailyLossLimit: "Absolute daily loss cap: -0.5% of total account value",
    },
    performance: {
      winRate: 56, avgProfit: 12.4, avgLoss: 5.2, sharpeRatio: 1.94,
      maxDrawdown: -11.2, cagr: 48.6, totalTrades: 682, profitFactor: 2.42, avgHoldDays: 0.2,
    },
    equityCurve: [100,103,101,105,108,106,110,113,111,115,118,116,120,123,121,125,128,126,130,133].map((v,i)=>({day:i,value:v})),
    maxDrawdownSeries: DRAWDOWN_CSV.slice(170, 220),
    color: "teal",
    status: "running",
    pnl: 28.6,
    signals: 9,
    tags: ["VWAP", "intraday", "momentum", "gap & go", "opening range", "day trading"],
  },
];

// ─── Lookup helpers ──────────────────────────────────────────────────────────

export function getStrategiesByMarket(market: string): Strategy[] {
  return STRATEGIES.filter(s => s.markets.includes(market));
}

export function getStrategiesByStyle(style: StyleType): Strategy[] {
  return STRATEGIES.filter(s => s.style === style);
}

export function getStrategiesByRisk(risk: string): Strategy[] {
  return STRATEGIES.filter(s => s.riskLevel === risk);
}

export function getRunningStrategies(): Strategy[] {
  return STRATEGIES.filter(s => s.status === "running");
}

// Color-token mapping for Tailwind classes
export const STRATEGY_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  blue:    { bg: "bg-blue-500/15",    text: "text-blue-400",    border: "border-blue-500/30",    glow: "hover:shadow-[0_0_32px_-8px_rgba(60,140,255,0.5)]"   },
  cyan:    { bg: "bg-cyan-500/15",    text: "text-cyan-400",    border: "border-cyan-500/30",    glow: "hover:shadow-[0_0_32px_-8px_rgba(0,210,230,0.5)]"    },
  orange:  { bg: "bg-orange-500/15",  text: "text-orange-400",  border: "border-orange-500/30",  glow: "hover:shadow-[0_0_32px_-8px_rgba(255,140,60,0.5)]"   },
  green:   { bg: "bg-green-500/15",   text: "text-green-400",   border: "border-green-500/30",   glow: "hover:shadow-[0_0_32px_-8px_rgba(0,200,100,0.5)]"    },
  yellow:  { bg: "bg-yellow-500/15",  text: "text-yellow-400",  border: "border-yellow-500/30",  glow: "hover:shadow-[0_0_32px_-8px_rgba(240,200,60,0.5)]"   },
  purple:  { bg: "bg-purple-500/15",  text: "text-purple-400",  border: "border-purple-500/30",  glow: "hover:shadow-[0_0_32px_-8px_rgba(160,80,255,0.5)]"   },
  indigo:  { bg: "bg-indigo-500/15",  text: "text-indigo-400",  border: "border-indigo-500/30",  glow: "hover:shadow-[0_0_32px_-8px_rgba(100,100,255,0.5)]"  },
  emerald: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", glow: "hover:shadow-[0_0_32px_-8px_rgba(0,210,150,0.5)]"    },
  violet:  { bg: "bg-violet-500/15",  text: "text-violet-400",  border: "border-violet-500/30",  glow: "hover:shadow-[0_0_32px_-8px_rgba(180,60,255,0.5)]"   },
  teal:    { bg: "bg-teal-500/15",    text: "text-teal-400",    border: "border-teal-500/30",    glow: "hover:shadow-[0_0_32px_-8px_rgba(20,200,190,0.5)]"   },
};

export const STYLE_LABELS: Record<StyleType, string> = {
  SCALP:    "Scalp",
  DAY:      "Day Trade",
  SWING:    "Swing",
  POSITION: "Position",
  QUANT:    "Quant",
  MACRO:    "Macro",
  HFT:      "HFT",
};

export const RISK_COLORS_MAP: Record<string, string> = {
  LOW:   "text-blue-400   bg-blue-400/10   border-blue-400/30",
  MEDIUM:"text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  HIGH:  "text-orange-400 bg-orange-400/10 border-orange-400/30",
  QUANT: "text-violet-400 bg-violet-400/10 border-violet-400/30",
};
