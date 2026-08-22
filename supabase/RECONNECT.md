# Reconnecting AlphaOS to a Supabase project

> **STATUS 2026-08-22: the original project `mxwrfiihmfmlhtmynpal` was RESTORED.**
> Live prices, paper trading and signal persistence are all verified working again.
> This runbook is kept for the next outage, and because part of it still applies:
> the 001/002/003 reference tables did **not** come back and still need re-running.
>
> Also note the project now issues `sb_publishable_…` keys instead of anon JWTs.
> Those keys are opaque and do **not** encode the project ref, so keep the project
> URL recorded somewhere — you cannot derive it from the key.

---

## 0. What still works without any database

Worth knowing before you start — these need no Supabase at all:

- `/commodities` (oil & gold) — fully client-side
- `/crypto` — Binance direct
- AlphaBot chat — Groq direct
- Market Intel news — Finnhub direct
- All static pages: strategies, institutions, traders, deploy-checklist, audit

What is actually blocked: live prices on US/India/UAE pages and the ticker bar
(they route through the `market-prices` Edge Function), notifications, paper
trading, and stored signals.

---

## 1. Create the project

Create a new project at supabase.com under the account that owns it
(`emiratesprice@gmail.com` owned the old one). Note its **project ref** — the
subdomain in `https://<ref>.supabase.co`.

## 2. Run the migrations, in order

Paste each into the SQL editor and run:

| File | Creates |
|------|---------|
| `001_alphaos_schema.sql` | Core reference tables + RLS |
| `002_seed_data.sql` | Seed data for those tables |
| `003_intelligence_layer.sql` | `signals_generated`, `news_articles`, `economic_events`, `block_deals`, `institutional_holdings`, `company_info` |
| `004_seed_signals.sql` | Seed signals |
| `005_alpha_signals.sql` | `alpha_signals` (live signals feed) |
| `006_paper_trading.sql` | `paper_portfolios`, `paper_positions`, `paper_trade_log` + demo portfolio |

⚠️ **006 is not optional.** The paper-trading tables were originally created by
hand in the SQL editor and were never committed, so they died with the old
project. Migrations 001–005 do not recreate them, and without 006 paper trading
fails with "Portfolio not found". The file was reverse-engineered from the
columns `src/app/api/paper-trades/route.ts` reads and writes.

## 3. Point the app at it

**Local** — edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<new-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

**Production** — set two repo secrets. The deploy workflow reads these, so no
workflow edit is needed:

```bash
gh secret set SUPABASE_URL --body "https://<new-ref>.supabase.co"
gh secret set SUPABASE_ANON_KEY --body "<anon key>"
```

Note both are `NEXT_PUBLIC_*` at build time and end up readable in the client
bundle. That is expected for the anon key. **Never** put the service-role key in
a `NEXT_PUBLIC_*` var or a GitHub secret consumed by this workflow — it is
server-side only and the static export has no server.

## 4. Redeploy the Edge Functions

```bash
supabase login                                    # as the project owner
supabase functions deploy market-prices     --project-ref <new-ref>
supabase functions deploy send-notification --project-ref <new-ref>
supabase functions deploy agent-research    --project-ref <new-ref>
supabase functions deploy alphabot-chat     --project-ref <new-ref>   # optional, unused
```

Set the secrets those functions need:

```bash
supabase secrets set FINNHUB_API_KEY=<key>       --project-ref <new-ref>   # market-prices
supabase secrets set GROQ_API_KEY=<key>          --project-ref <new-ref>   # agent-research
supabase secrets set TELEGRAM_BOT_TOKEN=<token>  --project-ref <new-ref>   # optional
```

## 5. Verify

```bash
# Query a real table — NOT /rest/v1/. The schema root rejects sb_publishable_
# keys with "Secret API key required", which looks like a broken key but isn't.
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://<ref>.supabase.co/rest/v1/alpha_signals?select=ticker&limit=1" \
  -H "apikey: <publishable key>" -H "Authorization: Bearer <publishable key>"

# Edge Function proxy — this is what gates live prices on US/India/UAE
curl -s -X POST "https://<ref>.supabase.co/functions/v1/market-prices" \
  -H "Content-Type: application/json" -H "apikey: <publishable key>" \
  -H "Authorization: Bearer <publishable key>" \
  -d '{"symbols":["NVDA"],"market":"US"}'

# Paper trading should return a portfolio, not null
curl -s http://localhost:3000/api/paper-trades

# Morning Brain should report persisted:true
curl -s -X POST http://localhost:3000/api/morning-brain \
  -H 'Content-Type: application/json' \
  -d '{"symbols":[{"symbol":"NVDA","market":"US","exchange":"NASDAQ","currency":"$"}]}'
```

Then push to `main` so the production bundle picks up the new secrets.

---

## Stale references to clean up

- `supabase/functions/alphabot-chat/index.ts` — deploy comment names the old ref
- `supabase/.temp/linked-project.json` — CLI link to the old ref (gitignored;
  `supabase link --project-ref <new-ref>` overwrites it)

## Preventing a repeat

Supabase pauses free projects after ~7 days idle and deletes them after
prolonged inactivity. That is what happened here. Either keep a scheduled job
touching the database weekly, or move to a paid tier if the data matters.
