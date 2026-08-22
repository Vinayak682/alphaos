"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, Circle, ChevronDown, ChevronRight,
  Zap, Brain, TrendingUp, BarChart2, Copy, ShieldAlert,
  Database, Lock, AlertTriangle, Clock, Star,
} from "lucide-react";

interface CheckItem {
  id: string;
  title: string;
  why: string;
  how: string;
  effort: "30min" | "2hr" | "4hr" | "1day" | "2day";
  impact: "CRITICAL" | "HIGH" | "MEDIUM";
  done?: boolean;
}

interface Phase {
  phase: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  items: CheckItem[];
}

const PHASES: Phase[] = [
  {
    phase: 1,
    title: "Fix What's Broken",
    subtitle: "Paper trading is live but P&L is frozen — fix price updates first",
    icon: AlertTriangle,
    color: "text-destructive",
    items: [
      {
        id: "price-feed",
        title: "Update paper position prices every 30s",
        why: "Current_price never changes after opening — P&L is always $0. Useless for paper trading.",
        how: "Add a price-refresh job to usePaperPortfolio hook: fetch /api/quotes for all open symbols → PATCH current_price in Supabase → recompute P&L. Runs every 30s.",
        effort: "2hr",
        impact: "CRITICAL",
      },
      {
        id: "copy-signal",
        title: "Wire 'Copy Trade' button on Signals page",
        why: "Signals exist but there's no way to act on them. The entire point of a signal is to open a trade.",
        how: "Add a 'Trade' button to each signal row → opens TradeModal prefilled with signal.entry, signal.sl, signal.tp, signal.symbol, signal.market.",
        effort: "30min",
        impact: "CRITICAL",
      },
      {
        id: "portfolio-live",
        title: "Replace mock portfolio positions with real paper trades",
        why: "Portfolio page shows 15 hardcoded frozen positions. Real paper trades exist in Supabase but aren't shown.",
        how: "usePaperPortfolio already returns live positions — it falls back to POSITIONS mock when empty. Once price feed is live (above), remove the POSITIONS mock array entirely.",
        effort: "30min",
        impact: "HIGH",
      },
      {
        id: "dashboard-kpis",
        title: "Wire Dashboard KPIs to real paper portfolio",
        why: "Dashboard shows hardcoded $287,450. Meaningless until paper trades have real prices.",
        how: "Already wired to usePaperPortfolio — will auto-fix once price feed is live. No code change needed.",
        effort: "30min",
        impact: "HIGH",
      },
    ],
  },
  {
    phase: 2,
    title: "Copy Trading",
    subtitle: "Let users replicate institutional and top trader positions instantly",
    icon: Copy,
    color: "text-blue-400",
    items: [
      {
        id: "copy-trader",
        title: "Copy button on Top Traders page",
        why: "The entire USP of 'copy world-class traders' does nothing. Citadel holds NVDA — one click should open a paper trade.",
        how: "Add 'Copy' button to each holding in Traders page → opens TradeModal prefilled with symbol, market, entry = current live price. No manual input needed.",
        effort: "2hr",
        impact: "CRITICAL",
      },
      {
        id: "copy-institution",
        title: "Copy button on Institutions page (13F holdings)",
        why: "13F data shows exactly what Bridgewater, D.E. Shaw bought — but can't act on it.",
        how: "Same pattern: 'Copy Position' button per holding row → prefilled TradeModal with symbol + current price.",
        effort: "2hr",
        impact: "HIGH",
      },
      {
        id: "copy-strategy",
        title: "'Trade This Strategy' on Strategies page",
        why: "10 world-class strategy definitions exist but there's no way to activate one and start paper trading it.",
        how: "Add 'Activate Strategy' button → stores selected strategy in Zustand → Signals page filters to that strategy's tickers → New Trade prefills strategy parameters.",
        effort: "4hr",
        impact: "HIGH",
      },
    ],
  },
  {
    phase: 3,
    title: "Real AI Signals — Morning Brain",
    subtitle: "Replace 10 hardcoded signals with Claude-generated analysis every morning",
    icon: Brain,
    color: "text-purple-400",
    items: [
      {
        id: "morning-brain-api",
        title: "Build /api/morning-brain endpoint",
        why: "Signals are currently 10 frozen rows. The whole AI angle is fake without this.",
        how: "POST /api/morning-brain → fetch RSI/MACD/EMA for each symbol via Polygon.io → call Claude API with technical data + recent news → parse BUY/SELL/HOLD/EXIT + entry/SL/TP/confidence → write to Supabase signals_generated table.",
        effort: "2day",
        impact: "CRITICAL",
      },
      {
        id: "signals-page-live",
        title: "Wire Signals page to Supabase signals_generated",
        why: "Signals page reads a hardcoded array. Must read from DB once Morning Brain writes real data.",
        how: "Replace SIGNALS const with useSWR('/api/signals') → reads from Supabase signals_generated table → auto-refreshes every 5 minutes.",
        effort: "2hr",
        impact: "CRITICAL",
      },
      {
        id: "morning-cron",
        title: "Schedule Morning Brain at 08:00 Asia/Dubai",
        why: "Signals need to be fresh every trading day — not manually triggered.",
        how: "Use Supabase Edge Function cron (pg_cron) or GitHub Actions scheduled workflow → POST /api/morning-brain at 08:00 GST. Edge Function approach: supabase/functions/morning-brain/index.ts",
        effort: "2hr",
        impact: "HIGH",
      },
    ],
  },
  {
    phase: 4,
    title: "Backtesting Engine",
    subtitle: "Let users test a strategy against historical data before risking paper money",
    icon: BarChart2,
    color: "text-yellow-400",
    items: [
      {
        id: "historical-data",
        title: "Seed historical OHLCV data (1-year, daily)",
        why: "No backtesting is possible without historical price data. Polygon.io free tier has 2-year daily OHLCV.",
        how: "Write a seed script: fetch Polygon.io /v2/aggs for each symbol (US + India via Twelve Data) → insert into market_candles (TimescaleDB table, Migration 002). Run once.",
        effort: "4hr",
        impact: "HIGH",
      },
      {
        id: "backtest-engine",
        title: "Build backtest simulation API",
        why: "Strategies exist as rules — need an engine to replay them against historical data.",
        how: "POST /api/backtest { strategyId, symbols[], from, to } → fetch candles from DB → apply strategy entry/exit rules → compute trades, P&L, win rate, max drawdown, Sharpe → return equity curve array.",
        effort: "2day",
        impact: "HIGH",
      },
      {
        id: "backtest-ui",
        title: "Backtest UI on Strategies page",
        why: "Results need a chart — equity curve, trade log, vs S&P500 benchmark.",
        how: "Add 'Run Backtest' button per strategy → calls /api/backtest → renders equity curve with Recharts + trade log table + metrics grid (win rate, P&L, drawdown, Sharpe).",
        effort: "4hr",
        impact: "MEDIUM",
      },
    ],
  },
  {
    phase: 5,
    title: "Risk Index — Live Computation",
    subtitle: "Replace hardcoded risk score with real-time position risk analysis",
    icon: ShieldAlert,
    color: "text-orange-400",
    items: [
      {
        id: "risk-compute",
        title: "Compute risk index from real positions",
        why: "Risk index is hardcoded 38. Should reflect actual paper portfolio exposure, concentration, VIX level.",
        how: "Build /api/risk-index → reads open paper_positions → computes: position concentration (Herfindahl), unrealised loss %, VIX from Finnhub, sector correlation → weighted score 0–100.",
        effort: "4hr",
        impact: "HIGH",
      },
    ],
  },
  {
    phase: 6,
    title: "Infrastructure",
    subtitle: "Auth, notifications, and deployment hardening",
    icon: Database,
    color: "text-muted-foreground",
    items: [
      {
        id: "notifications",
        title: "Deploy send-notification Edge Function",
        why: "Telegram + WhatsApp alerts are written but the Edge Function returns 404 — never deployed.",
        how: "supabase login (as emiratesprice@gmail.com) → supabase functions deploy send-notification --project-ref mxwrfiihmfmlhtmynpal → supabase secrets set TELEGRAM_BOT_TOKEN=<token>",
        effort: "30min",
        impact: "HIGH",
      },
      {
        id: "auth",
        title: "Add Supabase Auth (email + Google)",
        why: "Everything runs under demo UUID. Real users need their own portfolios.",
        how: "Enable Auth in Supabase dashboard → add @supabase/auth-ui-react login page → replace DEMO_USER constant with auth.uid() → update RLS policies.",
        effort: "1day",
        impact: "MEDIUM",
      },
    ],
  },
];

const EFFORT_CFG = {
  "30min": { cls: "bg-primary/10 text-primary border-primary/20",     label: "30 min" },
  "2hr":   { cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",  label: "2 hrs"  },
  "4hr":   { cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", label: "4 hrs" },
  "1day":  { cls: "bg-orange-500/10 text-orange-400 border-orange-500/20", label: "1 day" },
  "2day":  { cls: "bg-destructive/10 text-destructive border-destructive/20", label: "2 days" },
};

const IMPACT_CFG = {
  CRITICAL: { cls: "text-destructive", label: "● CRITICAL" },
  HIGH:     { cls: "text-yellow-400",  label: "● HIGH" },
  MEDIUM:   { cls: "text-blue-400",    label: "● MEDIUM" },
};

export default function DeployChecklistPage() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["1"]));

  const toggleDone = (id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allItems = PHASES.flatMap((p) => p.items);
  const doneCount = done.size;
  const totalCount = allItems.length;
  const criticalItems = allItems.filter((i) => i.impact === "CRITICAL" && !done.has(i.id));

  return (
    <div className="p-4 space-y-5 h-full overflow-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-xl font-bold flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" /> Deploy Checklist
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          The exact build plan to make the MVP real — ordered by impact
        </p>
      </motion.div>

      {/* Progress bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">MVP Progress</span>
          <span className="mono font-bold text-sm gain">{doneCount}/{totalCount} done</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full"
            animate={{ width: `${(doneCount / totalCount) * 100}%` }}
            transition={{ duration: 0.5 }} />
        </div>
        {criticalItems.length > 0 && (
          <p className="text-[10px] text-destructive mt-2">
            {criticalItems.length} CRITICAL items block the MVP: {criticalItems.map((i) => i.title.split(" ").slice(0, 4).join(" ")).join(" · ")}
          </p>
        )}
      </motion.div>

      {/* Phases */}
      <div className="space-y-3">
        {PHASES.map((phase, pi) => {
          const isExpanded = expanded.has(String(phase.phase));
          const phaseDone = phase.items.filter((i) => done.has(i.id)).length;
          const Icon = phase.icon;
          return (
            <motion.div key={phase.phase} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pi * 0.07 }}
              className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Phase header */}
              <button
                onClick={() => toggleExpanded(String(phase.phase))}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted/40 text-xs font-bold mono text-muted-foreground">
                    {phase.phase}
                  </div>
                  <Icon className={cn("w-4 h-4", phase.color)} />
                  <div className="text-left">
                    <p className="font-heading font-bold text-sm">{phase.title}</p>
                    <p className="text-[10px] text-muted-foreground">{phase.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("text-xs mono font-semibold", phaseDone === phase.items.length ? "gain" : "text-muted-foreground")}>
                    {phaseDone}/{phase.items.length}
                  </span>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border divide-y divide-border/50">
                      {phase.items.map((item) => {
                        const isDone = done.has(item.id);
                        const effortCfg = EFFORT_CFG[item.effort];
                        const impactCfg = IMPACT_CFG[item.impact];
                        return (
                          <div key={item.id} className={cn("px-4 py-4 transition-colors", isDone && "opacity-50")}>
                            <div className="flex items-start gap-3">
                              <button onClick={() => toggleDone(item.id)} className="mt-0.5 shrink-0">
                                {isDone
                                  ? <CheckCircle2 className="w-4 h-4 gain" />
                                  : <Circle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <p className={cn("font-semibold text-sm", isDone && "line-through text-muted-foreground")}>
                                    {item.title}
                                  </p>
                                  <span className={cn("text-[10px] font-bold", impactCfg.cls)}>{impactCfg.label}</span>
                                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded border", effortCfg.cls)}>
                                    {effortCfg.label}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">
                                  <span className="text-destructive font-semibold">Why it matters: </span>{item.why}
                                </p>
                                <div className="bg-muted/20 border border-border/50 rounded-lg px-3 py-2">
                                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    <span className="text-primary font-semibold">How to build: </span>{item.how}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="bg-card border border-primary/20 rounded-xl p-5 text-center space-y-2">
        <Star className="w-5 h-5 text-primary mx-auto" />
        <p className="font-heading font-bold">MVP = Phase 1 + Phase 2 + Phase 3</p>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Live prices on paper positions (Phase 1) + copy-trade from signals (Phase 1) + real AI signals (Phase 3) = a working, demonstrable product.
          Backtest + auth are phase 2 features, not blockers.
        </p>
        <p className="text-xs text-primary font-semibold">Total time to working MVP: ~3 days of focused build</p>
      </motion.div>
    </div>
  );
}
