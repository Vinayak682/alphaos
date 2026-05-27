/**
 * AlphaOS — Global Institutional Intelligence Database
 * Sources: SEC Form 13F filings (Q1 2026), SEBI bulk/block deal disclosures,
 * ADX/DFM public dividend data, Waha Capital / ADIA / Mubadala reporting.
 *
 * US data: Q1 2026 13F filings via SensaMarket / MacroMicro
 * India data: NSE/BSE superinvestor disclosures via Trendlyne / Equitymaster
 * UAE data: ADX/DFM exchange filings + StashAway MENA dividend research
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface USInstitution {
  id:             string;
  name:           string;
  manager:        string;
  reportingPeriod: string;
  portfolioValueB: number;   // USD billions
  uniqueStocks:   number;
  topSectors:     { sector: string; pct: number }[];
  topHoldings:    { ticker: string; valueB: number; pct: number; name: string }[];
  recentBuys:     { ticker: string; changePct: number }[];
  recentSells:    { ticker: string; changePct: number }[];
  strategy:       string;
  strategyDetail: string;
  color:          string;
  performance:    string;    // notable metric
}

export interface IndianSuperinvestor {
  id:           string;
  name:         string;
  firm:         string;
  portfolioINRCr: number;
  stockCount:   number;
  topHoldings:  { ticker: string; name: string; valueCr: number; pct: number }[];
  framework:    string;
  entryDiscipline: string;
  exitRule:     string;
  sizing:       string;
  color:        string;
}

export interface UAEDividendStock {
  ticker:       string;
  exchange:     "ADX" | "DFM";
  name:         string;
  sector:       string;
  marketCapAED: number;   // billions
  dividendYield: number;  // %
  avgDailyVolShares: number;  // millions
  sovereignHolder:   string;
  color:        string;
}

export interface StrategyExact {
  name:        string;
  regime:      string;
  entryTrigger: string;
  exitTrigger: string;
  hardStopLoss: string;
  trailingStop: string;
  volumeRule:  string;
  positionSizing: string;
  targetRR:    string;
  targetSharpe?: string;
}

// ─── US 13F Institutional Database ───────────────────────────────────────────

export const US_INSTITUTIONS: USInstitution[] = [
  {
    id: "berkshire",
    name: "Berkshire Hathaway",
    manager: "Warren Buffett",
    reportingPeriod: "Q1 2026",
    portfolioValueB: 290.96,
    uniqueStocks: 32,
    topSectors: [
      { sector: "Banking & Finance", pct: 34.22 },
      { sector: "Telecommunications", pct: 24.39 },
      { sector: "Food & Beverages", pct: 14.01 },
    ],
    topHoldings: [
      { ticker: "AAPL", name: "Apple Inc.", valueB: 70.39, pct: 24.19 },
      { ticker: "AXP",  name: "American Express", valueB: 47.27, pct: 16.25 },
      { ticker: "KO",   name: "Coca-Cola", valueB: 32.59, pct: 11.20 },
    ],
    recentBuys:  [{ ticker: "NYT", changePct: 6.23 }, { ticker: "DAL", changePct: 6.06 }, { ticker: "LEN", changePct: 1.24 }],
    recentSells: [{ ticker: "STZ", changePct: -7.18 }, { ticker: "DVA", changePct: -2.51 }, { ticker: "CVX", changePct: -2.30 }],
    strategy: "High-Conviction Value / Economic Moat",
    strategyDetail: "Buys durable businesses with pricing power, high ROCE, stable margins, strong FCF, and low debt. Holds for decades. Never sells a great business unless the moat is impaired.",
    color: "blue",
    performance: "~20% CAGR since 1965",
  },
  {
    id: "fisheri",
    name: "Fisher Investments",
    manager: "Ken Fisher",
    reportingPeriod: "Q1 2026",
    portfolioValueB: 292.09,
    uniqueStocks: 817,
    topSectors: [
      { sector: "Software & Services", pct: 18.55 },
      { sector: "Banking & Finance", pct: 17.32 },
      { sector: "Hardware Technology", pct: 15.11 },
    ],
    topHoldings: [
      { ticker: "NVDA",  name: "NVIDIA",    valueB: 19.07, pct: 6.53 },
      { ticker: "AAPL",  name: "Apple",     valueB: 17.43, pct: 5.97 },
      { ticker: "GOOGL", name: "Alphabet",  valueB: 14.96, pct: 5.12 },
    ],
    recentBuys:  [{ ticker: "MTN", changePct: 1.45 }, { ticker: "PFE", changePct: 0.93 }, { ticker: "KALU", changePct: 0.90 }],
    recentSells: [{ ticker: "AMMO", changePct: -1.10 }, { ticker: "JHG", changePct: -1.10 }, { ticker: "JEF", changePct: -1.03 }],
    strategy: "Broadly Diversified Growth / Global Macro",
    strategyDetail: "Top-down macro framework across 817 global equities. Identifies 3-5 year market cycles, overweights secular growth sectors, and systematically rebalances based on macro regime shifts.",
    color: "cyan",
    performance: "Largest independent RIA globally",
  },
  {
    id: "bridgewater",
    name: "Bridgewater Associates",
    manager: "Ray Dalio",
    reportingPeriod: "Q1 2026",
    portfolioValueB: 22.40,
    uniqueStocks: 993,
    topSectors: [
      { sector: "Diversified Index ETFs", pct: 35.0 },
      { sector: "Technology", pct: 30.0 },
      { sector: "Consumer Staples", pct: 15.0 },
    ],
    topHoldings: [
      { ticker: "SPY",  name: "SPDR S&P 500 ETF",       valueB: 2.62, pct: 11.70 },
      { ticker: "IVV",  name: "iShares Core S&P 500",   valueB: 1.61, pct: 7.20  },
      { ticker: "MU",   name: "Micron Technology",      valueB: 1.05, pct: 4.70  },
    ],
    recentBuys:  [{ ticker: "AMZN", changePct: 125.26 }, { ticker: "MU", changePct: 65.88 }, { ticker: "NVDA", changePct: 21.42 }],
    recentSells: [{ ticker: "IVV", changePct: -35.99 }, { ticker: "CRM", changePct: -100 }, { ticker: "ADBE", changePct: -99.9 }],
    strategy: "Risk Parity Beta / Alpha-Beta Separation",
    strategyDetail: "Risk Parity balances risk across equities (19%), bonds (47%), and commodities (34%) by dollar weight. Leverages low-vol assets 1.5–2× via futures to equalize risk contributions. Pure Alpha runs 30–40 uncorrelated macro positions.",
    color: "violet",
    performance: "All Weather 10% vol target; Pure Alpha +14% annualized",
  },
  {
    id: "citadel",
    name: "Citadel Advisors",
    manager: "Kenneth C. Griffin",
    reportingPeriod: "Q1 2026",
    portfolioValueB: 155.17,
    uniqueStocks: 4373,
    topSectors: [
      { sector: "Software & Services", pct: 16.09 },
      { sector: "Hardware Technology", pct: 12.75 },
      { sector: "Banking & Finance", pct: 10.18 },
    ],
    topHoldings: [
      { ticker: "NVDA",  name: "NVIDIA",          valueB: 4.64, pct: 2.99 },
      { ticker: "AMZN",  name: "Amazon",          valueB: 3.77, pct: 2.43 },
      { ticker: "MU",    name: "Micron",          valueB: 2.29, pct: 1.48 },
    ],
    recentBuys:  [{ ticker: "AMG", changePct: 0.012 }, { ticker: "FCN", changePct: 0.008 }, { ticker: "BKNG", changePct: 0.004 }],
    recentSells: [{ ticker: "MKL", changePct: -0.268 }, { ticker: "MHK", changePct: -0.126 }, { ticker: "EVV", changePct: -0.104 }],
    strategy: "Multi-Strategy Hedge Fund / Statistical Arbitrage",
    strategyDetail: "4,373 positions across equities, derivatives, fixed income, and commodities. Uses quantitative statistical arbitrage, pairs trading, and event-driven strategies. Extremely diversified to isolate pure alpha from systematic risk.",
    color: "orange",
    performance: "Wellington fund ~24% net annualized",
  },
  {
    id: "renaissance",
    name: "Renaissance Technologies",
    manager: "Jim Simons",
    reportingPeriod: "Q1 2026",
    portfolioValueB: 63.93,
    uniqueStocks: 3213,
    topSectors: [
      { sector: "Software & Services", pct: 17.16 },
      { sector: "Pharma & Biotech", pct: 10.68 },
      { sector: "Hardware Technology", pct: 10.20 },
    ],
    topHoldings: [
      { ticker: "MU",   name: "Micron Technology",       valueB: 1.62, pct: 2.54 },
      { ticker: "SNDK", name: "Sandisk",                 valueB: 1.18, pct: 1.85 },
      { ticker: "UTHR", name: "United Therapeutics",     valueB: 1.02, pct: 1.59 },
    ],
    recentBuys:  [{ ticker: "CLPR", changePct: 4.45 }, { ticker: "GridAI", changePct: 3.62 }, { ticker: "AEye", changePct: 2.92 }],
    recentSells: [{ ticker: "RYTM", changePct: -12.84 }, { ticker: "OPEN", changePct: -2.85 }, { ticker: "METC", changePct: -1.80 }],
    strategy: "Systematic Quantitative / Statistical Arbitrage",
    strategyDetail: "Medallion Fund uses proprietary mathematical models and pattern recognition across thousands of data series. Trading frequency from milliseconds to days. ~3,200 positions — pure algorithmic execution, zero discretion.",
    color: "emerald",
    performance: "Medallion: +66% gross annualized (30 years)",
  },
  {
    id: "baillie-gifford",
    name: "Baillie Gifford & Company",
    manager: "James Anderson / Tom Slater",
    reportingPeriod: "Q1 2026",
    portfolioValueB: 106.31,
    uniqueStocks: 274,
    topSectors: [
      { sector: "Software & Services", pct: 55.24 },
      { sector: "Hardware Technology", pct: 10.77 },
      { sector: "Manufacturing", pct: 5.23 },
    ],
    topHoldings: [
      { ticker: "NVDA",  name: "NVIDIA",        valueB: 8.77, pct: 8.25 },
      { ticker: "AMZN",  name: "Amazon",        valueB: 7.48, pct: 7.04 },
      { ticker: "MELI",  name: "MercadoLibre",  valueB: 5.38, pct: 5.06 },
    ],
    recentBuys:  [{ ticker: "MMYT", changePct: 10.39 }, { ticker: "Merlin", changePct: 2.37 }, { ticker: "BC", changePct: 1.86 }],
    recentSells: [{ ticker: "TTD", changePct: -4.71 }, { ticker: "Heartflow", changePct: -2.23 }, { ticker: "CPNG", changePct: -1.37 }],
    strategy: "Structural Growth / Mid-to-Long Horizon",
    strategyDetail: "55%+ in software/services. 5–10 year conviction holds in companies creating new industries. Backs disruptive business models at early growth stages before the mainstream recognizes the scale of opportunity.",
    color: "teal",
    performance: "Scottish Mortgage Trust: 10× in 10 years (2010-2020)",
  },
  {
    id: "point72",
    name: "Point72 Asset Management",
    manager: "Steven A. Cohen",
    reportingPeriod: "Q1 2026",
    portfolioValueB: 71.00,
    uniqueStocks: 1952,
    topSectors: [
      { sector: "Software & Services", pct: 16.94 },
      { sector: "Hardware Technology", pct: 16.40 },
      { sector: "Pharma & Biotech", pct: 8.68 },
    ],
    topHoldings: [
      { ticker: "NVDA",  name: "NVIDIA",   valueB: 2.15, pct: 3.03 },
      { ticker: "TSM",   name: "TSMC",     valueB: 1.89, pct: 2.66 },
      { ticker: "AMZN",  name: "Amazon",   valueB: 1.40, pct: 1.97 },
    ],
    recentBuys:  [],
    recentSells: [],
    strategy: "Multi-Manager Equity Long / Short",
    strategyDetail: "Multi-PM pod structure — each PM runs an independent book with strict risk limits. Combines long-term fundamental research with short-term technical catalysts. Sector specialists in healthcare, tech, and consumer.",
    color: "purple",
    performance: "~20% gross annualized; SAC Capital era record",
  },
  {
    id: "sands-capital",
    name: "Sands Capital Management",
    manager: "Frank Sands",
    reportingPeriod: "Q1 2026",
    portfolioValueB: 28.28,
    uniqueStocks: 67,
    topSectors: [
      { sector: "Software & Services", pct: 45.81 },
      { sector: "Hardware Technology", pct: 29.43 },
      { sector: "Manufacturing", pct: 3.36 },
    ],
    topHoldings: [
      { ticker: "NVDA",  name: "NVIDIA",   valueB: 3.89, pct: 13.77 },
      { ticker: "TSM",   name: "TSMC",     valueB: 2.37, pct: 8.38  },
      { ticker: "GOOGL", name: "Alphabet", valueB: 1.96, pct: 6.94  },
    ],
    recentBuys:  [{ ticker: "BE", changePct: 0.63 }, { ticker: "CRS", changePct: 0.41 }, { ticker: "STX", changePct: 0.24 }],
    recentSells: [{ ticker: "LRCX", changePct: -0.83 }, { ticker: "SOT", changePct: -0.61 }, { ticker: "NOW", changePct: -0.37 }],
    strategy: "Concentrated Institutional Growth",
    strategyDetail: "67 stocks — highly concentrated in high-growth technology. 45% software exposure. 5–7 year holding horizon. Focus on companies with expanding TAM, durable business models, and compounding ROIC.",
    color: "indigo",
    performance: "Global Growth Fund: top decile 10-year performance",
  },
  {
    id: "scion",
    name: "Scion Asset Management",
    manager: "Michael Burry",
    reportingPeriod: "Q3 2025",
    portfolioValueB: 1.38,
    uniqueStocks: 8,
    topSectors: [
      { sector: "Deep Value Contrarian", pct: 60.0 },
      { sector: "Bearish / Put Options", pct: 40.0 },
    ],
    topHoldings: [
      { ticker: "PLTR", name: "Palantir Puts ($50 strike)", valueB: 0.092, pct: 6.67 },
    ],
    recentBuys:  [{ ticker: "PLTR Puts", changePct: 100 }],
    recentSells: [],
    strategy: "Deep Contrarian Value / Short Overhyped Assets",
    strategyDetail: "Concentrates in 5–8 high-conviction positions. Shorts narrative-driven bubbles using put options. Famous for the 2008 mortgage short — $100M → $700M+. Current thesis: Palantir overvaluation ($9.2M in 50,000 put contracts at $50 strike).",
    color: "red",
    performance: "2008 Big Short: $700M+ profit",
  },
];

// ─── Indian Superinvestor Database ────────────────────────────────────────────

export const INDIA_SUPERINVESTORS = [
  {
    id: "jhunjhunwala",
    name: "Rakesh Jhunjhunwala",
    firm: "Rare Enterprises",
    portfolioINRCr: 52241.42,
    stockCount: 27,
    topHoldings: [
      { ticker: "TITAN",       name: "Titan Company",           valueCr: 19989.20, pct: 38.26 },
      { ticker: "IKS",         name: "Inventurus Knowledge",    valueCr: 13888.10, pct: 26.58 },
      { ticker: "STARHEALTH",  name: "Star Health Insurance",   valueCr: 4820.10,  pct: 9.23  },
      { ticker: "CONCORD",     name: "Concord Biotech",         valueCr: 2886.80,  pct: 5.53  },
      { ticker: "METROBRAND",  name: "Metro Brands",            valueCr: 2796.60,  pct: 5.35  },
    ],
    framework: "Dual-brain: Long-term 'investing brain' for quality compounders + Short-term 'trading brain' for trend-following. 40% win rate on trades — capital protected via strict stop-losses.",
    entryDiscipline: "Investing: High-conviction fundamentals, long-term consumption runways. Trading: Strictly trend-following — buy in uptrend, sell when share enters downtrend.",
    exitRule: "Exit immediately if pre-calculated technical stop-loss is triggered. Technical weakness or chart-based sell signals. NEVER average down on losing trades.",
    sizing: "Pyramiding on upward-trending positions (add to winners). Concentrated conviction bets with multi-year horizons for core holdings.",
    color: "green",
  },
  {
    id: "vijay-kedia",
    name: "Vijay Kishanlal Kedia",
    firm: "Kedia Securities",
    portfolioINRCr: 1348.83,
    stockCount: 15,
    topHoldings: [
      { ticker: "ATULAUTO",  name: "Atul Auto",          valueCr: 180, pct: 13.3 },
      { ticker: "TAC",       name: "TAC Infosec",         valueCr: 156, pct: 11.6 },
      { ticker: "NEULANDLAB",name: "Neuland Labs",        valueCr: 142, pct: 10.5 },
      { ticker: "TEJASNET",  name: "Tejas Networks",      valueCr: 128, pct: 9.5  },
      { ticker: "ELECON",    name: "Elecon Engineering",  valueCr: 114, pct: 8.5  },
    ],
    framework: "SMILE Framework: Small size (company) + Medium experience (management) + Large aspiration (vision) + Extra-large market potential (TAM). Identifies small-caps with 100× potential.",
    entryDiscipline: "Identifies companies with strong management integrity, expanding markets, and business models capable of 10× to 100× compounding over 10–15 years. Buys when market doesn't recognize the potential.",
    exitRule: "Evaluate fundamentals quarterly. Exit if structural business alignment fails, management integrity is questioned, or execution gaps emerge significantly.",
    sizing: "Concentrated, multi-year holds (10–15 year horizon). Ignores short-term market fluctuations. Conviction-sized positions allowing compounding to work.",
    color: "orange",
  },
  {
    id: "ashish-kacholia",
    name: "Ashish Kacholia",
    firm: "Lucky Investment Managers",
    portfolioINRCr: 2783.80,
    stockCount: 22,
    topHoldings: [
      { ticker: "AJANTPHARM", name: "Ajanta Pharma",    valueCr: 320, pct: 11.5 },
      { ticker: "MASTEK",     name: "Mastek Ltd",       valueCr: 280, pct: 10.1 },
      { ticker: "POLYCAB",    name: "Polycab India",    valueCr: 260, pct: 9.3  },
      { ticker: "KPITTECH",   name: "KPIT Technologies",valueCr: 220, pct: 7.9  },
      { ticker: "ATULAUTO",   name: "Atul Auto",        valueCr: 190, pct: 6.8  },
    ],
    framework: "Growth at Reasonable Price (GARP). Focus on low P/E, low D/E, stable ROE, positive FCF small-and-midcap stocks. Known as 'The Big Whale' for outsized influence on small-cap price discovery.",
    entryDiscipline: "Screens for: P/E below sector average + D/E < 0.3 + ROE > 15% consistently + positive free cash flow + management skin in the game (promoter holding > 40%).",
    exitRule: "Systematically exit if quarterly earnings show structural underperformance (2+ consecutive misses). Exit if debt ratio deteriorates beyond thresholds.",
    sizing: "Diversifies across multiple sectors to mitigate small-cap volatility. Typical position size: 5–10% of portfolio per stock.",
    color: "blue",
  },
  {
    id: "pabrai",
    name: "Mohnish Pabrai",
    firm: "Pabrai Investment Funds",
    portfolioINRCr: 153.47,
    stockCount: 6,
    topHoldings: [
      { ticker: "RAIN",       name: "Rain Industries",       valueCr: 52,  pct: 33.9 },
      { ticker: "EDELWEISS",  name: "Edelweiss Financial",   valueCr: 48,  pct: 31.3 },
      { ticker: "SUNTECK",    name: "Sunteck Realty",        valueCr: 38,  pct: 24.8 },
    ],
    framework: "Spawner Framework: Identifies businesses that continuously create and scale new divisions. 4 archetypes: Adjacent (expand into related verticals), Embryonic (acquire early-stage), Cloner (replicate competitors), Non-Adjacent (conglomerate builders).",
    entryDiscipline: "Distress-driven value. Targets low-risk + high-uncertainty = steep discount to intrinsic value. Market confuses uncertainty (wide outcome range) with risk (permanent capital loss). Never buys IPOs or startups.",
    exitRule: "Exit when valuations reach fair value or structural tailwinds dissipate. Runs fundamental checklists before every exit. High concentration: only 5–10 stocks.",
    sizing: "Extreme concentration (5–10 holdings). A single 5× spawner covers multiple duds. Ignores diversification in favor of conviction depth.",
    color: "purple",
  },
];

// ─── UAE Dividend Universe (ADX / DFM) ───────────────────────────────────────
// Source: StashAway MENA / ADX Exchange / DFM Exchange — 2026 data

export const UAE_DIVIDEND_STOCKS: UAEDividendStock[] = [
  { ticker: "ADNOCGAS",   exchange: "ADX", name: "ADNOC Gas",                   sector: "Energy",           marketCapAED: 263.26, dividendYield: 5.00, avgDailyVolShares: 116.07, sovereignHolder: "ADNOC State Holding",          color: "orange" },
  { ticker: "FAB",        exchange: "ADX", name: "First Abu Dhabi Bank",         sector: "Finance",          marketCapAED: 185.48, dividendYield: 4.76, avgDailyVolShares: 15.57,  sovereignHolder: "Abu Dhabi Government / State",  color: "blue"   },
  { ticker: "EMIRATESNBD",exchange: "DFM", name: "Emirates NBD Bank",            sector: "Finance",          marketCapAED: 174.46, dividendYield: 3.62, avgDailyVolShares: 5.71,   sovereignHolder: "Investment Corp of Dubai (ICD)",color: "teal"   },
  { ticker: "EAND",       exchange: "ADX", name: "Emirates Telecom (e&)",        sector: "Communications",   marketCapAED: 156.89, dividendYield: 4.99, avgDailyVolShares: 19.24,  sovereignHolder: "Federal Government of UAE",     color: "green"  },
  { ticker: "DEWA",       exchange: "DFM", name: "Dubai Electricity & Water",    sector: "Utilities",        marketCapAED: 130.50, dividendYield: 4.75, avgDailyVolShares: 38.37,  sovereignHolder: "Government of Dubai",           color: "cyan"   },
  { ticker: "ADCB",       exchange: "ADX", name: "Abu Dhabi Commercial Bank",    sector: "Finance",          marketCapAED: 108.34, dividendYield: 4.60, avgDailyVolShares: 15.69,  sovereignHolder: "Abu Dhabi Investment Council",   color: "indigo" },
  { ticker: "EMAAR",      exchange: "DFM", name: "Emaar Properties",             sector: "Real Estate",      marketCapAED: 104.12, dividendYield: 8.49, avgDailyVolShares: 47.97,  sovereignHolder: "Institutional & Public",         color: "yellow" },
  { ticker: "ADNOCDRILL", exchange: "ADX", name: "ADNOC Drilling",               sector: "Industrial",       marketCapAED: 95.36,  dividendYield: 4.15, avgDailyVolShares: 50.24,  sovereignHolder: "ADNOC Sponsor Group",            color: "orange" },
  { ticker: "ADIB",       exchange: "ADX", name: "Abu Dhabi Islamic Bank",       sector: "Finance",          marketCapAED: 74.31,  dividendYield: 4.74, avgDailyVolShares: 7.18,   sovereignHolder: "Local Sovereign / Shari'ah",    color: "emerald"},
  { ticker: "BOROUGE",    exchange: "ADX", name: "Borouge PLC",                  sector: "Process Industry", marketCapAED: 76.05,  dividendYield: 6.40, avgDailyVolShares: 11.52,  sovereignHolder: "ADNOC / Borealis JV",           color: "violet" },
  { ticker: "EMAARDEV",   exchange: "DFM", name: "Emaar Development",            sector: "Real Estate",      marketCapAED: 57.76,  dividendYield: 6.93, avgDailyVolShares: 9.80,   sovereignHolder: "Emaar Properties Parent",        color: "yellow" },
  { ticker: "DU",         exchange: "DFM", name: "Emirates Integrated Telecom",  sector: "Communications",   marketCapAED: 50.77,  dividendYield: 5.71, avgDailyVolShares: 3.56,   sovereignHolder: "Federal Sovereign Allocators",   color: "cyan"   },
  { ticker: "DIB",        exchange: "DFM", name: "Dubai Islamic Bank",           sector: "Finance",          marketCapAED: 53.48,  dividendYield: 4.73, avgDailyVolShares: 11.21,  sovereignHolder: "Government of Dubai",           color: "teal"   },
  { ticker: "ADNOCDIST",  exchange: "ADX", name: "ADNOC Distribution",           sector: "Retail Trade",     marketCapAED: 49.13,  dividendYield: 5.23, avgDailyVolShares: 19.56,  sovereignHolder: "ADNOC Parent Group",             color: "orange" },
  { ticker: "AIRARABIA",  exchange: "DFM", name: "Air Arabia",                   sector: "Transportation",   marketCapAED: 22.77,  dividendYield: 6.15, avgDailyVolShares: 14.46,  sovereignHolder: "Public & Institutional",         color: "blue"   },
];

// ─── Exact Strategy Parameters (from research document) ──────────────────────
// Source: Systematic Trading Strategy Parameters tables

export const STRATEGY_EXACT_PARAMS: StrategyExact[] = [
  {
    name: "Mark Minervini SEPA (VCP)",
    regime: "US Equities",
    entryTrigger: "Buy-stop order 1%–2% above the consolidation pivot point. Only triggered on breakout — prevents capital lock-up on false consolidations.",
    exitTrigger: "Technical weakness or 50-day SMA crossover. At +20–25% gain: sell 50% to lock profits, trail remaining half.",
    hardStopLoss: "7%–8% below entry price OR just below the low of the final tight contraction (whichever is tighter)",
    trailingStop: "50-day SMA trailing once +20–25% gain achieved. 10% trailing stop as backup after major trend confirmation.",
    volumeRule: "Breakout day volume 140%–150%+ of 50-day average. During base formation: pullbacks must see volume drop to 40–60% of average (exhausted sellers).",
    positionSizing: "Size each position to keep total trade risk within 1% of total portfolio capital",
    targetRR: "3:1 minimum; VCP setups typically yield 4:1 to 6:1",
    targetSharpe: "≥1.5 on active trades",
  },
  {
    name: "Dan Zanger Momentum Breakout",
    regime: "US Equities",
    entryTrigger: "Breakout of short-term continuation patterns: flags, pennants, or cup-and-handle on high volume. Enter on the candle that breaks the pattern's resistance.",
    exitTrigger: "Exit initial 50% after first profit target hit. Trail remaining 50% with an upward-adjusting stop.",
    hardStopLoss: "8% below purchase price — absolute hard stop, no exceptions",
    trailingStop: "Trailing stop adjusted upward as price moves in favor. Typically 8%–10% trailing on winning positions.",
    volumeRule: "Daily breakout volume 100%+ above the 20-day average (2× normal). Volume must confirm the pattern breakout.",
    positionSizing: "Maximum 1% of total portfolio capital on any single trade",
    targetRR: "3:1 to 5:1",
  },
  {
    name: "Paul Tudor Jones Global Macro",
    regime: "Global Futures, Debt, FX",
    entryTrigger: "Macro trend validated by price action plus technical breakout confirmation. Waits for both fundamental catalyst AND chart confirmation.",
    exitTrigger: "Crossover of key indicators (e.g., 200-day MA breakdown) OR time-based stops if thesis not playing out.",
    hardStopLoss: "Capital risk hard-capped at 1% of total portfolio assets per individual trade",
    trailingStop: "Dynamic stops adjusted relative to market volatility (ATR-based). Loosens in trending markets, tightens during consolidation.",
    volumeRule: "Volume analysis used to confirm macro-trend validity. Momentum confirmed by expanding participation.",
    positionSizing: "Hard 1% asset risk limit per trade",
    targetRR: "5:1 reward-to-risk minimum (Druckenmiller rule: 'Never risk a dollar to make a dollar')",
  },
  {
    name: "William O'Neil CAN SLIM",
    regime: "US Equities",
    entryTrigger: "Breakout from a cup-with-handle consolidation pattern spanning 7+ weeks. Buy within 5% of the exact pivot point — don't chase.",
    exitTrigger: "Structural breakout failure or market distribution phase. Take 20–25% profit quickly if reached in 3 weeks (exceptional strength = 8-week hold rule).",
    hardStopLoss: "7%–8% below the buy point — the most critical rule in the CAN SLIM system",
    trailingStop: "Tightened to 2%–3% stop in volatile market regimes. Normal regimes: trail at 10-week MA.",
    volumeRule: "Breakout day volume 40%–50% above average. Pocket pivots during base = up-volume days massively outweigh down-volume days.",
    positionSizing: "Sized relative to fund volatility and overall market conditions. More concentrated in confirmed bull markets.",
    targetRR: "3:1 minimum; 20-week rule: 8-week hold if +20% in 3 weeks",
  },
  {
    name: "Richard Dennis Turtle System 1",
    regime: "Global Commodities & Futures",
    entryTrigger: "Price closes above the highest 20-day high (Donchian Channel breakout). Skipped if the prior 20-day signal was a winning trade.",
    exitTrigger: "Price crosses below the 10-day low extreme. Add pyramid unit at every ½ ATR move in the trend direction.",
    hardStopLoss: "2× the 20-day ATR below entry price (volatility-normalized stop)",
    trailingStop: "Trails upward with each new pyramid unit added at ½ ATR moves. Each unit's stop is also 2× ATR below that unit's entry.",
    volumeRule: "Breakout day volume must exceed the 20-day average to confirm institutional participation.",
    positionSizing: "1% of total equity per unit, normalized by 20-day ATR (volatility normalization). Maximum 4 units per market.",
    targetRR: "Variable; Turtle system's edge came from large trending moves (10:1 to 20:1)",
    targetSharpe: "~0.7 historically over multi-year cycles",
  },
  {
    name: "Richard Dennis Turtle System 2",
    regime: "Global Commodities & Futures",
    entryTrigger: "Price closes above the highest 55-day high (longer-term trend breakout). Less frequent but more reliable signals than System 1.",
    exitTrigger: "Price crosses below the 20-day low extreme (longer hold period vs. System 1).",
    hardStopLoss: "2× the 20-day ATR below entry (same formula as System 1 — volatility normalized)",
    trailingStop: "Trails upward with each new pyramid unit added at ½ ATR. System 2 holds longer trends so trailing is wider.",
    volumeRule: "Breakout day volume must exceed the 20-day average.",
    positionSizing: "1% of total equity per unit using 20-day ATR normalization",
    targetRR: "Higher than System 1 — catches major multi-month trends",
    targetSharpe: "~0.7 to 1.0 over multi-year cycles",
  },
  {
    name: "Warren Buffett Economic Moat",
    regime: "Global Large-Cap Equities",
    entryTrigger: "Trades at a significant discount to calculated intrinsic value (DCF + owner earnings). Requires margin of safety — minimum 25% discount to intrinsic value.",
    exitTrigger: "Fundamental change in competitive moat or investment thesis. High valuation (price far exceeds intrinsic value). Management integrity issues.",
    hardStopLoss: "Fundamental stop: if ROCE declines persistently, margins compress, debt rises significantly, or competitive moat is impaired — not price-based.",
    trailingStop: "No price trailing stop — exit is thesis-driven not price-driven. Hold forever if the business keeps compounding.",
    volumeRule: "Not applicable — enters over weeks/months regardless of volume. Uses market sell-offs as buying opportunities.",
    positionSizing: "Sized based on capital conviction — run as highly concentrated holds (Berkshire: 3 stocks = 52% of portfolio).",
    targetRR: "Not measured in short horizons — target is decades of compounding at 20%+ CAGR",
  },
  {
    name: "Ray Dalio Risk Parity (All Weather)",
    regime: "Multi-Asset Global Sleeves",
    entryTrigger: "Correlation regime matching and macroeconomic cycle tracking. Rebalance when asset volatilities shift, restoring equal risk contribution across asset classes.",
    exitTrigger: "Diversification balance disrupted by correlation shifts or inflation regime change.",
    hardStopLoss: "Diversification is the stop-loss: asset classes are designed to offset each other in any macro scenario (growth up/down × inflation up/down = 4 seasons).",
    trailingStop: "Systematic rebalancing back to target risk weights. Not price-based — volatility-contribution based.",
    volumeRule: "Macro liquidity cycle monitoring. Executes via futures/swaps for efficient beta capture with minimal market impact.",
    positionSizing: "Leverages low-volatility assets (bonds ~47%) 1.5–2× via futures to match equity risk contribution. Total notional 150–200% of AUM.",
    targetRR: "N/A — targets consistent 10% volatility with Sharpe ~0.7",
    targetSharpe: "All Weather: ~0.7 nominal; Pure Alpha: ~1.4",
  },
];

// ─── Waha Capital Fund Performance ───────────────────────────────────────────

export const WAHA_FUNDS = [
  {
    name: "Waha Emerging Markets Credit Fund",
    aum: "$1.56B",
    inception: 2012,
    cumulativeReturn: "307.6%",
    focus: "Sovereign and corporate emerging market credit (CEEMEA)",
    strategy: "Absolute return credit",
  },
  {
    name: "Waha MENA Equity Fund",
    aum: "$944M",
    inception: 2014,
    cumulativeReturn: "410.6%",
    focus: "Long/short equity on listed MENA equities",
    strategy: "Regional equity alpha capture",
  },
  {
    name: "Waha Islamic Income Fund",
    aum: "N/D",
    inception: 2020,
    cumulativeReturn: "37.5%",
    focus: "Shari'ah-compliant assets and global sukuk",
    strategy: "Islamic income generation",
  },
];

// ─── Sovereign Wealth Fund Mandates ──────────────────────────────────────────

export const UAE_SOVEREIGN_FUNDS = [
  {
    name: "Abu Dhabi Investment Authority (ADIA)",
    estimatedAUM: "$1.0T+",
    focus: "Global diversification — equities, bonds, real estate, alternatives, infrastructure",
    strategy: "Long-horizon passive + active overlay. Top-3 largest sovereign wealth fund globally.",
  },
  {
    name: "Mubadala Investment Company",
    estimatedAUM: "$300B+",
    focus: "Strategic sectors: tech, aerospace, renewables, healthcare, infrastructure",
    strategy: "Government-backed strategic investments in non-oil GDP diversification.",
  },
  {
    name: "ADQ",
    estimatedAUM: "$110B",
    focus: "Energy (TAQA), Food security (Silal), Healthcare, Transport (AD Ports, Etihad)",
    strategy: "Build national champions and strategic supply chains across 4 sectors.",
  },
];
