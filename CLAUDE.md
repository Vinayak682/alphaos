@AGENTS.md

# AlphaOS — AI Trading Platform

## Project Overview
AlphaOS is a multi-market AI-powered trading platform with live market data, institutional
intelligence, AI-generated trading signals, paper trading, and world-class strategy analytics.
Built with Next.js 16 App Router, Supabase, Polygon.io, and Framer Motion.

**Live URL:** https://vinayak682.github.io/alphaos/
**GitHub:** https://github.com/Vinayak682/alphaos
**Canonical working copy:** `/Users/vinayakbhadani/alphaos-dev` ← use this one
**Deployment:** GitHub Pages (auto-deploys on push to `main` via GitHub Actions)

> ⚠️ **Two working copies exist.** `~/Projects/alphaos/frontend` is a stale second clone that sat
> 3 commits behind `main` and held ~1,900 lines of uncommitted work (restored into `~/alphaos-dev`
> on 2026-08-22). Do not develop there. Treat it as an archive only.

---

## Supabase — restored 2026-08-22

The project `mxwrfiihmfmlhtmynpal` had gone to NXDOMAIN and has since been **restored**.
Verified working: live prices on US/India/UAE via the `market-prices` Edge Function,
paper trading with its data intact, and Morning Brain persisting signals
(`persisted: true`).

### Authentication — new key format
The project now issues Supabase's **new API keys**. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
holds a `sb_publishable_...` key rather than the legacy anon JWT. Both formats currently
work; publishable is the forward-looking one and is what is configured.

`sb_publishable_` keys are opaque — unlike the old anon JWTs they do **not** encode the
project ref, so the project URL cannot be recovered from the key alone.

WARNING: `GET /rest/v1/` (the schema root) rejects publishable keys with
"Secret API key required". That is expected and is **not** a broken key — table reads
work fine. Do not use the REST root as a health check.

### What did NOT come back
| Survived (with data) | Missing |
|---|---|
| `market_signals`, `signals_generated`, `alpha_signals` | `us_institutions`, `india_superinvestors`, `uae_dividend_stocks` |
| `paper_portfolios`, `paper_positions`, `paper_trade_log` | `strategies`, `strategy_exact_params`, `uae_sovereign_funds`, `waha_funds` |
| All four Edge Functions | `news_articles`, `economic_events`, `block_deals`, `institutional_holdings`, `company_info` |

Everything the app *writes* survived. The missing tables are reference data only, and
`src/lib/db.ts` is Supabase-first with a static fallback, so those pages work regardless.
Re-run `001`, `002` and `003` to restore DB-backed reference data.

## Remaining blockers

| Blocker | Impact | Fix |
|---|---|---|
| `agent-research` returns 500 | Research agents dead. The deployed copy still calls the decommissioned Groq models; the fix is in the repo but not deployed. | `supabase functions deploy agent-research --project-ref mxwrfiihmfmlhtmynpal` |
| Reference tables missing | Institutions/strategies pages serve static fallback rather than DB-backed data. | Re-run migrations 001, 002, 003 |
| `TELEGRAM_BOT_TOKEN` | Never set. Telegram alerts inert (WhatsApp needs no server token). | `supabase secrets set TELEGRAM_BOT_TOKEN=<token> --project-ref mxwrfiihmfmlhtmynpal` |
| `WEBHOOK_SECRET` | Not set. TradingView webhook unauthenticated. | Set in `.env.local`. |

The first two need Supabase **account** access (CLI login or the dashboard SQL editor) —
neither is reachable with a publishable or service-role key.

---

## Accounts & Access

### Supabase
- **Project ref:** `mxwrfiihmfmlhtmynpal` — went NXDOMAIN, **restored 2026-08-22**
- **Owner account:** `emiratesprice@gmail.com` (org: `emiratesprice`)
- **NOT under** `vinayakbhadani1998@gmail.com` — that account owns different projects
- **CLI deploy:** must `supabase login` as `emiratesprice@gmail.com` before deploying Edge Functions
- **Never put a `sbp_…` access token in a tracked file.** Use `supabase login` interactively, or an
  env var. An earlier draft of this file had one pasted in plaintext; it was never committed.

### GitHub
- **Repo:** https://github.com/Vinayak682/alphaos
- **Account:** Vinayak682
- **Actions:** auto-deploy on push to `main`

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animations | Framer Motion |
| Fonts | Inter (body) · Space Grotesk (headings) · JetBrains Mono (numbers) |
| State | Zustand (`src/store/useStore.ts`) |
| Market Data | Polygon.io (US/crypto daily OHLCV) · Binance · Yahoo Finance · Twelve Data · Finnhub |
| Database | Supabase PostgreSQL (`mxwrfiihmfmlhtmynpal`) — restored; new `sb_publishable_` key format |
| AI | Groq `openai/gpt-oss-120b` (chat + signals) |
| News | Finnhub free tier |
| Deployment | GitHub Pages via GitHub Actions (`output: 'export'`) |
| Charts | TradingView Lightweight Widget |
| Notifications | Supabase Edge Function → Telegram Bot API + CallMeBot WhatsApp |

### ⚠️ Groq model policy
`llama-3.3-70b-versatile`, `deepseek-r1-distill-llama-70b`, and
`meta-llama/llama-4-maverick-17b-128e-instruct` were **all decommissioned by Groq** and now
return HTTP 404. Every call site was migrated to **`openai/gpt-oss-120b`** on 2026-08-22.
Do not reinstate the old ids. Verify a model exists before using it:

```bash
curl -s https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY" | python3 -m json.tool
```

**gpt-oss quirk:** the model spends part of its token budget on an internal reasoning channel.
For structured output, give generous `max_tokens` (≥2000) plus `reasoning_effort: "low"` and
`response_format: { type: "json_object" }`, or the JSON body gets truncated mid-object.
This exact bug silently produced 0 parsed signals in `/api/morning-brain`.

---

## Environment Variables (`.env.local`, gitignored)

| Variable | Purpose | Status |
|----------|---------|--------|
| `POLYGON_API_KEY` | Market data (server-side ONLY) | ✅ Working |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ Working |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key (safe client-side) | ✅ Working (`sb_publishable_…`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin writes (server-side ONLY) | ✅ Working (legacy JWT still valid) |
| `GROQ_API_KEY` | AlphaBot + signals, server-side | ✅ Working |
| `NEXT_PUBLIC_GROQ_API_KEY` | AlphaBot on GitHub Pages (Groq allows CORS) | ✅ Working |
| `NEXT_PUBLIC_FINNHUB_API_KEY` | Live news + quotes | ✅ Working |
| `NEXT_PUBLIC_TWELVEDATA_API_KEY` | India/UAE candles + gold spot (XAU/USD) | ✅ Working |
| `NEXT_PUBLIC_ALPHAVANTAGE_API_KEY` | WTI/Brent $/barrel history | Not set — falls back to the shared `demo` key |
| `ANTHROPIC_API_KEY` | Claude signals (best quality) | Empty — optional |
| `GOOGLE_AI_KEY` | Gemini signals | Not set — optional |
| `WEBHOOK_SECRET` | TradingView webhook auth | ❌ Not set |
| `NEXT_PUBLIC_API_URL` | FastAPI backend (future) | Placeholder |

### Verified external services (host-level check, 2026-08-22)
| Service | Result |
|---|---|
| Binance REST | ✅ HTTP 200 |
| alternative.me (Fear & Greed) | ✅ HTTP 200 |
| Finnhub | ✅ HTTP 200 |
| Polygon.io | ✅ HTTP 200 |
| Twelve Data | ✅ HTTP 200 |
| Groq (`openai/gpt-oss-120b`) | ✅ chat + JSON mode |
| Yahoo Finance | ⚠️ HTTP 429 (rate-limited, intermittent) |
| Supabase REST + Edge Functions | ✅ Restored — live prices, paper trades, signal writes all verified |

### AI model priority chain (Morning Brain)
`/api/morning-brain` tries, in order:
1. **Claude Sonnet 4.6** — if `ANTHROPIC_API_KEY` is set (best quality)
2. **Gemini 2.0 Flash** — if `GOOGLE_AI_KEY` is set
3. **Groq `openai/gpt-oss-120b`** — free, currently the active path
4. Error if no key is set

The `model` column in `signals_generated` records which model produced each signal.

---

## Architecture

### Routing (App Router)
```
src/app/
├── (app)/                  # Authenticated shell — Sidebar + Header + TickerBar
│   ├── dashboard/          # Command center: KPIs, equity curve, signal feed, agent log
│   ├── signals/            # BUY/SELL/HOLD/EXIT table + "Run Brain" + per-row Trade button
│   ├── portfolio/          # Positions + animated equity SVG (paper-trade aware)
│   ├── agent/              # Terminal brain log, Ask AlphaBot streaming chat
│   ├── risk/               # 0–100 gauge, 6-dim radar, ranked risk table
│   ├── strategies/         # 10 strategy cards vs S&P500
│   ├── traders/            # US/UAE/India top traders — holding chips open a prefilled trade
│   ├── intel/              # Live Finnhub news + economic calendar
│   ├── us/ uae/ india/     # Per-market pages with live quotes
│   ├── crypto/             # Crypto markets (Binance)
│   ├── commodities/        # Oil & Gold — $/barrel history, gold spot, world data
│   ├── markets/            # Multi-market live quotes (Binance-style)
│   ├── fear-greed/         # Per-market sentiment + strategy playbook
│   ├── charts/             # TradingView chart widget
│   ├── bot/                # Strategy drawer (?strategy= param)
│   ├── institutions/       # US 13F / India superinvestors / UAE — each holding copy-tradeable
│   ├── alerts/             # Alert management + Telegram/WhatsApp setup wizards
│   ├── audit/              # Data-transparency dashboard: API health + feature truth map
│   ├── deploy-checklist/   # 6-phase build plan with progress tracking
│   └── settings/
├── api/                    # Server-side only — REMOVED by CI before static export
│   ├── quotes/ candles/ market-status/ ticker/
│   ├── morning-brain/      # AI signal generation pipeline
│   ├── signals/            # Reads ACTIVE signals from Supabase
│   ├── paper-trades/       # GET/POST/PATCH paper positions
│   ├── agent/chat/         # AlphaBot Groq streaming endpoint
│   └── webhook/tradingview/
└── layout.tsx
```

### Key Libraries / Files
| File | Purpose |
|------|---------|
| `src/lib/technicals.ts` | Pure TS RSI(14), MACD(12,26,9), EMA(9/21/50/200), ATR(14) — no deps |
| `src/lib/commodities.ts` | Oil & gold data layer + world reference data + series analytics |
| `src/hooks/useCommodities.ts` | Loads gold spot/history, WTI+Brent $/bbl, 19 proxy quotes |
| `src/lib/market-data.ts` | Unified price client → `market-prices` Edge Function, 30s cache |
| `src/lib/signals.ts` | Signal types + helpers for the live signals feed |
| `src/lib/finnhub-ws.ts` | Finnhub WebSocket client for real-time US trades |
| `src/lib/binance.ts` | Binance REST client (no key needed) |
| `src/lib/twelvedata.ts` | Twelve Data client + India NSE / UAE DFM symbol maps |
| `src/lib/polygon.ts` | Polygon.io client (free tier, daily OHLCV) |
| `src/lib/db.ts` | Supabase-first fetch layer, falls back to static data |
| `src/lib/supabase.ts` | Supabase client + service-role helper |
| `src/lib/notifications.ts` | Telegram + WhatsApp service (AES-256-GCM encrypted credentials) |
| `src/lib/alerts.ts` | Alert CRUD (localStorage) + pending-alert handoff |
| `src/lib/strategies.ts` | 10 strategy definitions + DRAWDOWN_CSV |
| `src/lib/institutions.ts` | US 13F, India superinvestors, UAE stocks, sovereign funds |
| `src/lib/constants.ts` | MOCK_PORTFOLIO, symbol lists, market labels |
| `src/hooks/usePaperPortfolio.ts` | Polls `/api/paper-trades` every 30s, live P&L, open/close |
| `src/hooks/useLivePrices.ts` | Unified live price hook, 30s poll, flash detection |
| `src/hooks/useMarketData.ts` | Legacy Polygon polling hook |
| `src/components/ui/TradeModal.tsx` | Prefillable paper-trade modal (symbol/price/SL/TP/side) |
| `src/store/useStore.ts` | Zustand store (activeMarket, selectedSymbol, sidebarCollapsed) |

---

## Commodities — Oil & Gold (`/commodities`)

Entirely client-side and CORS-safe, so unlike the market pages it keeps working on
the static GitHub Pages export with no Supabase and no API routes.

### Data sources (all verified 2026-08-22)
| Need | Source | Notes |
|---|---|---|
| Gold spot + daily history | Twelve Data `XAU/USD` | Free tier. Silver/platinum and XAU/EUR are paid. |
| WTI + Brent **$/barrel** | Alpha Vantage `WTI` / `BRENT` | Real per-barrel series, monthly back to 1986/87. |
| Live oil/gold exposure | Finnhub quotes | 19 US-listed instruments: USO, BNO, XLE, GLD, IAU, GDX, majors, services, miners. |

**Twelve Data does not sell WTI/Brent on the free tier** (HTTP 404 pointing at the Grow
plan) and **Finnhub candles are 403 on free**. Alpha Vantage is the only free source of
genuine per-barrel history found — hence the split above. Yahoo Finance was rejected: no
CORS headers and it rate-limits to 429.

### Rate limits — why everything is cached in localStorage
Alpha Vantage allows only **25 requests/day**, so per-barrel series cache for 12h; gold
history 1h; quotes 2m. Without a key the code falls back to Alpha Vantage's shared `demo`
key, which serves WTI/BRENT but is throttled. Set `NEXT_PUBLIC_ALPHAVANTAGE_API_KEY` for
a dedicated quota.

### Page structure
Five tabs: **Overview** (Brent vs WTI chart, drivers, historic shocks) · **Oil**
(per-benchmark statistics, full history charts, Brent–WTI spread and correlation, global
benchmark table) · **Gold** (spot, 52w range, daily chart, technical read, demand mix) ·
**Equities** (19 live quotes, each copy-tradeable into the paper portfolio) ·
**World Data** (producers, reserves, importers, central bank gold, OPEC+).

### Analytics
`computeSeriesStats` returns series high/low, mean, median, stdev, volatility, CAGR, max
drawdown and current drawdown from peak. Gold also runs through `computeIndicators` — the
same engine Morning Brain uses — for RSI/MACD/EMA/ATR.

⚠️ Stats are labelled **"series high/low"**, not "all-time": they are computed over the
loaded window only (gold ≈400 sessions, oil ≈40 years of monthly data). Do not relabel
these as all-time.

### Deliberate design decisions
- **Commodities are NOT in the `MARKETS` tuple.** That tuple drives the header market
  switcher and `useLivePrices`, which only understand US/INDIA/UAE/CRYPTO. Adding a fifth
  member breaks both. Commodities use `COMMODITY_WATCHLIST` in `constants.ts` instead.
- **Morning Brain covers commodities via GLD/USO/BNO**, which are US-listed and therefore
  ride the existing Polygon path — no new fetch branch needed.
- **World reference data is curated static data**, clearly labelled as such in the UI with
  its vintage. No free API publishes production, reserves or central bank holdings.

---

## Morning Brain — AI Signal Generation

`POST /api/morning-brain` (triggered by "Run Brain" on the Signals page):
1. Fetch ~90 days OHLCV — Polygon (US/crypto), Yahoo Finance (India `.NS` / UAE `.AE`)
2. Compute RSI, MACD, EMA, ATR in pure TypeScript (`src/lib/technicals.ts`)
3. Fetch last 3 days of Finnhub news per symbol
4. Call AI per symbol → structured JSON signal
5. Write to `signals_generated`; **if the DB is unreachable the signals are still returned**
   with a `warning` field rather than being discarded (added 2026-08-22)
6. Signals page switches from "DEMO DATA" to "● AI LIVE" when the DB has rows

Confidence formula: `0.30×Technical + 0.25×News + 0.20×SmartMoney + 0.15×InverseRisk + 0.10×Regime ≥ 70`

Response shape: `{ success, persisted, warning?, count, signals[], symbolsAnalyzed, model }`

---

## Supabase Database

### Migrations
| File | Purpose |
|------|---------|
| `supabase/001_alphaos_schema.sql` | Core tables |
| `supabase/002_seed_data.sql` | Seed data |
| `supabase/003_intelligence_layer.sql` | 6 intelligence tables + paper-trading tables |
| `supabase/004_seed_signals.sql` | Seed signals |
| `supabase/005_alpha_signals.sql` | `alpha_signals` for the live signals feed |
| `supabase/006_paper_trading.sql` | `paper_portfolios`, `paper_positions`, `paper_trade_log` + demo portfolio |

All must be re-run against a new project. **See `supabase/RECONNECT.md`** for the
full step-by-step.

⚠️ **006 was missing until 2026-08-22.** The paper-trading tables were created by
hand in the SQL editor and never committed, so they were lost with the project —
migrations 001–005 do not recreate them. It was reverse-engineered from the columns
`src/app/api/paper-trades/route.ts` actually uses. Without it, paper trading fails
with "Portfolio not found" against a rebuilt database.

### Tables
`us_institutions`, `india_superinvestors`, `uae_dividend_stocks`, `strategies`,
`strategy_exact_params`, `uae_sovereign_funds`, `waha_funds`, `market_signals`,
`signals_generated`, `alpha_signals`, `news_articles`, `economic_events`, `block_deals`,
`institutional_holdings`, `company_info`, `paper_portfolios`, `paper_positions`, `paper_trade_log`

### RLS Policy
- anon: SELECT on all tables (dashboard reads)
- service_role: full write (morning brain pipeline, webhooks)

### Edge Functions
| Function | Purpose | Status |
|----------|---------|--------|
| `market-prices` | Price proxy: Finnhub + Yahoo + Binance | ❌ dead with the project |
| `send-notification` | Telegram + WhatsApp | ❌ dead with the project |
| `alphabot-chat` | Streaming chat (unused — client-side Groq is used) | ❌ dead with the project |
| `agent-research` | Research agents, Groq fallback chain | ❌ dead with the project |

---

## Notification System (Telegram + WhatsApp)

Both channels route through `supabase/functions/send-notification/index.ts`.

### WhatsApp implementation history — do not revert
1. **Browser-direct fetch** — CallMeBot sends no CORS headers; response unreadable. Unreliable.
2. **`mode: 'no-cors'`** — opaque response, fire-and-pray.
3. **Current: route through the Edge Function.** Server-to-server, reads CallMeBot's real
   response, surfaces real errors. **This is correct — do not change.**

- CallMeBot activation: save +34 644 59 81 98, send "I allow callmebot to send me messages on WhatsApp"
- Credentials encrypted AES-256-GCM + PBKDF2 from browser fingerprint (different device = can't decrypt, by design)
- Edge Function rate limit: 10 notifications/hour per identity; messages capped at 800 chars, HTML stripped

---

## GitHub Pages Deployment

1. Push to `main` → GitHub Actions triggers
2. Workflow installs deps, **removes `src/app/api/`** (incompatible with static export)
3. `npm run build` produces `out/` via `output: 'export'`
4. `out/` deploys to GitHub Pages, live in ~60s

`next.config.ts` applies `output: "export"`, `basePath: "/alphaos"`, `trailingSlash` **only in
production** — dev keeps API routes working locally.

### Reproducing the CI build locally
`npm run build` fails in-repo because API routes can't be statically exported. Mirror CI instead:

```bash
rsync -a --exclude node_modules --exclude .next --exclude out --exclude .git ~/alphaos-dev/ /tmp/ci/
cp -Rl ~/alphaos-dev/node_modules /tmp/ci/node_modules   # hard links; a symlink panics Turbopack
rm -rf /tmp/ci/src/app/api
cd /tmp/ci && ./node_modules/.bin/next build
```

Last verified 2026-08-22: ✅ 23 routes exported, including `/audit` and `/deploy-checklist`.

---

## Build History

| Date | What was built |
|------|---------------|
| 2026-05-20 | Next.js scaffold + Polygon.io + FastAPI backend stub |
| 2026-05-21 | Institutional intelligence, 10 strategies, font/button fixes |
| 2026-05-22 | GitHub Pages pipeline, Supabase integration, migrations 001+002 |
| 2026-05-23 | Markets redesign (Binance-style), India/UAE data fix |
| 2026-05-24 | 8 new screens + sidebar redesign |
| 2026-05-25 | Portfolio page + dashboard refresh |
| 2026-05-26 | Migration 003 intelligence layer SQL |
| 2026-05-27 | AlphaBot streaming chat, TradingView webhook, Finnhub news |
| 2026-05-28 | Fear & Greed, Crypto page, Alerts modal, Telegram + WhatsApp (AES-256-GCM) |
| 2026-05-29 | WhatsApp rewired to Edge Function; `market-prices` Edge Function; live prices across all markets |
| 2026-05-29 | Paper trading full stack, copy trading, Morning Brain, Audit page, Deploy Checklist |
| 2026-06 | Google Analytics; agentic research agents + live signals + signal breakdown tab |
| **2026-08-22** | **Restore session** — see below |
| **2026-08-22** | **Commodities** — `/commodities` page: real $/barrel WTI+Brent history, gold spot + technicals, 19 live oil/gold equities, global reference data. Morning Brain extended to GLD/USO/BNO. |

### 2026-08-22 — Restore session
Recovered ~1,900 lines of work that were stranded, uncommitted, in the stale
`~/Projects/alphaos/frontend` clone and never reached `main`:

- `src/lib/technicals.ts`, `src/hooks/usePaperPortfolio.ts`, `src/components/ui/TradeModal.tsx`
- `/api/morning-brain`, `/api/paper-trades`, `/api/signals`
- `/audit` and `/deploy-checklist` pages (+ sidebar entries)
- Copy-trading wiring on Signals, Traders, Institutions, Portfolio, Dashboard
- Header switched from `MOCK_PORTFOLIO` to the live `usePaperPortfolio` stats

Repairs made during the restore:
- Migrated every Groq call site off decommissioned models → `openai/gpt-oss-120b`
- Fixed Morning Brain producing 0 signals (gpt-oss reasoning tokens truncating the JSON)
- Made Morning Brain return generated signals instead of a 500 when Supabase is unreachable
- Restored `.env.local` (it existed only in the stale clone)

---

## Local Development
```bash
cd /Users/vinayakbhadani/alphaos-dev
npm run dev          # http://localhost:3000 — API routes + all keys active
```

## Deploy
```bash
git add . && git commit -m "feat: ..." && git push
# GitHub Actions auto-deploys to https://vinayak682.github.io/alphaos/
```
