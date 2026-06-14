-- AlphaOS — Live Signals Table
-- Stores AI-generated trading signals from the morning brain run
-- Run: supabase db push or paste into Supabase SQL editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS alpha_signals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticker       TEXT NOT NULL,
  exchange     TEXT NOT NULL,                              -- NASDAQ / NSE / ADX / DFM / BINANCE
  market       TEXT CHECK (market IN ('US','INDIA','UAE','CRYPTO')) NOT NULL,
  action       TEXT CHECK (action IN ('BUY','SELL','HOLD','EXIT')) NOT NULL,
  entry        DECIMAL(18,4),
  sl           DECIMAL(18,4),
  t1           DECIMAL(18,4),
  t2           DECIMAL(18,4),
  rr           DECIMAL(5,2),
  confidence   INT CHECK (confidence BETWEEN 0 AND 100) NOT NULL,
  risk         INT CHECK (risk BETWEEN 0 AND 100) NOT NULL,
  currency     TEXT NOT NULL DEFAULT '$',
  rationale    TEXT,
  news_item    TEXT,

  -- Confidence component breakdown (adds to 100%)
  score_technical    DECIMAL(5,2),   -- 0-30
  score_news         DECIMAL(5,2),   -- 0-25
  score_smart_money  DECIMAL(5,2),   -- 0-20
  score_risk         DECIMAL(5,2),   -- 0-15 (inverse risk contribution)
  score_regime       DECIMAL(5,2),   -- 0-10

  -- Research agent outputs
  research_news        TEXT,          -- News agent synthesis
  research_technical   TEXT,          -- Technical agent summary
  research_smart_money TEXT,          -- Smart money agent findings
  research_regime      TEXT,          -- Market regime classification

  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  run_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  run_label    TEXT DEFAULT 'morning'  -- morning / midday / eod
);

-- Index for fast "today's signals" query
CREATE INDEX IF NOT EXISTS idx_alpha_signals_run_date ON alpha_signals (run_date DESC, confidence DESC);
CREATE INDEX IF NOT EXISTS idx_alpha_signals_ticker   ON alpha_signals (ticker);

-- RLS: read-only for anon
ALTER TABLE alpha_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON alpha_signals FOR SELECT USING (true);

-- Insert today's signals (seed — matches existing hardcoded data)
INSERT INTO alpha_signals (
  ticker, exchange, market, action, entry, sl, t1, t2, rr, confidence, risk, currency,
  rationale, news_item,
  score_technical, score_news, score_smart_money, score_risk, score_regime
) VALUES
  ('NVDA',     'NASDAQ', 'US',    'BUY',  918.00, 898.00, 960.00,  1005.00, 2.1, 88, 28, '$',
   'RSI breakout from 8-week consolidation zone with institutional accumulation confirmed via 13F. MACD crossover aligned with positive earnings revision momentum.',
   'Jensen Huang confirms next-gen Blackwell Ultra chip ahead of schedule — HIGH impact',
   26.4, 22.0, 18.0, 13.2, 8.4),
  ('MSFT',     'NASDAQ', 'US',    'BUY',  418.00, 403.00, 445.00,   468.00, 2.4, 85, 24, '$',
   'Azure AI revenue growing 35% YoY. Copilot enterprise adoption exceeding expectations. Massive institutional inflows from Citadel and D.E. Shaw detected in recent 13F.',
   'Azure AI workloads up 35% — Microsoft raises full-year guidance — HIGH impact',
   25.5, 21.25, 17.0, 12.75, 8.5),
  ('FAB',      'ADX',    'UAE',   'BUY',  14.60,  14.00,  15.80,    16.50, 2.5, 84, 34, 'AED',
   'First Abu Dhabi Bank showing strong support at 14.00 with DFM major institutional buying of 8.2M shares. Oil price tailwind supports UAE banking NIM expansion.',
   'UAE GDP grows 4.3% Q1 2026, FAB reports record net profit — HIGH impact',
   25.2, 21.0, 16.8, 12.6, 8.4),
  ('ADNOCGAS', 'ADX',    'UAE',   'BUY',  4.32,   4.10,   4.75,     5.10, 2.0, 82, 27, 'AED',
   'ADNOC Gas dividend yield at 5.8% with LNG export contract renewal driving 22% revenue growth. Sovereign fund ADIA has been accumulating over 4 weeks.',
   'ADNOC Gas secures 10-year LNG contract with Japanese buyers — HIGH impact',
   24.6, 20.5, 16.4, 12.3, 8.2),
  ('HDFCBANK', 'NSE',    'INDIA', 'BUY',  1640.00,1580.00,1750.00, 1820.00, 1.9, 81, 41, '₹',
   'HDFC Bank consolidating above key EMA50 for 3 weeks. RBI rate hold supportive of NIMs. FII net buying ₹2,400Cr in last 5 sessions with no insider selling flagged.',
   'RBI holds repo rate at 6.25%, governor signals easing bias — MEDIUM impact',
   24.3, 20.25, 16.2, 12.15, 8.1),
  ('EMAAR',    'DFM',    'UAE',   'BUY',  8.92,   8.50,   9.60,    10.20, 2.2, 79, 31, 'AED',
   'Emaar Properties at 6-month support level with volume surge. Dubai real estate transaction volumes up 31% YoY. Geopolitical risk premium unwinding as regional tensions ease.',
   'Dubai real estate volumes hit 5-year high, Emaar sales up 28% — HIGH impact',
   23.7, 19.75, 15.8, 11.85, 7.9),
  ('TSLA',     'NASDAQ', 'US',    'SELL', 182.00, 195.00, 162.00,   148.00, 1.8, 76, 58, '$',
   'Tesla breaking below 50-day EMA on above-average volume. China EV market share fell to 11% from 18% YoY. Institutional de-risking detected via 13F delta analysis.',
   'Tesla China market share hits new low as BYD dominates — HIGH impact',
   22.8, 19.0, 15.2, 11.4, 7.6),
  ('TCS',      'NSE',    'INDIA', 'HOLD', 3820.00,3650.00,4050.00, 4200.00, 1.7, 73, 29, '₹',
   'TCS in healthy uptrend above EMA200. Q4 results beat consensus by 4.2%. Deal pipeline guidance remains strong. Awaiting deal win announcements before adding.',
   'TCS wins $500M BFSI deal — management guides for strong FY27 — MEDIUM impact',
   21.9, 18.25, 14.6, 10.95, 7.3),
  ('RELIANCE', 'NSE',    'INDIA', 'EXIT', 2944.00,NULL,   NULL,     NULL, NULL, 72, 62, '₹',
   'RSI at 74 (overbought territory). Distribution pattern forming on daily chart. SEBI insider disclosure shows promoter selling ₹340Cr worth of shares last week.',
   'SEBI flags insider trading disclosure — promoter sold ₹340Cr — HIGH impact',
   21.6, 18.0, 14.4, 10.8, 7.2),
  ('AAPL',     'NASDAQ', 'US',    'HOLD', 189.00, 181.00, 198.00,   210.00, 1.6, 70, 38, '$',
   'Apple trading in tight range ahead of WWDC. AI features announcement is a pending catalyst. Institutional holdings unchanged. Hold existing position, avoid adding at current levels.',
   'WWDC 2026 scheduled for June 9 — AI model integration expected — MEDIUM impact',
   21.0, 17.5, 14.0, 10.5, 7.0)
ON CONFLICT DO NOTHING;
