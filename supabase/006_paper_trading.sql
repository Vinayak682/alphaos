-- ============================================================================
-- AlphaOS — Migration 006: Paper Trading
--
-- WHY THIS FILE EXISTS
-- The paper_portfolios / paper_positions / paper_trade_log tables were
-- originally created by hand in the Supabase SQL editor and the DDL was never
-- committed. When project mxwrfiihmfmlhtmynpal was deleted, that schema was
-- lost — migrations 001-005 do NOT recreate it, so paper trading would fail
-- silently against a rebuilt database.
--
-- This migration is reverse-engineered from the columns that
-- src/app/api/paper-trades/route.ts and src/hooks/usePaperPortfolio.ts
-- actually read and write. Run it whenever you rebuild the database.
-- ============================================================================

-- ── Portfolios ──────────────────────────────────────────────────────────────
-- One row per user. The API does .eq("user_id", …).single(), so user_id must
-- be unique.
CREATE TABLE IF NOT EXISTS public.paper_portfolios (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE,
    cash_balance    NUMERIC(20, 8) NOT NULL DEFAULT 100000,
    initial_balance NUMERIC(20, 8) NOT NULL DEFAULT 100000,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Positions ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.paper_positions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL,
    symbol        VARCHAR(30) NOT NULL,
    name          VARCHAR(120),
    market        VARCHAR(10) NOT NULL DEFAULT 'US',
    side          VARCHAR(5)  NOT NULL CHECK (side IN ('LONG', 'SHORT')),
    quantity      NUMERIC(20, 8) NOT NULL CHECK (quantity > 0),
    entry_price   NUMERIC(20, 8) NOT NULL CHECK (entry_price > 0),
    current_price NUMERIC(20, 8),
    close_price   NUMERIC(20, 8),
    stop_loss     NUMERIC(20, 8),
    take_profit   NUMERIC(20, 8),
    currency      VARCHAR(5) NOT NULL DEFAULT '$',
    status        VARCHAR(10) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    pnl           NUMERIC(20, 8),
    pnl_pct       NUMERIC(12, 4),
    opened_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at     TIMESTAMPTZ
);

-- GET filters on (user_id, status) and orders by opened_at DESC.
CREATE INDEX IF NOT EXISTS idx_paper_positions_user_status
    ON public.paper_positions (user_id, status, opened_at DESC);

-- ── Trade log ───────────────────────────────────────────────────────────────
-- Append-only audit trail. position_id is intentionally ON DELETE SET NULL so
-- history survives if a position row is ever removed.
CREATE TABLE IF NOT EXISTS public.paper_trade_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    position_id UUID REFERENCES public.paper_positions(id) ON DELETE SET NULL,
    action      VARCHAR(10) NOT NULL CHECK (action IN ('OPEN', 'CLOSE')),
    symbol      VARCHAR(30) NOT NULL,
    market      VARCHAR(10),
    side        VARCHAR(5),
    quantity    NUMERIC(20, 8),
    price       NUMERIC(20, 8),
    cash_before NUMERIC(20, 8),
    cash_after  NUMERIC(20, 8),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paper_trade_log_user
    ON public.paper_trade_log (user_id, created_at DESC);

-- ── Row Level Security ──────────────────────────────────────────────────────
-- Matches the pattern used by migrations 001/003: anon may read, service_role
-- may write. All writes go through /api/paper-trades using the service key.
ALTER TABLE public.paper_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_positions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_trade_log  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_paper_portfolios" ON public.paper_portfolios;
CREATE POLICY "anon_read_paper_portfolios"
    ON public.paper_portfolios FOR SELECT USING (true);

DROP POLICY IF EXISTS "anon_read_paper_positions" ON public.paper_positions;
CREATE POLICY "anon_read_paper_positions"
    ON public.paper_positions FOR SELECT USING (true);

DROP POLICY IF EXISTS "anon_read_paper_trade_log" ON public.paper_trade_log;
CREATE POLICY "anon_read_paper_trade_log"
    ON public.paper_trade_log FOR SELECT USING (true);

DROP POLICY IF EXISTS "service_write_paper_portfolios" ON public.paper_portfolios;
CREATE POLICY "service_write_paper_portfolios"
    ON public.paper_portfolios FOR ALL
    TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_write_paper_positions" ON public.paper_positions;
CREATE POLICY "service_write_paper_positions"
    ON public.paper_positions FOR ALL
    TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_write_paper_trade_log" ON public.paper_trade_log;
CREATE POLICY "service_write_paper_trade_log"
    ON public.paper_trade_log FOR ALL
    TO service_role USING (true) WITH CHECK (true);

-- ── Seed the demo portfolio ─────────────────────────────────────────────────
-- DEMO_USER in src/app/api/paper-trades/route.ts. Without this row, POST
-- returns "Portfolio not found".
INSERT INTO public.paper_portfolios (user_id, cash_balance, initial_balance)
VALUES ('00000000-0000-0000-0000-000000000001', 100000, 100000)
ON CONFLICT (user_id) DO NOTHING;
