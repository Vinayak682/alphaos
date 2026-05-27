-- =============================================================
-- AlphaOS: TimescaleDB Schema
-- DB: Timescale Cloud for all market/price time-series data
-- =============================================================

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ─────────────────────────────────────────────
-- OHLCV CANDLESTICK DATA
-- ─────────────────────────────────────────────
CREATE TABLE market_candles (
    time TIMESTAMPTZ NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    market VARCHAR(10) NOT NULL,   -- 'US', 'INDIA', 'UAE', 'CRYPTO'
    timeframe VARCHAR(5) NOT NULL, -- '1m', '5m', '15m', '1h', '4h', '1d', '1w'
    open NUMERIC(20, 8) NOT NULL,
    high NUMERIC(20, 8) NOT NULL,
    low NUMERIC(20, 8) NOT NULL,
    close NUMERIC(20, 8) NOT NULL,
    volume NUMERIC(20, 8) NOT NULL,
    vwap NUMERIC(20, 8),           -- Volume-weighted average price
    num_trades INTEGER,
    PRIMARY KEY (time, symbol, timeframe)
);

SELECT create_hypertable('market_candles', 'time', chunk_time_interval => INTERVAL '1 day');

-- Compression: keep last 7 days uncompressed, compress older
ALTER TABLE market_candles SET (
    timescaledb.compress,
    timescaledb.compress_orderby = 'time DESC',
    timescaledb.compress_segmentby = 'symbol, timeframe'
);

SELECT add_compression_policy('market_candles', INTERVAL '7 days');
SELECT add_retention_policy('market_candles', INTERVAL '5 years');

-- ─────────────────────────────────────────────
-- TICK DATA (real-time trades)
-- ─────────────────────────────────────────────
CREATE TABLE market_ticks (
    time TIMESTAMPTZ NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    market VARCHAR(10) NOT NULL,
    price NUMERIC(20, 8) NOT NULL,
    size NUMERIC(20, 8) NOT NULL,
    side VARCHAR(5),               -- 'BUY', 'SELL', null
    PRIMARY KEY (time, symbol)
);

SELECT create_hypertable('market_ticks', 'time', chunk_time_interval => INTERVAL '1 hour');

ALTER TABLE market_ticks SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'symbol, market'
);
SELECT add_compression_policy('market_ticks', INTERVAL '3 days');
SELECT add_retention_policy('market_ticks', INTERVAL '90 days');   -- Ticks: 90 days only

-- ─────────────────────────────────────────────
-- STRATEGY PERFORMANCE TIME-SERIES
-- ─────────────────────────────────────────────
CREATE TABLE strategy_equity_curve (
    time TIMESTAMPTZ NOT NULL,
    strategy_id UUID NOT NULL,
    equity NUMERIC(20, 8) NOT NULL,
    drawdown_pct NUMERIC(8, 4),
    open_trades INTEGER DEFAULT 0,
    PRIMARY KEY (time, strategy_id)
);

SELECT create_hypertable('strategy_equity_curve', 'time', chunk_time_interval => INTERVAL '1 week');

-- ─────────────────────────────────────────────
-- CONTINUOUS AGGREGATES (pre-computed OHLCV rollups)
-- These replace manual group-by queries and are auto-refreshed
-- ─────────────────────────────────────────────

-- 1-hour candles (materialized from 1m data)
CREATE MATERIALIZED VIEW candles_1h
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    symbol,
    market,
    first(open, time) AS open,
    max(high) AS high,
    min(low) AS low,
    last(close, time) AS close,
    sum(volume) AS volume
FROM market_candles
WHERE timeframe = '1m'
GROUP BY bucket, symbol, market
WITH NO DATA;

SELECT add_continuous_aggregate_policy('candles_1h',
    start_offset => INTERVAL '3 hours',
    end_offset   => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour'
);

-- Daily candles (materialized from 1h data)
CREATE MATERIALIZED VIEW candles_1d
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', time) AS bucket,
    symbol,
    market,
    first(open, time) AS open,
    max(high) AS high,
    min(low) AS low,
    last(close, time) AS close,
    sum(volume) AS volume
FROM market_candles
WHERE timeframe = '1h'
GROUP BY bucket, symbol, market
WITH NO DATA;

SELECT add_continuous_aggregate_policy('candles_1d',
    start_offset => INTERVAL '2 days',
    end_offset   => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day'
);

-- ─────────────────────────────────────────────
-- INDEXES (TimescaleDB auto-creates on time+PK)
-- ─────────────────────────────────────────────
CREATE INDEX idx_candles_symbol_tf ON market_candles(symbol, timeframe, time DESC);
CREATE INDEX idx_candles_market ON market_candles(market, time DESC);
CREATE INDEX idx_ticks_symbol ON market_ticks(symbol, time DESC);
