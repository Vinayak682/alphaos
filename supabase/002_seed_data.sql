-- ============================================================
-- AlphaOS — Seed Data (run AFTER 001_alphaos_schema.sql)
-- Inserts all institutional intelligence data into Supabase
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── US Institutions ─────────────────────────────────────────
INSERT INTO us_institutions (id, name, manager, reporting_period, portfolio_value_b, unique_stocks, top_sectors, top_holdings, recent_buys, recent_sells, strategy, strategy_detail, performance, color)
VALUES
('berkshire', 'Berkshire Hathaway', 'Warren Buffett', 'Q1 2026', 290.96, 32,
  '[{"sector":"Banking & Finance","pct":34.22},{"sector":"Telecommunications","pct":24.39},{"sector":"Food & Beverages","pct":14.01}]',
  '[{"ticker":"AAPL","name":"Apple Inc.","valueB":70.39,"pct":24.19},{"ticker":"AXP","name":"American Express","valueB":47.27,"pct":16.25},{"ticker":"KO","name":"Coca-Cola","valueB":32.59,"pct":11.20}]',
  '[{"ticker":"NYT","changePct":6.23},{"ticker":"DAL","changePct":6.06},{"ticker":"LEN","changePct":1.24}]',
  '[{"ticker":"STZ","changePct":-7.18},{"ticker":"DVA","changePct":-2.51},{"ticker":"CVX","changePct":-2.30}]',
  'High-Conviction Value / Economic Moat',
  'Buys durable businesses with pricing power, high ROCE, stable margins, strong FCF, and low debt. Holds for decades. Never sells a great business unless the moat is impaired.',
  '~20% CAGR since 1965', 'blue'),

('bridgewater', 'Bridgewater Associates', 'Ray Dalio', 'Q1 2026', 22.40, 993,
  '[{"sector":"Diversified Index ETFs","pct":35.0},{"sector":"Technology","pct":30.0},{"sector":"Consumer Staples","pct":15.0}]',
  '[{"ticker":"SPY","name":"SPDR S&P 500 ETF","valueB":2.62,"pct":11.70},{"ticker":"IVV","name":"iShares Core S&P 500","valueB":1.61,"pct":7.20},{"ticker":"MU","name":"Micron Technology","valueB":1.05,"pct":4.70}]',
  '[{"ticker":"AMZN","changePct":125.26},{"ticker":"MU","changePct":65.88},{"ticker":"NVDA","changePct":21.42}]',
  '[{"ticker":"IVV","changePct":-35.99},{"ticker":"CRM","changePct":-100},{"ticker":"ADBE","changePct":-99.9}]',
  'Risk Parity Beta / Alpha-Beta Separation',
  'Risk Parity balances risk across equities (19%), bonds (47%), and commodities (34%) by dollar weight. Leverages low-vol assets 1.5–2× via futures. Pure Alpha runs 30–40 uncorrelated macro positions.',
  'All Weather 10% vol target; Pure Alpha +14% annualized', 'violet'),

('citadel', 'Citadel Advisors', 'Kenneth C. Griffin', 'Q1 2026', 155.17, 4373,
  '[{"sector":"Software & Services","pct":16.09},{"sector":"Hardware Technology","pct":12.75},{"sector":"Banking & Finance","pct":10.18}]',
  '[{"ticker":"NVDA","name":"NVIDIA","valueB":4.64,"pct":2.99},{"ticker":"AMZN","name":"Amazon","valueB":3.77,"pct":2.43},{"ticker":"MU","name":"Micron","valueB":2.29,"pct":1.48}]',
  '[{"ticker":"AMG","changePct":0.012},{"ticker":"FCN","changePct":0.008}]',
  '[{"ticker":"MKL","changePct":-0.268},{"ticker":"MHK","changePct":-0.126}]',
  'Multi-Strategy Hedge Fund / Statistical Arbitrage',
  '4,373 positions across equities, derivatives, fixed income, and commodities. Quantitative statistical arbitrage, pairs trading, and event-driven strategies.',
  'Wellington fund ~24% net annualized', 'orange'),

('renaissance', 'Renaissance Technologies', 'Jim Simons', 'Q1 2026', 63.93, 3213,
  '[{"sector":"Software & Services","pct":17.16},{"sector":"Pharma & Biotech","pct":10.68},{"sector":"Hardware Technology","pct":10.20}]',
  '[{"ticker":"MU","name":"Micron Technology","valueB":1.62,"pct":2.54},{"ticker":"SNDK","name":"Sandisk","valueB":1.18,"pct":1.85},{"ticker":"UTHR","name":"United Therapeutics","valueB":1.02,"pct":1.59}]',
  '[{"ticker":"CLPR","changePct":4.45},{"ticker":"GridAI","changePct":3.62}]',
  '[{"ticker":"RYTM","changePct":-12.84},{"ticker":"OPEN","changePct":-2.85}]',
  'Systematic Quantitative / Statistical Arbitrage',
  'Medallion Fund uses proprietary mathematical models. ~3,200 positions — pure algorithmic execution, zero discretion.',
  'Medallion: +66% gross annualized (30 years)', 'emerald'),

('fisheri', 'Fisher Investments', 'Ken Fisher', 'Q1 2026', 292.09, 817,
  '[{"sector":"Software & Services","pct":18.55},{"sector":"Banking & Finance","pct":17.32},{"sector":"Hardware Technology","pct":15.11}]',
  '[{"ticker":"NVDA","name":"NVIDIA","valueB":19.07,"pct":6.53},{"ticker":"AAPL","name":"Apple","valueB":17.43,"pct":5.97},{"ticker":"GOOGL","name":"Alphabet","valueB":14.96,"pct":5.12}]',
  '[{"ticker":"MTN","changePct":1.45},{"ticker":"PFE","changePct":0.93}]',
  '[{"ticker":"AMMO","changePct":-1.10},{"ticker":"JHG","changePct":-1.10}]',
  'Broadly Diversified Growth / Global Macro',
  'Top-down macro framework across 817 global equities. Identifies 3–5 year market cycles, overweights secular growth sectors.',
  'Largest independent RIA globally', 'cyan'),

('baillie-gifford', 'Baillie Gifford & Company', 'James Anderson / Tom Slater', 'Q1 2026', 106.31, 274,
  '[{"sector":"Software & Services","pct":55.24},{"sector":"Hardware Technology","pct":10.77},{"sector":"Manufacturing","pct":5.23}]',
  '[{"ticker":"NVDA","name":"NVIDIA","valueB":8.77,"pct":8.25},{"ticker":"AMZN","name":"Amazon","valueB":7.48,"pct":7.04},{"ticker":"MELI","name":"MercadoLibre","valueB":5.38,"pct":5.06}]',
  '[{"ticker":"MMYT","changePct":10.39},{"ticker":"Merlin","changePct":2.37}]',
  '[{"ticker":"TTD","changePct":-4.71},{"ticker":"CPNG","changePct":-1.37}]',
  'Structural Growth / Mid-to-Long Horizon',
  '55%+ in software/services. 5–10 year conviction holds in companies creating new industries.',
  'Scottish Mortgage Trust: 10× in 10 years (2010-2020)', 'teal'),

('point72', 'Point72 Asset Management', 'Steven A. Cohen', 'Q1 2026', 71.00, 1952,
  '[{"sector":"Software & Services","pct":16.94},{"sector":"Hardware Technology","pct":16.40},{"sector":"Pharma & Biotech","pct":8.68}]',
  '[{"ticker":"NVDA","name":"NVIDIA","valueB":2.15,"pct":3.03},{"ticker":"TSM","name":"TSMC","valueB":1.89,"pct":2.66},{"ticker":"AMZN","name":"Amazon","valueB":1.40,"pct":1.97}]',
  '[]', '[]',
  'Multi-Manager Equity Long / Short',
  'Multi-PM pod structure — each PM runs independent book. Sector specialists in healthcare, tech, consumer.',
  '~20% gross annualized; SAC Capital era record', 'purple'),

('sands-capital', 'Sands Capital Management', 'Frank Sands', 'Q1 2026', 28.28, 67,
  '[{"sector":"Software & Services","pct":45.81},{"sector":"Hardware Technology","pct":29.43},{"sector":"Manufacturing","pct":3.36}]',
  '[{"ticker":"NVDA","name":"NVIDIA","valueB":3.89,"pct":13.77},{"ticker":"TSM","name":"TSMC","valueB":2.37,"pct":8.38},{"ticker":"GOOGL","name":"Alphabet","valueB":1.96,"pct":6.94}]',
  '[{"ticker":"BE","changePct":0.63},{"ticker":"CRS","changePct":0.41}]',
  '[{"ticker":"LRCX","changePct":-0.83},{"ticker":"SOT","changePct":-0.61}]',
  'Concentrated Institutional Growth',
  '67 stocks — highly concentrated in high-growth technology. 5–7 year holding horizon.',
  'Global Growth Fund: top decile 10-year performance', 'indigo'),

('scion', 'Scion Asset Management', 'Michael Burry', 'Q3 2025', 1.38, 8,
  '[{"sector":"Deep Value Contrarian","pct":60.0},{"sector":"Bearish Put Options","pct":40.0}]',
  '[{"ticker":"PLTR","name":"Palantir Puts $50 strike","valueB":0.092,"pct":6.67}]',
  '[{"ticker":"PLTR Puts","changePct":100}]', '[]',
  'Deep Contrarian Value / Short Overhyped Assets',
  'Concentrates in 5–8 high-conviction positions. Shorts narrative bubbles using put options. $9.2M in 50,000 Palantir put contracts at $50 strike.',
  '2008 Big Short: $700M+ profit', 'red')
ON CONFLICT (id) DO UPDATE SET
  portfolio_value_b = EXCLUDED.portfolio_value_b,
  top_holdings = EXCLUDED.top_holdings,
  recent_buys = EXCLUDED.recent_buys,
  recent_sells = EXCLUDED.recent_sells,
  reporting_period = EXCLUDED.reporting_period,
  updated_at = NOW();

-- ─── Indian Superinvestors ─────────────────────────────────────
INSERT INTO india_superinvestors (id, name, firm, portfolio_inr_cr, stock_count, top_holdings, framework, entry_discipline, exit_rule, sizing, color)
VALUES
('jhunjhunwala', 'Rakesh Jhunjhunwala', 'Rare Enterprises', 52241.42, 27,
  '[{"ticker":"TITAN","name":"Titan Company","valueCr":19989.20,"pct":38.26},{"ticker":"IKS","name":"Inventurus Knowledge","valueCr":13888.10,"pct":26.58},{"ticker":"STARHEALTH","name":"Star Health Insurance","valueCr":4820.10,"pct":9.23},{"ticker":"CONCORD","name":"Concord Biotech","valueCr":2886.80,"pct":5.53},{"ticker":"METROBRAND","name":"Metro Brands","valueCr":2796.60,"pct":5.35}]',
  'Dual-brain: Long-term investing brain for quality compounders + Short-term trading brain for trend-following. 40% win rate on trades — capital protected via strict stop-losses.',
  'Investing: High-conviction fundamentals, long-term consumption runways. Trading: Strictly trend-following — buy in uptrend, sell when share enters downtrend.',
  'Exit immediately if pre-calculated technical stop-loss is triggered. NEVER average down on losing trades.',
  'Pyramiding on upward-trending positions. Concentrated conviction bets for core holdings.',
  'green'),

('vijay-kedia', 'Vijay Kishanlal Kedia', 'Kedia Securities', 1348.83, 15,
  '[{"ticker":"ATULAUTO","name":"Atul Auto","valueCr":180,"pct":13.3},{"ticker":"TAC","name":"TAC Infosec","valueCr":156,"pct":11.6},{"ticker":"NEULANDLAB","name":"Neuland Labs","valueCr":142,"pct":10.5},{"ticker":"TEJASNET","name":"Tejas Networks","valueCr":128,"pct":9.5},{"ticker":"ELECON","name":"Elecon Engineering","valueCr":114,"pct":8.5}]',
  'SMILE Framework: Small size + Medium experience + Large aspiration + Extra-large market potential. Identifies small-caps with 100× potential over 10-15 years.',
  'Identifies companies with strong management integrity, expanding markets, and compounding potential. Buys before market recognizes the opportunity.',
  'Evaluate fundamentals quarterly. Exit if structural alignment fails or execution gaps emerge.',
  'Concentrated multi-year holds (10–15 year horizon). Ignores short-term fluctuations.',
  'orange'),

('ashish-kacholia', 'Ashish Kacholia', 'Lucky Investment Managers', 2783.80, 22,
  '[{"ticker":"AJANTPHARM","name":"Ajanta Pharma","valueCr":320,"pct":11.5},{"ticker":"MASTEK","name":"Mastek Ltd","valueCr":280,"pct":10.1},{"ticker":"POLYCAB","name":"Polycab India","valueCr":260,"pct":9.3},{"ticker":"KPITTECH","name":"KPIT Technologies","valueCr":220,"pct":7.9},{"ticker":"ATULAUTO","name":"Atul Auto","valueCr":190,"pct":6.8}]',
  'GARP (Growth at Reasonable Price). Focus on low P/E, low D/E, stable ROE, positive FCF. Known as The Big Whale for small-cap influence.',
  'Screen for: P/E below sector avg + D/E < 0.3 + ROE > 15% + positive FCF + promoter holding > 40%.',
  'Systematically exit if quarterly earnings show structural underperformance (2+ consecutive misses).',
  'Diversifies across sectors. Typical position: 5–10% per stock.',
  'blue'),

('pabrai', 'Mohnish Pabrai', 'Pabrai Investment Funds', 153.47, 6,
  '[{"ticker":"RAIN","name":"Rain Industries","valueCr":52,"pct":33.9},{"ticker":"EDELWEISS","name":"Edelweiss Financial","valueCr":48,"pct":31.3},{"ticker":"SUNTECK","name":"Sunteck Realty","valueCr":38,"pct":24.8}]',
  'Spawner Framework: Adjacent Spawners, Embryonic Spawners, Cloner Spawners, Non-Adjacent Spawners. Targets businesses that create and scale new divisions.',
  'Distress-driven value. Targets low-risk + high-uncertainty situations. Market confuses uncertainty with risk. Never buys IPOs or startups.',
  'Exit when valuations reach fair value or structural tailwinds dissipate.',
  'Extreme concentration (5–10 holdings). Single 5× spawner covers multiple duds.',
  'purple')
ON CONFLICT (id) DO UPDATE SET
  portfolio_inr_cr = EXCLUDED.portfolio_inr_cr,
  top_holdings = EXCLUDED.top_holdings,
  framework = EXCLUDED.framework,
  updated_at = NOW();

-- ─── UAE Dividend Stocks ─────────────────────────────────────
INSERT INTO uae_dividend_stocks (ticker, exchange, name, sector, market_cap_aed, dividend_yield, avg_daily_vol_shares, sovereign_holder, color)
VALUES
('ADNOCGAS',   'ADX', 'ADNOC Gas',                  'Energy',           263.26, 5.00, 116.07, 'ADNOC State Holding',           'orange'),
('FAB',        'ADX', 'First Abu Dhabi Bank',        'Finance',          185.48, 4.76,  15.57, 'Abu Dhabi Government / State',  'blue'),
('EMIRATESNBD','DFM', 'Emirates NBD Bank',           'Finance',          174.46, 3.62,   5.71, 'Investment Corp of Dubai (ICD)', 'teal'),
('EAND',       'ADX', 'Emirates Telecom (e&)',       'Communications',   156.89, 4.99,  19.24, 'Federal Government of UAE',      'green'),
('DEWA',       'DFM', 'Dubai Electricity & Water',   'Utilities',        130.50, 4.75,  38.37, 'Government of Dubai',            'cyan'),
('ADCB',       'ADX', 'Abu Dhabi Commercial Bank',   'Finance',          108.34, 4.60,  15.69, 'Abu Dhabi Investment Council',   'indigo'),
('EMAAR',      'DFM', 'Emaar Properties',            'Real Estate',      104.12, 8.49,  47.97, 'Institutional & Public',         'yellow'),
('ADNOCDRILL', 'ADX', 'ADNOC Drilling',              'Industrial',        95.36, 4.15,  50.24, 'ADNOC Sponsor Group',            'orange'),
('ADIB',       'ADX', 'Abu Dhabi Islamic Bank',      'Finance',           74.31, 4.74,   7.18, 'Local Sovereign / Shariah',      'emerald'),
('BOROUGE',    'ADX', 'Borouge PLC',                 'Process Industry',  76.05, 6.40,  11.52, 'ADNOC / Borealis JV',            'violet'),
('EMAARDEV',   'DFM', 'Emaar Development',           'Real Estate',       57.76, 6.93,   9.80, 'Emaar Properties Parent',        'yellow'),
('DU',         'DFM', 'Emirates Integrated Telecom', 'Communications',    50.77, 5.71,   3.56, 'Federal Sovereign Allocators',   'cyan'),
('DIB',        'DFM', 'Dubai Islamic Bank',          'Finance',           53.48, 4.73,  11.21, 'Government of Dubai',            'teal'),
('ADNOCDIST',  'ADX', 'ADNOC Distribution',         'Retail Trade',      49.13, 5.23,  19.56, 'ADNOC Parent Group',             'orange'),
('AIRARABIA',  'DFM', 'Air Arabia',                  'Transportation',    22.77, 6.15,  14.46, 'Public & Institutional',         'blue')
ON CONFLICT (ticker) DO UPDATE SET
  market_cap_aed = EXCLUDED.market_cap_aed,
  dividend_yield = EXCLUDED.dividend_yield,
  avg_daily_vol_shares = EXCLUDED.avg_daily_vol_shares,
  updated_at = NOW();

-- ─── Strategy Exact Parameters ────────────────────────────────
INSERT INTO strategy_exact_params (name, regime, entry_trigger, exit_trigger, hard_stop_loss, trailing_stop, volume_rule, position_sizing, target_rr, target_sharpe)
VALUES
('Mark Minervini SEPA (VCP)', 'US Equities',
 'Buy-stop order 1%–2% above the consolidation pivot point. Triggered only on breakout — prevents capital lock-up on false consolidations.',
 'Technical weakness or 50-day SMA crossover. At +20–25% gain: sell 50% to lock profits, trail remaining half.',
 '7%–8% below entry price OR just below the low of the final tight contraction',
 '50-day SMA trailing once +20–25% gain achieved. 10% trailing stop as backup.',
 'Breakout day volume 140%–150%+ of 50-day average. Pullbacks: volume drops to 40–60% of average.',
 'Size each position to keep total trade risk within 1% of total portfolio capital',
 '3:1 minimum; VCP setups typically 4:1 to 6:1', '≥1.5 on active trades'),

('Dan Zanger Momentum Breakout', 'US Equities',
 'Breakout of short-term continuation patterns: flags, pennants, cup-and-handle on high volume.',
 'Exit 50% after first profit target. Trail remaining 50% with upward-adjusting stop.',
 '8% below purchase price — absolute hard stop, no exceptions',
 '8%–10% trailing on winning positions, adjusted upward as price moves.',
 'Daily breakout volume 100%+ above 20-day average (2× normal).',
 'Maximum 1% of total portfolio capital on any single trade',
 '3:1 to 5:1', NULL),

('Paul Tudor Jones Global Macro', 'Global Futures, Debt, FX',
 'Macro trend validated by price action plus technical breakout confirmation.',
 'Crossover of key indicators OR time-based stops if thesis not playing out.',
 'Capital risk hard-capped at 1% of total portfolio assets per trade',
 'Dynamic stops adjusted relative to market volatility (ATR-based).',
 'Volume analysis used to confirm macro-trend validity.',
 'Hard 1% asset risk limit per trade',
 '5:1 minimum', NULL),

('William O''Neil CAN SLIM', 'US Equities',
 'Breakout from cup-with-handle consolidation 7+ weeks. Buy within 5% of the exact pivot point.',
 'Structural breakout failure or market distribution phase. 20–25% profit if reached in 3 weeks.',
 '7%–8% below the buy point — most critical rule in CAN SLIM',
 'Tightened to 2%–3% in volatile regimes. Normal: trail at 10-week MA.',
 'Breakout day volume 40%–50% above average.',
 'Sized relative to fund volatility and market conditions',
 '3:1 minimum; 8-week hold if +20% in 3 weeks', NULL),

('Richard Dennis Turtle System 1', 'Global Commodities & Futures',
 'Price closes above the highest 20-day high (Donchian Channel breakout).',
 'Price crosses below the 10-day low extreme.',
 '2× the 20-day ATR below entry price (volatility-normalized)',
 'Trails upward with each new pyramid unit added at ½ ATR moves.',
 'Breakout day volume must exceed the 20-day average.',
 '1% of total equity per unit using 20-day ATR normalization. Max 4 units per market.',
 'Variable; edge from large trending moves (10:1 to 20:1)', '~0.7 multi-year'),

('Richard Dennis Turtle System 2', 'Global Commodities & Futures',
 'Price closes above the highest 55-day high (longer-term trend breakout).',
 'Price crosses below the 20-day low extreme.',
 '2× the 20-day ATR below entry (same volatility-normalized formula)',
 'Trails upward with each new pyramid unit at ½ ATR. Wider trailing for longer trends.',
 'Breakout day volume must exceed the 20-day average.',
 '1% of total equity per unit using 20-day ATR normalization',
 'Higher than System 1 — catches multi-month major trends', '~0.7 to 1.0'),

('Warren Buffett Economic Moat', 'Global Large-Cap Equities',
 'Trades at 25%+ discount to calculated intrinsic value (DCF + owner earnings). Margin of safety required.',
 'Fundamental change in competitive moat: ROCE declines, margins compress, debt rises, integrity issues.',
 'Fundamental stop only — thesis-driven not price-driven. No mechanical price stop.',
 'No price trailing stop. Hold forever if business keeps compounding.',
 'Not applicable — enters over weeks/months regardless of volume.',
 'Sized by capital conviction. Highly concentrated (3 stocks = 52% of Berkshire).',
 'Decades of compounding at 20%+ CAGR', 'N/A — long horizon'),

('Ray Dalio Risk Parity All Weather', 'Multi-Asset Global Sleeves',
 'Correlation regime matching and macroeconomic cycle tracking. Rebalance when volatilities shift.',
 'Diversification balance disrupted by correlation shifts or inflation regime change.',
 'Diversification IS the stop-loss: 4 macro seasons (growth up/down × inflation up/down)',
 'Systematic rebalancing to target risk weights — volatility-contribution based, not price.',
 'Macro liquidity cycle monitoring. Executes via futures/swaps for efficient beta.',
 'Leverages bonds 1.5–2× via futures. Total notional 150–200% of AUM.',
 'N/A — targets 10% portfolio volatility', 'All Weather ~0.7; Pure Alpha ~1.4');

-- ─── UAE Sovereign Funds ─────────────────────────────────────
INSERT INTO uae_sovereign_funds (name, estimated_aum, focus, strategy)
VALUES
('Abu Dhabi Investment Authority (ADIA)', '$1.0T+',
 'Global diversification — equities, bonds, real estate, alternatives, infrastructure',
 'Long-horizon passive + active overlay. Top-3 largest sovereign wealth fund globally.'),
('Mubadala Investment Company', '$300B+',
 'Strategic sectors: tech, aerospace, renewables, healthcare, infrastructure',
 'Government-backed strategic investments in non-oil GDP diversification.'),
('ADQ', '$110B',
 'Energy (TAQA), Food security (Silal), Healthcare, Transport (AD Ports, Etihad)',
 'Build national champions and strategic supply chains across 4 sectors.');

-- ─── Waha Capital Funds ──────────────────────────────────────
INSERT INTO waha_funds (name, aum, inception, cumulative_return, focus, strategy)
VALUES
('Waha Emerging Markets Credit Fund', '$1.56B', 2012, '307.6%',
 'Sovereign and corporate emerging market credit (CEEMEA)',
 'Absolute return credit'),
('Waha MENA Equity Fund', '$944M', 2014, '410.6%',
 'Long/short equity on listed MENA equities',
 'Regional equity alpha capture'),
('Waha Islamic Income Fund', 'N/D', 2020, '37.5%',
 'Shariah-compliant assets and global sukuk',
 'Islamic income generation');
