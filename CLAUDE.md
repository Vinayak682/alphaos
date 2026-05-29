@AGENTS.md

# AlphaOS — AI Trading Platform

## Project Overview
AlphaOS is a multi-market AI-powered trading platform with live market data, institutional intelligence, and world-class strategy analytics. Built with Next.js 16 App Router, Supabase, Polygon.io, and Framer Motion.

**Live URL:** https://vinayak682.github.io/alphaos/  
**GitHub:** https://github.com/Vinayak682/alphaos  
**Local path:** /Users/vinayakbhadani/Projects/alphaos/frontend/  
**Deployment:** GitHub Pages (auto-deploys on push to `main` via GitHub Actions)

---

## Accounts & Access

### Supabase
- **Project ref:** `mxwrfiihmfmlhtmynpal`
- **URL:** https://mxwrfiihmfmlhtmynpal.supabase.co
- **Owner account:** `emiratesprice@gmail.com` (org: `emiratesprice`)
- **NOT under** `vinayakbhadani1998@gmail.com` — that account owns different projects
- **CLI deploy:** Must `supabase login` with `emiratesprice@gmail.com` before deploying Edge Functions
- **Dashboard:** https://supabase.com/dashboard/project/mxwrfiihmfmlhtmynpal

### GitHub
- **Repo:** https://github.com/Vinayak682/alphaos
- **Account:** Vinayak682
- **Actions:** Auto-deploy on push to `main`

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.6 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animations | Framer Motion |
| Fonts | Inter (body) · Space Grotesk (headings) · JetBrains Mono (numbers) |
| State | Zustand (`src/store/useStore.ts`) |
| Market Data | Polygon.io free tier — daily OHLCV aggregates only |
| Database | Supabase PostgreSQL (project: mxwrfiihmfmlhtmynpal) |
| AI Chat | Groq `llama-3.3-70b-versatile` (streaming, works on GitHub Pages via CORS) |
| News | Finnhub free tier (live financial news for Market Intel) |
| Deployment | GitHub Pages via GitHub Actions (`output: 'export'`) |
| Charts | TradingView Lightweight Widget |
| Notifications | Supabase Edge Function → Telegram Bot API + CallMeBot WhatsApp |

---

## Environment Variables (`.env.local`)

| Variable | Purpose | Status |
|----------|---------|--------|
| `POLYGON_API_KEY` | Market data (server-side ONLY) | Set |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe client-side) | Set |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin writes (server-side ONLY) | **NOT SET** |
| `GROQ_API_KEY` | AlphaBot server-side | Set |
| `NEXT_PUBLIC_GROQ_API_KEY` | AlphaBot on GitHub Pages (Groq supports CORS) | Set |
| `NEXT_PUBLIC_FINNHUB_API_KEY` | Live financial news | Set |
| `WEBHOOK_SECRET` | TradingView webhook auth | Not set |
| `NEXT_PUBLIC_API_URL` | FastAPI backend (future) | Placeholder |

**Security:** `.env.local` is gitignored. Never commit API keys. Anon key is safe to expose client-side and is in GitHub Actions workflow.

---

## Architecture

### Routing (App Router)
```
src/app/
├── (app)/             # Authenticated shell — Sidebar + Header + TickerBar
│   ├── dashboard/     # Command center: KPIs, equity curve, signal feed, agent log
│   ├── signals/       # BUY/SELL/HOLD/EXIT table with AI rationale
│   ├── portfolio/     # 15 cross-market positions, animated equity SVG
│   ├── agent/         # Terminal brain log, Ask AlphaBot streaming chat
│   ├── risk/          # 0–100 gauge, 6-dim radar, ranked risk table
│   ├── strategies/    # 6 strategy cards vs S&P500
│   ├── traders/       # US/UAE/India top traders, consensus chart
│   ├── intel/         # Live Finnhub news + economic calendar
│   ├── us/            # US market: S&P/NASDAQ/DOW/VIX + 14 stocks
│   ├── uae/           # UAE: DFM/ADX + 12 AED stocks
│   ├── india/         # India: NIFTY/SENSEX/BANKNIFTY + 14 INR stocks
│   ├── markets/       # Multi-market live quotes (Binance-style)
│   ├── charts/        # TradingView chart widget
│   ├── bot/           # Strategy drawer (?strategy= param)
│   ├── institutions/  # Institutional intelligence (US 13F / India / UAE)
│   ├── alerts/        # Alert management + Telegram/WhatsApp setup wizards
│   └── settings/      # App settings
├── api/               # Server-side only (stripped in static build)
│   ├── quotes/        # Polygon.io batch quotes
│   ├── candles/       # OHLCV candle data
│   ├── market-status/ # NYSE open/closed
│   ├── ticker/        # Single ticker info
│   ├── agent/chat/    # AlphaBot Groq streaming endpoint
│   └── webhook/tradingview/ # TradingView alert webhook
└── layout.tsx         # Root layout with font variables
```

### Key Libraries / Files
| File | Purpose |
|------|---------|
| `src/lib/polygon.ts` | Polygon.io API client (free tier safe) |
| `src/lib/db.ts` | Supabase-first fetch layer, falls back to static data |
| `src/lib/supabase.ts` | Supabase client + service role helper |
| `src/lib/notifications.ts` | Telegram + WhatsApp notification service (AES-256-GCM encrypted credentials) |
| `src/lib/alerts.ts` | Alert CRUD (localStorage), condition types, pending alert consumption |
| `src/lib/strategies.ts` | 10 world-class strategy definitions + DRAWDOWN_CSV |
| `src/lib/institutions.ts` | US 13F filings, India superinvestors, UAE stocks, sovereign funds |
| `src/lib/constants.ts` | MOCK_PORTFOLIO, symbol lists, market labels |
| `src/hooks/useMarketData.ts` | Client-side Polygon quote polling hook |
| `src/store/useStore.ts` | Zustand store (activeMarket, selectedSymbol, sidebarCollapsed) |

---

## Supabase Database

### Tables (Migration 001 + 002)
`us_institutions`, `india_superinvestors`, `uae_dividend_stocks`, `strategies`, `strategy_exact_params`, `uae_sovereign_funds`, `waha_funds`, `market_signals`

### Migration 003 — Intelligence Layer (SQL written, needs to be run)
| Table | Key columns |
|-------|-------------|
| `signals_generated` | ticker, exchange, market, action (BUY/SELL/HOLD/EXIT), entry_price, stop_loss, target_1, target_2, rr_ratio, confidence, rationale |
| `news_articles` | title, tickers[], sentiment (-1 to +1), impact (HIGH/MED/LOW), Claude summary |
| `economic_events` | event_name, market, impact, forecast, actual, previous |
| `block_deals` | ticker, exchange, buyer, seller, quantity, price, deal_type |
| `institutional_holdings` | institution, ticker, shares_held, value_usd, pct_portfolio, change_shares |
| `company_info` | ticker+exchange PK, sector, industry, market_cap, pe_ratio, eps, currency |

### SQL Files
| File | Status |
|------|--------|
| `supabase/001_alphaos_schema.sql` | Run |
| `supabase/002_seed_data.sql` | Run |
| `supabase/003_intelligence_layer.sql` | **NOT RUN** — 6 intelligence tables |
| `supabase/004_seed_signals.sql` | **NOT RUN** — seed signals for live page |

### RLS Policy
- anon: SELECT on all tables (dashboard reads)
- service_role: full write (morning brain pipeline, webhooks)

---

## Notification System (Telegram + WhatsApp)

### How It Works
Both channels route through a single Supabase Edge Function at `supabase/functions/send-notification/index.ts`.

**Edge Function URL:** `https://mxwrfiihmfmlhtmynpal.supabase.co/functions/v1/send-notification`

**Status: NOT DEPLOYED (returns 404). Must deploy with `emiratesprice@gmail.com` account.**

### Telegram
- Bot: @AlphaOSAlerts_bot
- Bot token: stored in Supabase secrets (NEVER in client bundle)
- Client sends POST to Edge Function with `{ channel: "telegram", chatId, message }`
- Edge Function calls `api.telegram.org/bot{token}/sendMessage`
- **To set token:** `supabase secrets set TELEGRAM_BOT_TOKEN=<token> --project-ref mxwrfiihmfmlhtmynpal`

### WhatsApp (CallMeBot)
- Free API: `api.callmebot.com/whatsapp.php`
- User's phone + API key encrypted with AES-256-GCM before localStorage
- Client sends POST to Edge Function with `{ channel: "whatsapp", phone, apiKey, message }`
- Edge Function calls CallMeBot server-to-server (no CORS issue)
- CallMeBot activation: user must save +34 644 59 81 98 and send "I allow callmebot to send me messages on WhatsApp"

### Previous Attempts (for context)
1. **Browser-direct fetch** — CallMeBot has no CORS headers. Simple GET is sent by browser but response is blocked. Tried catching CORS TypeError and returning `{ fired: true }`. Problem: unreliable, can't read actual response, timeout errors misclassified.
2. **mode: 'no-cors'** — browser sends request, but response is opaque (can't read status). Still fire-and-pray.
3. **Current approach (2026-05-29):** Route through Edge Function. Server-to-server call reads CallMeBot's actual response. Real error messages surfaced to user.

### Security Model
- Credentials encrypted with AES-256-GCM + PBKDF2 from browser fingerprint
- Different device/browser = can't decrypt (by design)
- Edge Function rate limit: 10 notifications/hour per identity
- Message sanitisation: 800 char cap, HTML stripped

### Deploy Commands
```bash
# Must be logged in as emiratesprice@gmail.com
supabase login
supabase functions deploy send-notification --project-ref mxwrfiihmfmlhtmynpal

# For Telegram (WhatsApp doesn't need server secrets — key comes from user):
supabase secrets set TELEGRAM_BOT_TOKEN=<your_bot_token> --project-ref mxwrfiihmfmlhtmynpal
```

---

## Alerts System

### Client-Side (`src/lib/alerts.ts`)
- CRUD operations stored in localStorage
- Alert conditions: `price_above`, `price_below`, `rsi_above`, `drawdown_above`
- Channels: Email, Telegram, WhatsApp
- Common symbols: BTCUSDT, ETHUSDT, SOLUSDT, NVDA, AAPL, MSFT, SPY, TSLA, HDFCBANK, EMAAR, FAB
- Pending alert system: signals page can queue alerts, alerts page consumes them

### UI (`src/app/(app)/alerts/page.tsx`)
- Alert list with toggle/delete
- New Alert modal with symbol autocomplete
- Telegram setup modal (enter chat ID → test → save)
- WhatsApp 6-step wizard (add contact → activate → get key → enter details → send test → confirm)

---

## Data Sources

### Polygon.io (Free Tier)
- **Endpoint:** `/v2/aggs/ticker/{symbol}/range/1/day/{from}/{to}`
- **NOT available:** Snapshot endpoint (paid, returns 403)
- **API Key:** `POLYGON_API_KEY` in `.env.local` — server-side ONLY
- **Markets:** US equities + crypto (BTCUSDT, ETHUSDT via X: prefix)

### Finnhub
- **Endpoint:** Live financial news for Market Intel page
- **API Key:** `NEXT_PUBLIC_FINNHUB_API_KEY` — client-side safe
- **Free tier:** No credit card required

### Groq
- **Model:** `llama-3.3-70b-versatile`
- **Endpoint:** `/api/agent/chat` (server-side streaming) + `NEXT_PUBLIC_GROQ_API_KEY` (client-side for GitHub Pages)
- **Groq supports CORS with allow-origin: ***, so AlphaBot works on static export

---

## GitHub Pages Deployment

### How it works
1. Push to `main` → GitHub Actions triggers
2. Workflow installs deps, **removes `src/app/api/`** (server-only, incompatible with static export)
3. `npm run build` produces `out/` via `output: 'export'`
4. `out/` is deployed to GitHub Pages
5. Live at `https://vinayak682.github.io/alphaos/` within ~60s

### next.config.ts settings
```typescript
output: "export"        // Static HTML/CSS/JS only (production only)
basePath: "/alphaos"    // GitHub project page path (production only)
trailingSlash: true     // GitHub Pages needs index.html per route
images: { unoptimized: true }  // No image server in static mode
```
Dev mode has NO basePath/output:export so `/api/*` routes work locally.

### Fallback behavior on GitHub Pages
- API routes removed → app falls back to static data from `src/lib/strategies.ts`, `src/lib/institutions.ts`
- Supabase reads work (client-side via anon key)
- AlphaBot works (Groq supports CORS via `NEXT_PUBLIC_GROQ_API_KEY`)
- Polygon.io data requires local `npm run dev`

---

## Static Data

### World-Class Strategies (10 total)
| Strategy | Style | Market | Trader Inspiration |
|----------|-------|--------|--------------------|
| Golden Cross Momentum | SWING | US | Mark Minervini / VCP |
| FVG Hunter | DAY | US, CRYPTO | ICT / Smart Money |
| Crypto Macro Quant | MACRO | CRYPTO | Raoul Pal framework |
| Nifty Options Seller | SCALP | INDIA | NSE premium selling |
| UAE Value Compounder | POSITION | UAE | EMAAR/FAB value |
| FTSE Macro Rotation | MACRO | US, UK | Paul Tudor Jones |
| CAN SLIM Pro | POSITION | US | William O'Neil |
| FII Flow Rider | SWING | INDIA | FII/DII flows |
| StatArb Pairs | QUANT | US, CRYPTO | Two Sigma approach |
| VWAP Intraday | DAY | US | VWAP + volume profile |

### Institutional Intelligence
- **US 13F:** 9 funds — Bridgewater, Citadel, D.E. Shaw, Two Sigma, Millennium, Renaissance, Tiger Global, Pershing Square, Paulson
- **India:** Rakesh Jhunjhunwala, Ashish Kedia, Dolly Khanna, Mohnish Pabrai
- **UAE:** 15 ADX/DFM stocks — EMAAR, FAB, ADNOCGAS, EMIRATESNBD, DEWA, etc.
- **Sovereign Funds:** ADIA ($1T+), Mubadala ($300B+), ADQ ($110B), Waha Capital

---

## Morning Brain Architecture (Planned, not yet built)
Daily 08:00 Asia/Dubai:
1. Parallel fetch: Polygon.io (US), Twelve Data (India/UAE), Marketaux/Finnhub (news/earnings)
2. Technical indicators: RSI(14), MACD(12,26,9), Bollinger(20,2), ATR(14), EMA(9,21,50,200), VWAP
3. Smart money sync (weekly cache): 13F/NSE bulk deals/DFM major tx
4. Claude loop per ticker → `{ action, entry, SL, T1, T2, RR, confidence 0-100, rationale }`
5. Confidence filter: `0.30×Technical + 0.25×News + 0.20×SmartMoney + 0.15×InverseRisk + 0.10×Regime ≥ 70`
6. Write to `signals_generated` + Telegram morning brief

TradingView Webhook: `POST /api/webhook/tradingview` → validate → Claude quick-analysis → confidence gate → paper trade.

---

## Build History

| Date | What was built |
|------|---------------|
| 2026-05-20 | Initial Next.js + Polygon.io + FastAPI backend |
| 2026-05-21 | Institutional intelligence, trader strategies, font/button fixes |
| 2026-05-22 | GitHub Pages deployment, Supabase integration |
| 2026-05-23 | Full markets redesign, India/UAE data fix, Binance-style UI |
| 2026-05-24 | 8 new screens + redesigned sidebar |
| 2026-05-25 | Portfolio page + Dashboard refresh |
| 2026-05-26 | Migration 003 intelligence layer SQL |
| 2026-05-27 | AlphaBot chat (Groq streaming), TradingView webhook, signals wiring, Finnhub news |
| 2026-05-28 | Fear & Greed Index, Crypto Markets page, Alerts modal, Telegram + WhatsApp notifications (AES-256-GCM), Edge Function written |
| 2026-05-29 | WhatsApp fix: rewired from browser-direct to Edge Function server-to-server. **Edge Function still needs deploy.** |

---

## Remaining Build (Priority Order)
1. **Deploy Edge Function** `send-notification` (login as `emiratesprice@gmail.com`)
2. Set `TELEGRAM_BOT_TOKEN` in Supabase secrets
3. Run `003_intelligence_layer.sql` in Supabase dashboard
4. Run `004_seed_signals.sql` for live signals
5. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
6. Morning brain scheduler (Python APScheduler, 08:00 Asia/Dubai)
7. Wire data fetchers: Polygon.io, Twelve Data, Marketaux, Finnhub
8. Wire `/portfolio` and `/risk` to real Supabase data

---

## Local Development
```bash
cd /Users/vinayakbhadani/Projects/alphaos/frontend
npm run dev          # http://localhost:3000
# API routes work locally — Polygon.io + Groq + webhooks enabled
# Supabase reads from mxwrfiihmfmlhtmynpal project
```

## Deploy
```bash
git add . && git commit -m "feat: ..." && git push
# GitHub Actions auto-deploys to https://vinayak682.github.io/alphaos/
```
