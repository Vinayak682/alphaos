"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Activity, CheckCircle2, XCircle, AlertTriangle, Clock,
  RefreshCw, Wifi, WifiOff, Loader2, Server, Database, Zap,
  TrendingUp, ShieldAlert, Brain, Copy, BarChart2, DollarSign, Fuel,
} from "lucide-react";

interface ApiStatus {
  name: string; url: string;
  status: "connected" | "degraded" | "error" | "checking";
  latencyMs: number | null; lastSuccess: Date | null; error?: string; market: string;
}
interface PriceCheck {
  symbol: string; market: string; price: number | null; source: string;
  lastUpdated: Date | null; staleness: "fresh" | "delayed" | "stale" | "offline";
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const FINNHUB_KEY  = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";
const TWELVE_KEY   = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY ?? "";
const ALPHA_KEY    = process.env.NEXT_PUBLIC_ALPHAVANTAGE_API_KEY || "demo";
const EDGE_URL     = `${SUPABASE_URL}/functions/v1/market-prices`;

// ─── FEATURE TRUTH MAP ───────────────────────────────────────────────────────
// Last reconciled against reality: 2026-08-22, after the Supabase project was
// restored.
//
// Two things dominate this map and are easy to forget:
//  1. Supabase project mxwrfiihmfmlhtmynpal is BACK, with signal and paper-trade
//     data intact and all Edge Functions deployed. The 12 reference tables were
//     re-created on 2026-08-23. `strategies` and the 003 intelligence tables are
//     intentionally empty — the former was never seeded, the latter are filled at
//     runtime — and db.ts falls back to static data for both.
//  2. CI strips src/app/api before the static export, so every API route is
//     DEV ONLY: it works on `npm run dev`, never on GitHub Pages.
const FEATURES = [
  // ─ Prices & Data
  { category: "Prices & Data", feature: "Ticker Bar Prices",      status: "LIVE",    detail: "Binance (Crypto) + Finnhub (US) + Yahoo (India/UAE) via the market-prices Edge Function" },
  { category: "Prices & Data", feature: "US Markets Page",        status: "LIVE",    detail: "14/14 live from Finnhub through the Edge Function proxy" },
  { category: "Prices & Data", feature: "India Markets Page",     status: "LIVE",    detail: "13/13 NSE stocks live from Yahoo through the Edge Function (which sidesteps Yahoo's CORS block)" },
  { category: "Prices & Data", feature: "UAE Markets Page",       status: "LIVE",    detail: "DFM/ADX stocks via Edge Function; FAB/ADNOCGAS/ETISALAT have no free feed" },
  { category: "Prices & Data", feature: "Crypto Markets Page",    status: "LIVE",    detail: "Binance REST called directly from the browser — no Supabase dependency" },
  { category: "Prices & Data", feature: "Fear & Greed Index",     status: "LIVE",    detail: "Crypto: alternative.me direct | US/India/UAE: derived from VIX/RSI" },
  { category: "Prices & Data", feature: "TradingView Charts",     status: "LIVE",    detail: "Official TradingView widget — real OHLCV charts" },
  { category: "Prices & Data", feature: "Market Intel News",      status: "LIVE",    detail: "Finnhub live financial news, called direct" },
  // ─ Commodities
  { category: "Commodities",   feature: "Oil $/barrel History",   status: "LIVE",    detail: "Real WTI + Brent per-barrel series via Alpha Vantage/EIA, back to 1986" },
  { category: "Commodities",   feature: "Gold Spot + History",    status: "LIVE",    detail: "XAU/USD spot and ~400 daily sessions via Twelve Data" },
  { category: "Commodities",   feature: "Commodity Equities",     status: "LIVE",    detail: "19 US-listed oil/gold instruments via Finnhub, all copy-tradeable" },
  { category: "Commodities",   feature: "Commodity Analytics",    status: "LIVE",    detail: "Series stats, drawdown, CAGR, Brent–WTI spread + correlation, gold technicals" },
  { category: "Commodities",   feature: "World Reference Data",   status: "STATIC",  detail: "Producers, reserves, importers, central bank gold — curated, labelled with vintage" },
  { category: "Commodities",   feature: "Non-Brent/WTI Benchmarks",status: "MISSING",detail: "Dubai/Oman, OPEC Basket, Urals, Murban — no free feed exists" },
  // ─ AI & Signals
  { category: "AI & Signals",  feature: "AlphaBot Chat",          status: "LIVE",    detail: "Groq openai/gpt-oss-120b — streaming, works on Pages via CORS" },
  { category: "AI & Signals",  feature: "AI Signal Generation",   status: "DEV",     detail: "Morning Brain is real: live OHLCV → indicators → news → AI. API route, so dev only" },
  { category: "AI & Signals",  feature: "Signal Confidence Score",status: "DEV",     detail: "Genuinely model-produced when Morning Brain runs; the Signals page still shows demo rows otherwise" },
  { category: "AI & Signals",  feature: "Signal Rationale",       status: "DEV",     detail: "Real AI rationale citing actual RSI/MACD/EMA values" },
  { category: "AI & Signals",  feature: "Signal Persistence",     status: "DEV",     detail: "Writes to signals_generated confirmed working again (persisted:true). API route, so dev only" },
  // ─ Trading
  { category: "Trading",       feature: "New Trade Modal",        status: "LIVE",    detail: "Opens and validates anywhere; the write behind it needs the database" },
  { category: "Trading",       feature: "Copy Trade from Signal", status: "LIVE",    detail: "Trade button on each signal row → TradeModal prefilled with entry/SL/TP" },
  { category: "Trading",       feature: "Copy Trader Portfolio",  status: "LIVE",    detail: "Holding chips on Traders + Institutions open a prefilled trade" },
  { category: "Trading",       feature: "Copy Trade Commodities", status: "LIVE",    detail: "Every row on the Commodities equities tab is copy-tradeable" },
  { category: "Trading",       feature: "Paper Trade DB",         status: "LIVE",    detail: "paper_portfolios / paper_positions / paper_trade_log survived the outage with data intact" },
  { category: "Trading",       feature: "Paper Portfolio P&L",    status: "DEV",     detail: "GET /api/paper-trades refreshes current_price per market — verified live. API route, so dev only" },
  { category: "Trading",       feature: "Close Position",         status: "DEV",     detail: "Realises P&L and returns cash to the balance — API route, so dev only" },
  // ─ Strategy
  { category: "Strategy",      feature: "Strategy Definitions",   status: "STATIC",  detail: "10 strategies with rules — good reference data" },
  { category: "Strategy",      feature: "Backtesting Engine",     status: "MISSING", detail: "No backtesting — needs historical OHLCV + simulation loop" },
  { category: "Strategy",      feature: "Strategy P&L History",   status: "STATIC",  detail: "Win rate / R:R / returns are illustrative and now labelled as such — no backtest engine exists to measure them" },
  { category: "Strategy",      feature: "Apply Strategy to Trade",status: "MISSING", detail: "No 'trade this strategy' button wired to paper trading" },
  // ─ Portfolio & Risk
  { category: "Portfolio & Risk", feature: "Portfolio Positions", status: "LIVE",    detail: "Reads paper_positions directly from Supabase on Pages; demo rows only when nothing is readable, and badged DEMO" },
  { category: "Portfolio & Risk", feature: "Portfolio KPIs",      status: "LIVE",    detail: "Real balance: $100,234.62 total, $99,161.02 cash. NUMERIC-as-string coercion fixed the $0.00 total" },
  { category: "Portfolio & Risk", feature: "Equity Curve",        status: "LIVE",    detail: "Rebuilt from paper_trade_log — realised equity per trade, final point marked to market. Flat between trades by construction" },
  { category: "Portfolio & Risk", feature: "Risk Index",          status: "LIVE",    detail: "Computed: SPY 30d realised vol + Fear&Greed + real concentration/exposure. Weights disclosed in-page" },
  { category: "Portfolio & Risk", feature: "Risk Radar",          status: "LIVE",    detail: "4 of 6 dimensions computed live; Correlation and Geo Risk shown as unavailable rather than invented" },
  { category: "Portfolio & Risk", feature: "Live Quotes Page",   status: "LIVE",    detail: "/markets repointed from the stripped /api/quotes to the Edge Function — all 4 markets, badge derives from liveCount" },
  { category: "Portfolio & Risk", feature: "Market Overview Strip",status: "LIVE",    detail: "Was hardcoded and wrong on every tile. ADX/DFM + NIFTY 50 dropped rather than faked — no honest free source" },
  // ─ Infrastructure
  { category: "Infrastructure", feature: "Supabase Project",      status: "LIVE",    detail: "mxwrfiihmfmlhtmynpal restored; now authenticated with a sb_publishable_ key" },
  { category: "Infrastructure", feature: "Reference Tables",      status: "LIVE",    detail: "All 12 restored 2026-08-23. us_institutions 9 rows, india_superinvestors 4, uae_dividend_stocks 15" },
  { category: "Infrastructure", feature: "Paper Trading Schema",  status: "LIVE",    detail: "Survived intact; also committed as migration 006, which was never in the repo before" },
  { category: "Infrastructure", feature: "Supabase Auth",         status: "MISSING", detail: "No login — all data under demo UUID" },
  { category: "Infrastructure", feature: "Morning Brain (Cron)",  status: "MISSING", detail: "Pipeline exists but nothing schedules it — no daily run" },
  { category: "Infrastructure", feature: "Notification Delivery", status: "BROKEN",  detail: "send-notification Edge Function is deployed and responding, but TELEGRAM_BOT_TOKEN was never set" },
  { category: "Infrastructure", feature: "Research Agents",       status: "LIVE",    detail: "agent-research redeployed 2026-08-23 on openai/gpt-oss-120b — all 4 modes return 200" },
  { category: "Infrastructure", feature: "GitHub Pages Deploy",   status: "LIVE",    detail: "Push to main → static export → live in ~60s, Node 24" },
];

const STATUS_CFG = {
  LIVE:    { cls: "bg-primary/15 text-primary border-primary/30",              label: "LIVE",    dot: "bg-primary" },
  // Built and genuinely working, but behind an API route — CI deletes src/app/api
  // before the static export, so it runs locally and never on GitHub Pages.
  DEV:     { cls: "bg-purple-500/15 text-purple-400 border-purple-500/30",      label: "DEV ONLY",dot: "bg-purple-400" },
  STATIC:  { cls: "bg-blue-500/15 text-blue-400 border-blue-500/30",           label: "STATIC",  dot: "bg-blue-400" },
  FAKE:    { cls: "bg-destructive/15 text-destructive border-destructive/30",   label: "FAKE",    dot: "bg-destructive" },
  BROKEN:  { cls: "bg-orange-500/15 text-orange-400 border-orange-500/30",      label: "BROKEN",  dot: "bg-orange-400" },
  MISSING: { cls: "bg-muted text-muted-foreground border-border",               label: "MISSING", dot: "bg-muted-foreground" },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Prices & Data": Activity,
  "Commodities":   Fuel,
  "AI & Signals":  Brain,
  "Trading":       DollarSign,
  "Strategy":      BarChart2,
  "Portfolio & Risk": ShieldAlert,
  "Infrastructure": Server,
};

async function probeApi(name: string, url: string, market: string, init?: RequestInit): Promise<ApiStatus> {
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), ...init });
    const latency = Date.now() - start;
    if (!res.ok) return { name, url, status: "error", latencyMs: latency, lastSuccess: null, error: `HTTP ${res.status}`, market };
    return { name, url, status: latency > 3000 ? "degraded" : "connected", latencyMs: latency, lastSuccess: new Date(), market };
  } catch (e) {
    return { name, url, status: "error", latencyMs: Date.now() - start, lastSuccess: null, error: e instanceof Error ? e.message : "Unknown", market };
  }
}

export default function AuditPage() {
  const [apis, setApis] = useState<ApiStatus[]>([]);
  const [priceChecks, setPriceChecks] = useState<PriceCheck[]>([]);
  const [checking, setChecking] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const runAudit = useCallback(async () => {
    setChecking(true);
    const probes = await Promise.allSettled([
      probeApi("Finnhub REST",       `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${FINNHUB_KEY}`, "US"),
      probeApi("Binance",             "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT", "Crypto"),
      probeApi("Yahoo Finance",       "https://query2.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=1d", "US/India/UAE"),
      probeApi("Supabase DB",         `${SUPABASE_URL}/rest/v1/`, "Database", {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      }),
      probeApi("Edge Function",       EDGE_URL, "All Markets", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ symbols: ["AAPL"], market: "US" }),
      }),
      probeApi("Paper Trade API",     "/api/paper-trades", "Trading"),
      probeApi("Groq LLM",            "https://api.groq.com/openai/v1/models", "AI Chat"),
      probeApi("Crypto Fear & Greed", "https://api.alternative.me/fng/?limit=1", "Crypto"),
      probeApi("Twelve Data",         `https://api.twelvedata.com/quote?symbol=XAU/USD&apikey=${TWELVE_KEY}`, "Gold"),
      probeApi("Alpha Vantage",       `https://www.alphavantage.co/query?function=BRENT&interval=monthly&apikey=${ALPHA_KEY}`, "Oil $/bbl"),
    ]);
    setApis(probes.map((p) => p.status === "fulfilled" ? p.value : { name: "Unknown", url: "", status: "error" as const, latencyMs: null, lastSuccess: null, market: "" }));

    try {
      const [usRes, inRes, uaeRes, cryptoRes] = await Promise.allSettled([
        fetch(EDGE_URL, { method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, body: JSON.stringify({ symbols: ["NVDA","AAPL","MSFT"], market: "US" }), signal: AbortSignal.timeout(10000) }),
        fetch(EDGE_URL, { method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, body: JSON.stringify({ symbols: ["RELIANCE","HDFCBANK"], market: "INDIA" }), signal: AbortSignal.timeout(10000) }),
        fetch(EDGE_URL, { method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, body: JSON.stringify({ symbols: ["EMAAR"], market: "UAE" }), signal: AbortSignal.timeout(10000) }),
        fetch("https://api.binance.com/api/v3/ticker/price?symbols=[%22BTCUSDT%22,%22ETHUSDT%22]", { signal: AbortSignal.timeout(5000) }),
      ]);

      const checks: PriceCheck[] = [];
      if (usRes.status === "fulfilled" && usRes.value.ok) {
        const d = await usRes.value.json();
        (d.prices ?? []).forEach((p: Record<string, unknown>) => {
          const age = Date.now() / 1000 - (p.timestamp as number);
          checks.push({ symbol: p.symbol as string, market: "US", price: p.price as number, source: p.source as string, lastUpdated: new Date((p.timestamp as number) * 1000), staleness: age > 3600 ? "stale" : age > 300 ? "delayed" : "fresh" });
        });
      }
      if (inRes.status === "fulfilled" && inRes.value.ok) {
        const d = await inRes.value.json();
        (d.prices ?? []).forEach((p: Record<string, unknown>) => {
          const age = Date.now() / 1000 - (p.timestamp as number);
          checks.push({ symbol: p.symbol as string, market: "INDIA", price: p.price as number, source: p.source as string, lastUpdated: new Date((p.timestamp as number) * 1000), staleness: age > 3600 ? "stale" : age > 300 ? "delayed" : "fresh" });
        });
      }
      if (uaeRes.status === "fulfilled" && uaeRes.value.ok) {
        const d = await uaeRes.value.json();
        (d.prices ?? []).forEach((p: Record<string, unknown>) => {
          const age = Date.now() / 1000 - (p.timestamp as number);
          checks.push({ symbol: p.symbol as string, market: "UAE", price: p.price as number, source: p.source as string, lastUpdated: new Date((p.timestamp as number) * 1000), staleness: age > 3600 ? "stale" : age > 300 ? "delayed" : "fresh" });
        });
      }
      if (cryptoRes.status === "fulfilled" && cryptoRes.value.ok) {
        const d = await cryptoRes.value.json();
        (d as { symbol: string; price: string }[]).forEach((p) => {
          checks.push({ symbol: p.symbol, market: "CRYPTO", price: parseFloat(p.price), source: "Binance", lastUpdated: new Date(), staleness: "fresh" });
        });
      }
      setPriceChecks(checks);
    } catch { setPriceChecks([]); }

    setLastRun(new Date());
    setChecking(false);
  }, []);

  useEffect(() => { runAudit(); }, [runAudit]);

  const categories = ["ALL", ...Array.from(new Set(FEATURES.map((f) => f.category)))];
  const filtered = selectedCategory === "ALL" ? FEATURES : FEATURES.filter((f) => f.category === selectedCategory);

  const liveCount    = FEATURES.filter((f) => f.status === "LIVE").length;
  const devCount     = FEATURES.filter((f) => f.status === "DEV").length;
  const fakeCount    = FEATURES.filter((f) => f.status === "FAKE" || f.status === "BROKEN").length;
  const missingCount = FEATURES.filter((f) => f.status === "MISSING").length;
  const connectedApis = apis.filter((a) => a.status === "connected").length;

  return (
    <div className="p-4 space-y-5 h-full overflow-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> AlphaOS Audit
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full truth — what&apos;s live, what&apos;s fake, what&apos;s missing
            {lastRun && <span> · Run {lastRun.toLocaleTimeString()}</span>}
          </p>
        </div>
        <button onClick={runAudit} disabled={checking}
          className={cn("flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
            checking ? "bg-muted text-muted-foreground border-border" : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20")}>
          {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {checking ? "Running…" : "Run Audit"}
        </button>
      </motion.div>

      {/* Score strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Live on Pages",    value: liveCount,    total: FEATURES.length, cls: "gain",               icon: CheckCircle2 },
          { label: "Dev Only",         value: devCount,     total: FEATURES.length, cls: "text-purple-400",    icon: Server },
          { label: "Fake / Broken",    value: fakeCount,    total: FEATURES.length, cls: "loss",               icon: XCircle },
          { label: "Not Built Yet",    value: missingCount, total: FEATURES.length, cls: "text-muted-foreground", icon: AlertTriangle },
          { label: "APIs Connected",   value: connectedApis,total: apis.length,     cls: apis.length > 0 && connectedApis === apis.length ? "gain" : "text-yellow-400", icon: Wifi },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <Icon className={cn("w-5 h-5", card.cls)} />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{card.label}</p>
                <p className={cn("font-heading font-bold text-xl mono", card.cls)}>
                  {card.value}<span className="text-muted-foreground text-sm font-normal">/{card.total}</span>
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Feature Truth Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm font-bold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Feature Status — The Full Truth
          </h2>
          <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={cn("px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all",
                  selectedCategory === cat ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {cat === "ALL" ? "All" : cat.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {["CATEGORY", "FEATURE", "STATUS", "DETAIL"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => {
                const cfg = STATUS_CFG[f.status as keyof typeof STATUS_CFG];
                const Icon = CATEGORY_ICONS[f.category] ?? Activity;
                return (
                  <motion.tr key={`${f.category}-${f.feature}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-border/40 hover:bg-muted/10">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon className="w-3 h-3" /> {f.category}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-xs">{f.feature}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold w-fit", cfg.cls)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-xs">{f.detail}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* API Health */}
      <div className="space-y-2">
        <h2 className="font-heading text-sm font-bold flex items-center gap-2">
          <Server className="w-4 h-4 text-muted-foreground" /> Live API Health
        </h2>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {["API", "MARKET", "STATUS", "LATENCY", "LAST OK"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apis.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-sm">Click Run Audit</td></tr>
              )}
              {apis.map((api, i) => (
                <motion.tr key={api.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border/40">
                  <td className="px-4 py-3 font-medium text-xs">{api.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{api.market}</td>
                  <td className="px-4 py-3">
                    <span className={cn("flex items-center gap-1.5 text-xs font-bold",
                      api.status === "connected" ? "gain" : api.status === "degraded" ? "text-yellow-400" : api.status === "checking" ? "text-muted-foreground" : "loss")}>
                      {api.status === "connected" ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                       api.status === "degraded"  ? <AlertTriangle className="w-3.5 h-3.5" /> :
                       api.status === "checking"  ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                       <XCircle className="w-3.5 h-3.5" />}
                      {api.status.toUpperCase()}
                    </span>
                    {api.error && <p className="text-[10px] text-destructive/80 mt-0.5">{api.error}</p>}
                  </td>
                  <td className="px-4 py-3 mono text-xs text-muted-foreground">{api.latencyMs !== null ? `${api.latencyMs}ms` : "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{api.lastSuccess ? api.lastSuccess.toLocaleTimeString() : "Never"}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price spot-check */}
      {priceChecks.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-heading text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" /> Price Freshness
          </h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {["SYMBOL", "MARKET", "PRICE", "SOURCE", "AGE", "STATUS"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {priceChecks.map((pc, i) => (
                  <motion.tr key={`${pc.market}-${pc.symbol}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-border/40">
                    <td className="px-4 py-2.5 mono font-bold text-xs">{pc.symbol}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{pc.market}</td>
                    <td className="px-4 py-2.5 mono font-semibold text-xs">
                      {pc.price !== null ? (pc.market === "INDIA" ? `₹${pc.price.toLocaleString()}` : pc.market === "UAE" ? `د.إ${pc.price.toFixed(2)}` : `$${pc.price.toLocaleString()}`) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{pc.source}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{pc.lastUpdated ? pc.lastUpdated.toLocaleTimeString() : "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold w-fit",
                        pc.staleness === "fresh"   ? "bg-primary/15 text-primary border-primary/30" :
                        pc.staleness === "delayed" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" :
                        "bg-destructive/15 text-destructive border-destructive/30")}>
                        {pc.staleness === "fresh" ? <Wifi className="w-3 h-3" /> : pc.staleness === "delayed" ? <Clock className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {pc.staleness.toUpperCase()}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Link to checklist */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="bg-card border border-primary/20 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="font-heading font-bold text-sm">Ready to fix all of this?</p>
          <p className="text-xs text-muted-foreground mt-0.5">See the exact build plan — what to build next to make the MVP real</p>
        </div>
        <a href="/deploy-checklist"
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-black rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors">
          Deploy Checklist →
        </a>
      </motion.div>
    </div>
  );
}
