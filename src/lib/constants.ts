export const MARKETS = ["US", "INDIA", "UAE", "CRYPTO"] as const;
export type Market = typeof MARKETS[number];

export const MARKET_LABELS: Record<Market, string> = {
  US: "🇺🇸 US",
  INDIA: "🇮🇳 India",
  UAE: "🇦🇪 UAE",
  CRYPTO: "₿ Crypto",
};

export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "QUANT"] as const;
export type RiskLevel = typeof RISK_LEVELS[number];

export const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: "text-blue-400",
  MEDIUM: "text-yellow-400",
  HIGH: "text-orange-400",
  QUANT: "text-purple-400",
};

// Demo watchlist symbols per market
// US: 13F filing leaders (Berkshire / Sands / Bridgewater top picks)
// India: Jhunjhunwala + Kacholia portfolio tickers
// UAE: Real ADX/DFM dividend universe (from StashAway MENA 2026 data)
// Crypto: top 5 by market cap
export const DEFAULT_WATCHLIST = {
  US:     ["AAPL", "NVDA", "TSLA", "MSFT", "AMZN", "META", "GOOGL", "SPY"],
  INDIA:  ["TITAN", "TCS", "INFY", "HDFCBANK", "RELIANCE", "STARHEALTH", "CONCORD"],
  UAE:    ["EMAAR", "FAB", "ADNOCGAS", "EMIRATESNBD", "DEWA", "ADCB", "DIB"],
  CRYPTO: ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "AVAXUSDT"],
};

// Commodities are deliberately NOT part of MARKETS: that tuple drives the header
// market switcher and the live-quotes fetch, which only understands the four
// exchange-backed markets above. Oil and gold have their own page (/commodities)
// and their own data layer (src/lib/commodities.ts).
export const COMMODITY_WATCHLIST = {
  // Real benchmark prices, in dollars per barrel / per troy ounce
  BENCHMARKS: ["BRENT", "WTI", "XAU/USD"],
  // US-listed instruments used for live intraday exposure
  PROXIES: ["USO", "BNO", "GLD", "IAU", "GDX", "XLE"],
};

// Mock portfolio stats for UI development
export const MOCK_PORTFOLIO = {
  totalValue: 287450.32,
  dayPnl: 4823.11,
  dayPnlPct: 1.71,
  totalPnl: 38920.44,
  totalPnlPct: 15.67,
  cashBalance: 42100.0,
  openPositions: 14,
  winRate: 67.3,
};
