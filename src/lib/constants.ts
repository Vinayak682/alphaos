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
export const DEFAULT_WATCHLIST = {
  US: ["AAPL", "NVDA", "TSLA", "MSFT", "AMZN", "META", "GOOGL", "SPY"],
  INDIA: ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "WIPRO.NS"],
  UAE: ["EMAAR.DFM", "DIB.DFM", "FAB.ADX", "ADNOC.ADX"],
  CRYPTO: ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "AVAXUSDT"],
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
