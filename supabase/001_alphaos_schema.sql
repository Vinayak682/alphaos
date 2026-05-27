-- ============================================================
-- AlphaOS — Supabase Schema
-- Run this in Supabase SQL Editor → "New Query"
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── US Institutions (13F filings) ───────────────────────────
CREATE TABLE IF NOT EXISTS us_institutions (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  manager          TEXT NOT NULL,
  reporting_period TEXT NOT NULL DEFAULT 'Q1 2026',
  portfolio_value_b DECIMAL(10,2),
  unique_stocks    INT,
  top_sectors      JSONB DEFAULT '[]',
  top_holdings     JSONB DEFAULT '[]',
  recent_buys      JSONB DEFAULT '[]',
  recent_sells     JSONB DEFAULT '[]',
  strategy         TEXT,
  strategy_detail  TEXT,
  performance      TEXT,
  color            TEXT DEFAULT 'blue',
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indian Superinvestors ───────────────────────────────────
CREATE TABLE IF NOT EXISTS india_superinvestors (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  firm                  TEXT,
  portfolio_inr_cr      DECIMAL(12,2),
  stock_count           INT,
  top_holdings          JSONB DEFAULT '[]',
  framework             TEXT,
  entry_discipline      TEXT,
  exit_rule             TEXT,
  sizing                TEXT,
  color                 TEXT DEFAULT 'green',
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── UAE Dividend Stocks ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS uae_dividend_stocks (
  ticker                TEXT PRIMARY KEY,
  exchange              TEXT CHECK (exchange IN ('ADX','DFM')),
  name                  TEXT NOT NULL,
  sector                TEXT,
  market_cap_aed        DECIMAL(10,2),   -- billions AED
  dividend_yield        DECIMAL(5,2),    -- %
  avg_daily_vol_shares  DECIMAL(10,2),   -- millions
  sovereign_holder      TEXT,
  color                 TEXT DEFAULT 'blue',
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Strategies ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS strategies (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  trader           TEXT,
  markets          TEXT[] DEFAULT '{}',
  style            TEXT CHECK (style IN ('SCALP','DAY','SWING','POSITION','QUANT','MACRO','HFT')),
  risk_level       TEXT CHECK (risk_level IN ('LOW','MEDIUM','HIGH','QUANT')),
  description      TEXT,
  key_principles   TEXT[] DEFAULT '{}',
  entry            JSONB DEFAULT '{}',
  exit_rules       JSONB DEFAULT '{}',
  risk             JSONB DEFAULT '{}',
  performance      JSONB DEFAULT '{}',
  equity_curve     JSONB DEFAULT '[]',
  tags             TEXT[] DEFAULT '{}',
  color            TEXT DEFAULT 'blue',
  status           TEXT CHECK (status IN ('running','paused','backtesting')) DEFAULT 'paused',
  pnl              DECIMAL(8,2) DEFAULT 0,
  signals          INT DEFAULT 0,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Strategy Exact Parameters ───────────────────────────────
CREATE TABLE IF NOT EXISTS strategy_exact_params (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  regime           TEXT,
  entry_trigger    TEXT,
  exit_trigger     TEXT,
  hard_stop_loss   TEXT,
  trailing_stop    TEXT,
  volume_rule      TEXT,
  position_sizing  TEXT,
  target_rr        TEXT,
  target_sharpe    TEXT,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── UAE Sovereign Funds ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS uae_sovereign_funds (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  estimated_aum    TEXT,
  focus            TEXT,
  strategy         TEXT,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Waha Capital Funds ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS waha_funds (
  id                  SERIAL PRIMARY KEY,
  name                TEXT NOT NULL,
  aum                 TEXT,
  inception           INT,
  cumulative_return   TEXT,
  focus               TEXT,
  strategy            TEXT,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Market Signals (live trading signals) ───────────────────
CREATE TABLE IF NOT EXISTS market_signals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol      TEXT NOT NULL,
  market      TEXT CHECK (market IN ('US','INDIA','UAE','CRYPTO')),
  action      TEXT CHECK (action IN ('BUY','SELL','CLOSE','WATCH')),
  price       DECIMAL(18,6),
  strategy_id TEXT REFERENCES strategies(id),
  confidence  INT CHECK (confidence BETWEEN 0 AND 100),
  entry_price DECIMAL(18,6),
  stop_loss   DECIMAL(18,6),
  target_1    DECIMAL(18,6),
  target_2    DECIMAL(18,6),
  notes       TEXT,
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security (public read, service role write) ─────
ALTER TABLE us_institutions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE india_superinvestors   ENABLE ROW LEVEL SECURITY;
ALTER TABLE uae_dividend_stocks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies             ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_exact_params  ENABLE ROW LEVEL SECURITY;
ALTER TABLE uae_sovereign_funds    ENABLE ROW LEVEL SECURITY;
ALTER TABLE waha_funds             ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_signals         ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (public data)
CREATE POLICY "Public read institutions"       ON us_institutions       FOR SELECT USING (true);
CREATE POLICY "Public read india investors"    ON india_superinvestors   FOR SELECT USING (true);
CREATE POLICY "Public read UAE stocks"         ON uae_dividend_stocks    FOR SELECT USING (true);
CREATE POLICY "Public read strategies"         ON strategies             FOR SELECT USING (true);
CREATE POLICY "Public read exact params"       ON strategy_exact_params  FOR SELECT USING (true);
CREATE POLICY "Public read sovereign funds"    ON uae_sovereign_funds    FOR SELECT USING (true);
CREATE POLICY "Public read waha funds"         ON waha_funds             FOR SELECT USING (true);
CREATE POLICY "Public read signals"            ON market_signals         FOR SELECT USING (true);

-- Service role can write (for your regular updates)
CREATE POLICY "Service write institutions"     ON us_institutions       FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write india investors"  ON india_superinvestors   FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write UAE stocks"       ON uae_dividend_stocks    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write strategies"       ON strategies             FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write exact params"     ON strategy_exact_params  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write sovereign funds"  ON uae_sovereign_funds    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write waha funds"       ON waha_funds             FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write signals"          ON market_signals         FOR ALL USING (auth.role() = 'service_role');

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_signals_symbol   ON market_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_signals_market   ON market_signals(market);
CREATE INDEX IF NOT EXISTS idx_signals_active   ON market_signals(active);
CREATE INDEX IF NOT EXISTS idx_signals_created  ON market_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_strategies_market ON strategies USING GIN(markets);

-- ─── Updated_at trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_us_inst_updated       BEFORE UPDATE ON us_institutions      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_india_inv_updated     BEFORE UPDATE ON india_superinvestors  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_uae_stocks_updated    BEFORE UPDATE ON uae_dividend_stocks   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_strategies_updated    BEFORE UPDATE ON strategies            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_exact_params_updated  BEFORE UPDATE ON strategy_exact_params FOR EACH ROW EXECUTE FUNCTION update_updated_at();
