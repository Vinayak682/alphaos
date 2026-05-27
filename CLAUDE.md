@AGENTS.md

# AlphaOS — AI Trading Platform

## Project Overview
AlphaOS is a multi-market AI-powered trading platform with live market data, institutional intelligence, and world-class strategy analytics. Built with Next.js 16 App Router, Supabase, Polygon.io, and Framer Motion.

**Live URL:** https://vinayak682.github.io/alphaos/  
**GitHub:** https://github.com/Vinayak682/alphaos  
**Local path:** /Users/vinayakbhadani/Projects/alphaos/frontend/  
**Deployment:** GitHub Pages (auto-deploys on push to `main` via GitHub Actions)

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
| Database | Supabase PostgreSQL (project: mxwrfihmfmlhtmynpal) |
| Deployment | GitHub Pages via GitHub Actions (`output: 'export'`) |
| Charts | TradingView Lightweight Widget |

---

## Architecture

### Routing (App Router)
```
src/app/
├── (app)/           # Authenticated shell — Sidebar + Header + TickerBar
│   ├── dashboard/   # Main portfolio dashboard
│   ├── markets/     # Live market quotes (US / India / UAE / Crypto)
│   ├── charts/      # TradingView chart widget
│   ├── strategies/  # Strategy detail pages
│   ├── bot/         # AI bots + strategy drawer (?strategy= param opens drawer)
│   ├── institutions/# Institutional intelligence (US 13F / India / UAE)
│   ├── portfolio/   # Portfolio breakdown
│   ├── alerts/      # Alert management
│   └── settings/    # App settings
├── api/             # Server-side only (stripped in static build)
│   ├── quotes/      # Polygon.io batch quotes
│   ├── candles/     # OHLCV candle data
│   ├── market-status/ # NYSE open/closed
│   └── ticker/      # Single ticker info
└── layout.tsx       # Root layout with font variables
```

### Key Libraries / Files
| File | Purpose |
|------|---------|
| `src/lib/polygon.ts` | Polygon.io API client (free tier safe) |
| `src/lib/db.ts` | Supabase-first fetch layer, falls back to static data |
| `src/lib/supabase.ts` | Supabase client + service role helper |
| `src/lib/strategies.ts` | 10 world-class strategy definitions + DRAWDOWN_CSV |
| `src/lib/institutions.ts` | US 13F filings, India superinvestors, UAE stocks, sovereign funds |
| `src/lib/constants.ts` | MOCK_PORTFOLIO, symbol lists, market labels |
| `src/hooks/useMarketData.ts` | Client-side Polygon quote polling hook |
| `src/store/useStore.ts` | Zustand store (activeMarket, selectedSymbol, sidebarCollapsed) |

---

## Data Sources

### Polygon.io (Free Tier)
- **Endpoint used:** `/v2/aggs/ticker/{symbol}/range/1/day/{from}/{to}`
- **NOT used:** Snapshot endpoint (requires paid tier, returns 403)
- **API Key:** In `.env.local` as `POLYGON_API_KEY` — server-side ONLY, never in browser
- **Markets:** US equities + crypto (BTCUSDT, ETHUSDT via X: prefix)

### Supabase
- **URL:** https://mxwrfihmfmlhtmynpal.supabase.co
- **Anon key:** Safe to expose client-side (in `.env.local` + GitHub Actions workflow)
- **Service role key:** Server-side only, NEVER commit to GitHub
- **Tables:** `us_institutions`, `india_superinvestors`, `uae_dividend_stocks`, `strategies`, `strategy_exact_params`, `uae_sovereign_funds`, `waha_funds`, `market_signals`
- **SQL files:** `supabase/001_alphaos_schema.sql` + `supabase/002_seed_data.sql`
- **To update data:** Use Supabase Table Editor at https://mxwrfihmfmlhtmynpal.supabase.co

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
output: "export"        // Static HTML/CSS/JS only
basePath: "/alphaos"    // GitHub project page path
trailingSlash: true     // GitHub Pages needs index.html per route
images: { unoptimized: true }  // No image server in static mode
```

### API routes on GitHub Pages
API routes (`/api/*`) are **removed** during the GitHub Pages build. The app gracefully falls back to:
- Static data from `src/lib/strategies.ts` and `src/lib/institutions.ts`
- Supabase data (fetched client-side via anon key)
- Empty states in market data hooks

For live Polygon.io data, run locally with `npm run dev`.

---

## Static Data — World-Class Strategies (10 total)
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

---

## Institutional Intelligence Data
- **US 13F Filings:** 9 funds — Bridgewater, Citadel, D.E. Shaw, Two Sigma, Millennium, Renaissance, Tiger Global, Pershing Square, Paulson (Q1 2026)
- **India Superinvestors:** Rakesh Jhunjhunwala (₹52,241Cr), Ashish Kedia, Dolly Khanna, Mohnish Pabrai
- **UAE Dividend Stocks:** 15 real ADX/DFM stocks — EMAAR, FAB, ADNOCGAS, EMIRATESNBD, DEWA, etc.
- **Strategy Exact Params:** 8 parameter sets (VCP, Zanger, PTJ, CAN SLIM, Turtle 1&2, Buffett, Dalio)
- **Sovereign Funds:** ADIA ($1T+), Mubadala ($300B+), ADQ ($110B), Waha Capital funds

---

## Security Rules
- `POLYGON_API_KEY` — `.env.local` only, never in git, never in browser
- `SUPABASE_SERVICE_ROLE_KEY` — `.env.local` only, never in git
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe to expose, in GitHub Actions workflow
- `.env.local` is gitignored

---

## Local Development
```bash
cd /Users/vinayakbhadani/Projects/alphaos/frontend
npm run dev          # Starts on http://localhost:3000
# API routes work locally — Polygon.io live data enabled
# Supabase reads from mxwrfihmfmlhtmynpal project
```

## Deploy
```bash
git add . && git commit -m "feat: ..." && git push
# GitHub Actions auto-deploys to https://vinayak682.github.io/alphaos/
```
