-- Migration 003: Intelligence Layer
-- Tables: signals_generated, news_articles, economic_events,
--          block_deals, institutional_holdings, company_info
-- Run on: Supabase project mxwrfihmfmlhtmynpal

-- ────────────────────────────────────────────────────────────────────────────
-- 1. signals_generated
--    One row per AI-generated BUY/SELL/HOLD/EXIT signal per symbol per day.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.signals_generated (
  id                BIGSERIAL PRIMARY KEY,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  symbol            TEXT        NOT NULL,
  market            TEXT        NOT NULL CHECK (market IN ('US','INDIA','UAE','CRYPTO')),
  action            TEXT        NOT NULL CHECK (action IN ('BUY','SELL','HOLD','EXIT')),
  confidence        NUMERIC(5,2) NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  risk_score        NUMERIC(5,2) NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  entry_price       NUMERIC(18,4),
  stop_loss         NUMERIC(18,4),
  target_price      NUMERIC(18,4),
  risk_reward       NUMERIC(6,2),
  -- Confidence breakdown (weights sum: 0.30+0.25+0.20+0.15+0.10 = 1.0)
  technical_score   NUMERIC(5,2),
  sentiment_score   NUMERIC(5,2),
  smart_money_score NUMERIC(5,2),
  risk_score_raw    NUMERIC(5,2),
  regime_score      NUMERIC(5,2),
  -- Rationale fields
  rationale         TEXT,
  news_catalyst     TEXT,
  strategy_tag      TEXT,
  -- Status
  is_active         BOOLEAN NOT NULL DEFAULT true,
  triggered_at      TIMESTAMPTZ DEFAULT now(),
  expires_at        TIMESTAMPTZ,
  -- Source
  brain_run_id      TEXT,
  model_version     TEXT DEFAULT 'claude-sonnet-4-6'
);

CREATE INDEX IF NOT EXISTS idx_signals_symbol ON public.signals_generated (symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_market  ON public.signals_generated (market, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_action  ON public.signals_generated (action, is_active);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. news_articles
--    AI-scored news items from Marketaux / Finnhub / custom sources.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.news_articles (
  id              BIGSERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at    TIMESTAMPTZ,
  source          TEXT        NOT NULL,
  headline        TEXT        NOT NULL,
  summary         TEXT,
  url             TEXT,
  market          TEXT        NOT NULL CHECK (market IN ('US','INDIA','UAE','CRYPTO','GLOBAL')),
  tickers         TEXT[]      DEFAULT '{}',
  impact          TEXT        NOT NULL CHECK (impact IN ('HIGH','MEDIUM','LOW')),
  -- AI scoring
  sentiment       NUMERIC(4,2) CHECK (sentiment BETWEEN -1 AND 1),
  relevance_score NUMERIC(5,2) CHECK (relevance_score BETWEEN 0 AND 100),
  -- Deduplication
  content_hash    TEXT        UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_news_market      ON public.news_articles (market, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_impact      ON public.news_articles (impact, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_tickers     ON public.news_articles USING GIN (tickers);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. economic_events
--    US / India / UAE macro calendar events (earnings, FOMC, GDP, etc.)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.economic_events (
  id              BIGSERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_date      DATE        NOT NULL,
  event_time      TIME,
  timezone        TEXT        DEFAULT 'UTC',
  country         TEXT        NOT NULL,
  market          TEXT        NOT NULL CHECK (market IN ('US','INDIA','UAE','CRYPTO','GLOBAL')),
  category        TEXT        NOT NULL,  -- FOMC, GDP, CPI, EARNINGS, RBI, etc.
  event_name      TEXT        NOT NULL,
  impact          TEXT        NOT NULL CHECK (impact IN ('HIGH','MEDIUM','LOW')),
  forecast        TEXT,
  previous        TEXT,
  actual          TEXT,
  is_confirmed    BOOLEAN     NOT NULL DEFAULT false,
  related_tickers TEXT[]      DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_events_date   ON public.economic_events (event_date, impact);
CREATE INDEX IF NOT EXISTS idx_events_market ON public.economic_events (market, event_date);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. block_deals
--    NSE/BSE bulk deals and DFM block transactions (smart-money tracker).
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.block_deals (
  id              BIGSERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deal_date       DATE        NOT NULL,
  exchange        TEXT        NOT NULL,   -- NSE, BSE, DFM, ADX
  symbol          TEXT        NOT NULL,
  company_name    TEXT,
  client_name     TEXT,
  deal_type       TEXT        NOT NULL CHECK (deal_type IN ('BUY','SELL')),
  quantity        BIGINT      NOT NULL,
  trade_price     NUMERIC(18,4) NOT NULL,
  deal_value      NUMERIC(20,2),  -- quantity * price
  currency        TEXT        DEFAULT 'INR'
);

CREATE INDEX IF NOT EXISTS idx_block_symbol ON public.block_deals (symbol, deal_date DESC);
CREATE INDEX IF NOT EXISTS idx_block_date   ON public.block_deals (deal_date DESC, deal_type);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. institutional_holdings
--    US 13F quarterly filings + India superinvestor quarterly disclosures.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.institutional_holdings (
  id              BIGSERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  quarter         TEXT        NOT NULL,   -- e.g. '2026-Q1'
  filing_date     DATE,
  institution     TEXT        NOT NULL,
  market          TEXT        NOT NULL CHECK (market IN ('US','INDIA','UAE')),
  symbol          TEXT        NOT NULL,
  company_name    TEXT,
  shares          BIGINT,
  market_value    NUMERIC(20,2),
  portfolio_pct   NUMERIC(6,2),
  change_shares   BIGINT,       -- vs prior quarter (positive = bought, negative = sold)
  change_type     TEXT          CHECK (change_type IN ('NEW','INCREASED','DECREASED','SOLD')),
  currency        TEXT          DEFAULT 'USD'
);

CREATE INDEX IF NOT EXISTS idx_inst_institution ON public.institutional_holdings (institution, quarter);
CREATE INDEX IF NOT EXISTS idx_inst_symbol      ON public.institutional_holdings (symbol, quarter);
CREATE INDEX IF NOT EXISTS idx_inst_change      ON public.institutional_holdings (change_type, quarter);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. company_info
--    Static company metadata (sector, industry, description, logo).
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_info (
  id              BIGSERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  symbol          TEXT        NOT NULL UNIQUE,
  exchange        TEXT,
  market          TEXT        NOT NULL CHECK (market IN ('US','INDIA','UAE','CRYPTO')),
  company_name    TEXT        NOT NULL,
  sector          TEXT,
  industry        TEXT,
  description     TEXT,
  logo_url        TEXT,
  website         TEXT,
  country         TEXT,
  currency        TEXT,
  market_cap      NUMERIC(24,2),
  employees       INT,
  -- Fundamental ratios (refreshed quarterly)
  pe_ratio        NUMERIC(10,2),
  pb_ratio        NUMERIC(10,2),
  dividend_yield  NUMERIC(6,3),
  eps             NUMERIC(14,4),
  revenue_ttm     NUMERIC(24,2),
  net_income_ttm  NUMERIC(24,2)
);

CREATE INDEX IF NOT EXISTS idx_company_market ON public.company_info (market);
CREATE INDEX IF NOT EXISTS idx_company_sector ON public.company_info (sector);

-- ────────────────────────────────────────────────────────────────────────────
-- Row Level Security: enable but allow anon reads (public dashboard)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.signals_generated       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economic_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_deals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutional_holdings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_info            ENABLE ROW LEVEL SECURITY;

-- Allow anon SELECT on all tables (frontend uses anon key)
CREATE POLICY "anon_read_signals"       ON public.signals_generated       FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_news"          ON public.news_articles           FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_events"        ON public.economic_events         FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_block_deals"   ON public.block_deals             FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_inst"          ON public.institutional_holdings  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_company"       ON public.company_info            FOR SELECT TO anon USING (true);

-- Service role can write (morning brain Python backend uses service role key)
CREATE POLICY "service_write_signals"   ON public.signals_generated       FOR ALL  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_write_news"      ON public.news_articles           FOR ALL  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_write_events"    ON public.economic_events         FOR ALL  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_write_blocks"    ON public.block_deals             FOR ALL  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_write_inst"      ON public.institutional_holdings  FOR ALL  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_write_company"   ON public.company_info            FOR ALL  TO service_role USING (true) WITH CHECK (true);
