# AlphaOS

An agentic multi-market trading platform — and a worked example of why most trading backtests are wrong.

**[Live platform](https://vinayak682.github.io/alphaos/)** · **[Full write-up](https://vinayakbhadani.com/walk-forward-validation-trading-strategies.html)** · **[Case study](https://vinayakbhadani.com/alphaos-agentic-trading-platform.html)**

---

## The result this repo leads with

The first backtest returned **+220% on AAPL** and looked excellent. It came from the same window I'd spent the afternoon tuning against, so I wrote down a walk-forward protocol, ran it once, and kept whatever came back.

| Universe | Tuned on | Tested on | In-sample edge | Out-of-sample | Drawdown saved |
|---|---|---|---:|---:|---:|
| 10 US equities | 2007–2015 | 2015–2026 | **+0.27** Sharpe | **−0.10** | 38.3pp |
| 7 crypto pairs | 2018–2022 | 2022–2026 | **+0.09** Sharpe | **−0.21** | 16.7pp |

The edge inverted in both. On crypto, **zero of five** variants held a positive out-of-sample edge.

The detail worth the click: on equities, the two variants in-sample selection *rejected* (−0.04, −0.05) were the only two with a positive out-of-sample edge (+0.04, +0.06). Selection didn't just fail to find the best strategy — it picked against it. Correlation between in-sample and out-of-sample edge across all ten runs: **+0.26**, close enough to noise.

**What did generalise, without exception:** drawdown reduction. Roughly half, in both asset classes, in every variant.

> These rules are a risk-management tool, not an alpha source. Every single-window backtest in this repo that suggests otherwise is measuring its own tuning data — including the ones the UI renders.

That conclusion is printed at the top of the platform's own strategies page, above every number it produces.

---

## What's actually here

| | |
|---|---|
| **Multi-agent research** | Four agents — news, technical, smart-money, risk — on a Supabase Edge Function with an LLM fallback chain |
| **AI signal pipeline** | Live OHLCV → RSI/MACD/EMA/ATR in pure TypeScript → Finnhub news → LLM → structured JSON → Postgres |
| **Backtesting engine** | Client-side, CORS-safe, runs in your browser. Verified against an independent Python implementation before any result was trusted |
| **Portfolio backtester** | Equal-weight basket, per-sleeve trend gating, per-sleeve P&L attribution, benchmarked on the identical window |
| **Walk-forward harness** | Arbitrary tuning/test windows, benchmark Sharpe and drawdown reported alongside the strategy's |
| **Live market data** | US, India, UAE, crypto via an Edge Function proxy — Finnhub, Yahoo, Binance |
| **Commodities** | Real $/barrel WTI and Brent back to 1986, gold spot with technicals, 19 live instruments |
| **Paper trading** | Supabase-backed positions with live mark-to-market and realised P&L |

18k lines of TypeScript · 22 routes · 4 Edge Functions · Next.js 16 · Groq `openai/gpt-oss-120b`

---

## Run the backtests yourself

No install needed — the engine runs client-side:

**[vinayak682.github.io/alphaos/strategies](https://vinayak682.github.io/alphaos/strategies/)**

Pick a strategy, a symbol and a period. Or hit **Sweep all 15** to run one strategy across the whole universe, or **Portfolio mode** to run it as an equal-weight basket. A cold sweep is paced ~8s per uncached symbol to stay inside Twelve Data's 8 req/min limit.

### Locally

```bash
git clone https://github.com/Vinayak682/alphaos.git
cd alphaos
npm install
npm run dev
```

`.env.local` needs, at minimum:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_FINNHUB_API_KEY=
NEXT_PUBLIC_TWELVEDATA_API_KEY=
GROQ_API_KEY=
NEXT_PUBLIC_GROQ_API_KEY=
```

API routes work locally only — CI strips `src/app/api` before the static export, so Morning Brain and paper trading are dev-only. The backtester, commodities and market pages all work in production.

---

## Methodology, so you can check it

- **Costs**: 5bps commission + 5bps slippage **per side**, on every rebalance. Zero-cost backtests flatter every result, short-holding strategies most of all.
- **Benchmark**: equal-weight buy-and-hold of the identical basket over the identical window, bought once at the warm-up bar.
- **Warm-up**: 200 bars before any signal fires, so SMA200 is defined and no look-ahead is possible.
- **Mark-to-market**: daily, using full OHLCV.
- **Verification**: cross-checked against an independent Python implementation — total return 27.70% vs 27.70%, end equity $12,769.95 vs $12,770, identical trade count, win rate and max drawdown.

---

## What this does *not* do

Stated plainly, because a backtester that hides its limits is worse than none:

- **The strategy specs are approximations.** The published rules require things price data cannot express — EPS growth ≥25% YoY, RS Rating ≥85, VCP base geometry, mutual-fund accumulation. Each spec carries a `notModelled` list, rendered in the UI above every result.
- **Long-only, single-symbol per sleeve, no shorts, no leverage.**
- **No parameter optimisation.** Deliberately — optimisation is where backtests start lying hardest, and the walk-forward above already shows how little in-sample ranking is worth.
- **One window per test.** Regime dominates: these rules lose badly in trending bull markets and are competitive in crashes.
- **Not financial advice.** Paper trading only. There is no broker integration and there won't be one.

---

## Notes for anyone building something similar

Four things that cost me time and might save you some:

1. **A "LIVE" badge must derive from data arriving**, never from which page or market is selected. An earlier version showed a pulsing LIVE indicator over prices that were 4× wrong, because the badge was gated on market type rather than on a response.
2. **Postgres `NUMERIC` arrives from PostgREST as a string.** `cash_balance + positionValue` concatenates. It rendered a portfolio total of `$0.00` while the cash figure beside it looked perfectly correct — division coerces, `+` doesn't.
3. **`CREATE TABLE IF NOT EXISTS` guards against the table existing, not against it existing with a different shape.** A migration that skipped an existing table then failed on an index referencing a column that table never had.
4. **A sweep that silently drops symbols reports a shrunken denominator.** Rate limits made mine quietly report 3/13 for a 15-symbol universe. Failures are now paced around and, when they happen, listed by name.

---

## Licence

MIT. Built by [Vinayak Bhadani](https://vinayakbhadani.com/) in Dubai.
