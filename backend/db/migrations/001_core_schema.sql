-- =============================================================
-- AlphaOS: Core Schema
-- DB: Supabase (PostgreSQL) for relational/auth data
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- USERS & RISK PROFILES
-- ─────────────────────────────────────────────
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    total_balance NUMERIC(20, 8) DEFAULT 0,
    paper_balance NUMERIC(20, 8) DEFAULT 100000, -- Virtual paper trading balance
    risk_appetite VARCHAR(20) DEFAULT 'MEDIUM' CHECK (risk_appetite IN ('LOW', 'MEDIUM', 'HIGH', 'QUANT')),
    max_drawdown_limit NUMERIC(5, 2) DEFAULT 10.0, -- Hard stop in percentage
    preferred_markets TEXT[] DEFAULT '{"US","CRYPTO"}',
    telegram_chat_id VARCHAR(50),                  -- For Telegram alerts
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- BROKER CONNECTIONS
-- ─────────────────────────────────────────────
CREATE TABLE broker_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    broker VARCHAR(30) NOT NULL,  -- 'ALPACA', 'ZERODHA', 'DHAN', 'IBKR', 'BINANCE'
    market VARCHAR(10) NOT NULL,  -- 'US', 'INDIA', 'UAE', 'CRYPTO'
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    access_token_encrypted TEXT,
    account_id VARCHAR(100),
    is_paper BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TOP TRADERS & STRATEGIES
-- ─────────────────────────────────────────────
CREATE TABLE trader_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),          -- NULL if imported/synthetic
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    markets_active TEXT[] DEFAULT '{}',
    style VARCHAR(30),                           -- 'SWING', 'SCALP', 'POSITION', 'QUANT'
    win_rate NUMERIC(5, 2),
    avg_monthly_return NUMERIC(8, 4),
    max_drawdown NUMERIC(5, 2),
    sharpe_ratio NUMERIC(8, 4),
    total_trades INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    performance_score NUMERIC(8, 4) DEFAULT 0,  -- Composite ranking score
    raw_strategy_data JSONB,                     -- Original data you provide
    is_verified BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trader_id UUID REFERENCES trader_profiles(id) ON DELETE SET NULL,
    creator_user_id UUID REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    markets TEXT[] DEFAULT '{}',               -- ['US', 'INDIA', 'CRYPTO']
    asset_classes TEXT[] DEFAULT '{}',         -- ['EQUITY', 'CRYPTO', 'BONDS', 'F&O']
    timeframes TEXT[] DEFAULT '{}',            -- ['1h', '4h', '1d']
    rules_json JSONB,                          -- Encoded indicator rules
    ai_summary TEXT,                           -- Claude-generated summary
    performance_score NUMERIC(8, 4) DEFAULT 0,
    total_signals INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- COPY TRADING SUBSCRIPTIONS
-- ─────────────────────────────────────────────
CREATE TABLE strategy_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
    allocation_amount NUMERIC(20, 8) NOT NULL,    -- Capital allocated ($)
    allocation_pct NUMERIC(5, 2),                 -- % of total portfolio
    max_position_size NUMERIC(20, 8),             -- Max $ per single trade
    risk_multiplier NUMERIC(4, 2) DEFAULT 1.0,    -- Scale position: 0.5x to 2x
    is_paper BOOLEAN DEFAULT true,                -- Start in paper mode
    is_active BOOLEAN DEFAULT true,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (follower_id, strategy_id)
);

-- ─────────────────────────────────────────────
-- WEBHOOK SIGNALS (TradingView → AlphaOS)
-- ─────────────────────────────────────────────
CREATE TABLE webhook_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    received_at TIMESTAMPTZ DEFAULT NOW(),
    strategy_id UUID REFERENCES strategies(id),
    symbol VARCHAR(20) NOT NULL,
    market VARCHAR(10),
    action VARCHAR(10) NOT NULL CHECK (action IN ('BUY', 'SELL', 'CLOSE', 'SCALE_IN', 'SCALE_OUT')),
    price NUMERIC(20, 8),
    timeframe VARCHAR(5),
    payload JSONB NOT NULL,                        -- Full raw TradingView JSON
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'SKIPPED')),
    error_message TEXT,
    processed_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────────
-- TRADES & ORDERS
-- ─────────────────────────────────────────────
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strategy_id UUID REFERENCES strategies(id),
    signal_id UUID REFERENCES webhook_signals(id),
    broker_connection_id UUID REFERENCES broker_connections(id),
    broker_order_id VARCHAR(100),                 -- External broker order ID
    symbol VARCHAR(20) NOT NULL,
    market VARCHAR(10) NOT NULL,
    asset_class VARCHAR(20) DEFAULT 'EQUITY',
    side VARCHAR(10) NOT NULL CHECK (side IN ('LONG', 'SHORT')),
    order_type VARCHAR(20) DEFAULT 'MARKET' CHECK (order_type IN ('MARKET', 'LIMIT', 'STOP', 'BRACKET')),
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('PENDING', 'OPEN', 'CLOSED', 'CANCELLED', 'LIQUIDATED')),
    entry_price NUMERIC(20, 8) NOT NULL,
    exit_price NUMERIC(20, 8),
    quantity NUMERIC(20, 8) NOT NULL,
    stop_loss NUMERIC(20, 8),
    take_profit NUMERIC(20, 8),
    pnl NUMERIC(20, 8),
    pnl_pct NUMERIC(8, 4),
    is_paper BOOLEAN DEFAULT true,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────────
-- PORTFOLIO SNAPSHOTS (daily)
-- ─────────────────────────────────────────────
CREATE TABLE portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_value NUMERIC(20, 8),
    cash_balance NUMERIC(20, 8),
    unrealized_pnl NUMERIC(20, 8),
    realized_pnl NUMERIC(20, 8),
    drawdown_pct NUMERIC(8, 4),
    positions_json JSONB,                          -- Snapshot of all open positions
    UNIQUE (user_id, snapshot_date)
);

-- ─────────────────────────────────────────────
-- ALERTS
-- ─────────────────────────────────────────────
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    alert_type VARCHAR(30) NOT NULL,               -- 'PRICE', 'SIGNAL', 'DRAWDOWN', 'TRADE_EXEC', 'NEWS'
    symbol VARCHAR(20),
    condition VARCHAR(20),                         -- 'ABOVE', 'BELOW', 'CROSSES'
    threshold NUMERIC(20, 8),
    channel TEXT[] DEFAULT '{"EMAIL"}',            -- ['EMAIL', 'TELEGRAM', 'PUSH']
    message_template TEXT,
    is_active BOOLEAN DEFAULT true,
    triggered_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- WATCHLISTS
-- ─────────────────────────────────────────────
CREATE TABLE watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) DEFAULT 'Default',
    symbols TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- AI ANALYSIS CACHE (Claude responses)
-- ─────────────────────────────────────────────
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_type VARCHAR(30) NOT NULL,             -- 'STRATEGY', 'TRADE', 'PORTFOLIO', 'SIGNAL'
    subject_id UUID NOT NULL,
    analysis_type VARCHAR(50) NOT NULL,            -- 'RISK_ASSESSMENT', 'SIGNAL_REASONING', 'REBALANCE'
    prompt_hash VARCHAR(64),                       -- Cache by prompt hash
    response TEXT NOT NULL,
    model_used VARCHAR(50) DEFAULT 'claude-sonnet-4-6',
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX idx_trades_user ON trades(user_id, opened_at DESC);
CREATE INDEX idx_trades_strategy ON trades(strategy_id, opened_at DESC);
CREATE INDEX idx_trades_status ON trades(status, user_id);
CREATE INDEX idx_signals_strategy ON webhook_signals(strategy_id, received_at DESC);
CREATE INDEX idx_signals_status ON webhook_signals(status, received_at);
CREATE INDEX idx_subscriptions_follower ON strategy_subscriptions(follower_id, is_active);
CREATE INDEX idx_subscriptions_strategy ON strategy_subscriptions(strategy_id, is_active);
CREATE INDEX idx_alerts_user ON alerts(user_id, is_active);
CREATE INDEX idx_portfolio_snapshots_user ON portfolio_snapshots(user_id, snapshot_date DESC);
