-- Migration 004: Seed today's 10 AlphaBot signals into market_signals
-- Run this in Supabase SQL Editor after 001_alphaos_schema.sql
-- These match the mock signals shown on the /signals page
-- Re-run daily to refresh — or let the webhook/morning brain populate automatically

-- Clear today's signals first (idempotent)
DELETE FROM market_signals WHERE created_at::date = CURRENT_DATE;

INSERT INTO market_signals (symbol, market, action, price, confidence, entry_price, stop_loss, target_1, target_2, notes, active)
VALUES
  ('NVDA',      'US',     'BUY',   918.00,  88, 918.00,  898.00,  960.00,  1005.00, 'RSI breakout 8-week base | Citadel+D.E.Shaw 13F accumulation | Blackwell Ultra confirmed',    true),
  ('MSFT',      'US',     'BUY',   418.00,  85, 418.00,  403.00,  445.00,  468.00,  'Azure AI +35% YoY | Citadel+D.E.Shaw inflows | Earnings beat Q3 2026',                       true),
  ('FAB',       'UAE',    'BUY',   14.60,   84, 14.60,   14.00,   15.80,   16.50,   'DFM block buy 8.2M shares | UAE GDP +4.3% Q1 | Oil price NIM tailwind',                       true),
  ('ADNOCGAS',  'UAE',    'BUY',   4.32,    82, 4.32,    4.10,    4.75,    5.10,    'ADIA accumulating 4 weeks | 10-year LNG deal signed | Dividend yield 5.8%',                   true),
  ('HDFCBANK',  'INDIA',  'BUY',   1640.00, 81, 1640.00, 1580.00, 1750.00, 1820.00, 'EMA50 support 3 weeks | FII net buy ₹2,400Cr | RBI hold supportive of NIMs',                  true),
  ('EMAAR',     'UAE',    'BUY',   8.92,    79, 8.92,    8.50,    9.60,    10.20,   'DXB real estate +31% YoY | 6-month support with volume surge | Geo risk premium unwinding',   true),
  ('TSLA',      'US',     'SELL',  182.00,  76, 182.00,  195.00,  162.00,  148.00,  'Below EMA50 high volume | China share 11% from 18% YoY | 13F de-risking detected',            true),
  ('TCS',       'INDIA',  'WATCH', 3820.00, 73, 3820.00, 3650.00, 4050.00, 4200.00, 'Above EMA200 | Q4 beat +4.2% | Awaiting deal win announcements before adding',               true),
  ('RELIANCE',  'INDIA',  'CLOSE', 2944.00, 72, NULL,    NULL,    NULL,    NULL,    'RSI 74.2 overbought | Promoter sold ₹340Cr SEBI disclosure | Distribution pattern forming',   true),
  ('AAPL',      'US',     'WATCH', 189.00,  70, 189.00,  181.00,  198.00,  210.00,  'Pre-WWDC consolidation | AI feature catalyst pending June 9 | Institutional hold unchanged', true);
