"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, Minus, LogOut, ChevronDown, ChevronUp,
  Filter, Zap, AlertCircle, Info,
} from "lucide-react";

interface Signal {
  id: string;
  ticker: string;
  exchange: string;
  market: "US" | "UAE" | "INDIA";
  action: "BUY" | "SELL" | "HOLD" | "EXIT";
  entry: number;
  sl: number | null;
  t1: number | null;
  t2: number | null;
  rr: number | null;
  confidence: number;
  risk: number;
  rationale: string;
  newsItem: string;
  generatedAt: string;
  currency: string;
}

const SIGNALS: Signal[] = [
  { id: "1", ticker: "NVDA",     exchange: "NASDAQ", market: "US",    action: "BUY",  entry: 918.00, sl: 898.00, t1: 960.00,  t2: 1005.00, rr: 2.1, confidence: 88, risk: 28, currency: "$",  generatedAt: "08:14", rationale: "RSI breakout from 8-week consolidation zone with institutional accumulation confirmed via 13F. MACD crossover aligned with positive earnings revision momentum.", newsItem: "Jensen Huang confirms next-gen Blackwell Ultra chip ahead of schedule — HIGH impact" },
  { id: "2", ticker: "FAB",      exchange: "ADX",    market: "UAE",   action: "BUY",  entry: 14.60,  sl: 14.00,  t1: 15.80,   t2: 16.50,   rr: 2.5, confidence: 84, risk: 34, currency: "د.إ", generatedAt: "08:21", rationale: "First Abu Dhabi Bank showing strong support at 14.00 with DFM major institutional buying of 8.2M shares. Oil price tailwind supports UAE banking NIM expansion.", newsItem: "UAE GDP grows 4.3% Q1 2026, FAB reports record net profit — HIGH impact" },
  { id: "3", ticker: "HDFCBANK", exchange: "NSE",    market: "INDIA", action: "BUY",  entry: 1640.0, sl: 1580.0, t1: 1750.00, t2: 1820.00, rr: 1.9, confidence: 81, risk: 41, currency: "₹",  generatedAt: "08:29", rationale: "HDFC Bank consolidating above key EMA50 for 3 weeks. RBI rate hold supportive of NIMs. FII net buying ₹2,400Cr in last 5 sessions with no insider selling flagged.", newsItem: "RBI holds repo rate at 6.25%, governor signals easing bias — MEDIUM impact" },
  { id: "4", ticker: "RELIANCE", exchange: "NSE",    market: "INDIA", action: "EXIT", entry: 2944.0, sl: null,   t1: null,    t2: null,    rr: null,confidence: 72, risk: 62, currency: "₹",  generatedAt: "08:31", rationale: "RSI at 74 (overbought territory). Distribution pattern forming on daily chart. SEBI insider disclosure shows promoter selling ₹340Cr worth of shares last week.", newsItem: "SEBI flags insider trading disclosure — promoter sold ₹340Cr — HIGH impact" },
  { id: "5", ticker: "AAPL",     exchange: "NASDAQ", market: "US",    action: "HOLD", entry: 189.00, sl: 181.00, t1: 198.00,  t2: 210.00,  rr: 1.6, confidence: 70, risk: 38, currency: "$",  generatedAt: "08:35", rationale: "Apple trading in tight range ahead of WWDC. AI features announcement is a pending catalyst. Institutional holdings unchanged. Hold existing position, avoid adding at current levels.", newsItem: "WWDC 2026 scheduled for June 9 — AI model integration expected — MEDIUM impact" },
  { id: "6", ticker: "EMAAR",    exchange: "DFM",    market: "UAE",   action: "BUY",  entry: 8.92,   sl: 8.50,   t1: 9.60,    t2: 10.20,   rr: 2.2, confidence: 79, risk: 31, currency: "د.إ", generatedAt: "08:38", rationale: "Emaar Properties at 6-month support level with volume surge. Dubai real estate transaction volumes up 31% YoY. Geopolitical risk premium unwinding as regional tensions ease.", newsItem: "Dubai real estate volumes hit 5-year high, Emaar sales up 28% — HIGH impact" },
  { id: "7", ticker: "TSLA",     exchange: "NASDAQ", market: "US",    action: "SELL", entry: 182.00, sl: 195.00, t1: 162.00,  t2: 148.00,  rr: 1.8, confidence: 76, risk: 58, currency: "$",  generatedAt: "08:42", rationale: "Tesla breaking below 50-day EMA on above-average volume. China EV market share fell to 11% from 18% YoY. Institutional de-risking detected via 13F delta analysis.", newsItem: "Tesla China market share hits new low as BYD dominates — HIGH impact" },
  { id: "8", ticker: "TCS",      exchange: "NSE",    market: "INDIA", action: "HOLD", entry: 3820.0, sl: 3650.0, t1: 4050.00, t2: 4200.00, rr: 1.7, confidence: 73, risk: 29, currency: "₹",  generatedAt: "08:45", rationale: "TCS in healthy uptrend above EMA200. Q4 results beat consensus by 4.2%. Deal pipeline guidance remains strong. Awaiting deal win announcements before adding.", newsItem: "TCS wins $500M BFSI deal — management guides for strong FY27 — MEDIUM impact" },
  { id: "9", ticker: "ADNOCGAS", exchange: "ADX",    market: "UAE",   action: "BUY",  entry: 4.32,   sl: 4.10,   t1: 4.75,    t2: 5.10,    rr: 2.0, confidence: 82, risk: 27, currency: "د.إ", generatedAt: "08:51", rationale: "ADNOC Gas dividend yield at 5.8% with LNG export contract renewal driving 22% revenue growth. Sovereign fund ADIA has been accumulating over 4 weeks.", newsItem: "ADNOC Gas secures 10-year LNG contract with Japanese buyers — HIGH impact" },
  { id: "10", ticker: "MSFT",    exchange: "NASDAQ", market: "US",    action: "BUY",  entry: 418.00, sl: 403.00, t1: 445.00,  t2: 468.00,  rr: 2.4, confidence: 85, risk: 24, currency: "$",  generatedAt: "08:55", rationale: "Microsoft Azure AI revenue growing 35% YoY. Copilot enterprise adoption exceeding expectations. Massive institutional inflows from Citadel and D.E. Shaw detected in recent 13F.", newsItem: "Azure AI workloads up 35% — Microsoft raises full-year guidance — HIGH impact" },
];

const ACTION_CFG = {
  BUY:  { label: "BUY",  icon: TrendingUp,  cls: "bg-primary/15 text-primary border-primary/40",          dot: "bg-primary" },
  SELL: { label: "SELL", icon: TrendingDown,cls: "bg-destructive/15 text-destructive border-destructive/40",dot: "bg-destructive" },
  HOLD: { label: "HOLD", icon: Minus,       cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/40",  dot: "bg-yellow-400" },
  EXIT: { label: "EXIT", icon: LogOut,      cls: "bg-orange-500/15 text-orange-400 border-orange-500/40",  dot: "bg-orange-400" },
};

const MARKET_CLR: Record<string, string> = {
  US:    "text-blue-400",
  UAE:   "text-purple-400",
  INDIA: "text-green-400",
};

function RRBar({ rr }: { rr: number }) {
  const pct = Math.min((rr / 3) * 100, 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", rr >= 2 ? "bg-primary" : "bg-yellow-400")}
        />
      </div>
      <span className="mono text-xs font-semibold">{rr}x</span>
    </div>
  );
}

function ConfBar({ val, max = 100 }: { val: number; max?: number }) {
  const pct = (val / max) * 100;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className={cn("h-full rounded-full", val >= 80 ? "bg-primary" : val >= 70 ? "bg-yellow-400" : "bg-orange-400")}
        />
      </div>
      <span className={cn("mono text-xs font-semibold", val >= 80 ? "gain" : val >= 70 ? "text-yellow-400" : "text-orange-400")}>
        {val}%
      </span>
    </div>
  );
}

function SignalRow({ s, idx }: { s: Signal; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = ACTION_CFG[s.action];
  const Icon = cfg.icon;

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: idx * 0.04 }}
        className="border-b border-border/50 hover:bg-accent/30 cursor-pointer transition-colors group"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className={cn("flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-bold shrink-0", cfg.cls)}>
              <Icon className="w-3 h-3" />
              {cfg.label}
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div>
            <span className="mono font-bold text-sm">{s.ticker}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-muted-foreground">{s.exchange}</span>
              <span className={cn("text-[10px] font-medium", MARKET_CLR[s.market])}>{s.market}</span>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 mono text-sm">{s.entry !== null ? `${s.currency}${s.entry.toLocaleString()}` : "—"}</td>
        <td className="px-4 py-3 mono text-sm text-destructive">{s.sl !== null ? `${s.currency}${s.sl.toLocaleString()}` : "—"}</td>
        <td className="px-4 py-3 mono text-sm gain">{s.t1 !== null ? `${s.currency}${s.t1.toLocaleString()}` : "—"}</td>
        <td className="px-4 py-3 mono text-sm gain opacity-70">{s.t2 !== null ? `${s.currency}${s.t2.toLocaleString()}` : "—"}</td>
        <td className="px-4 py-3">{s.rr !== null ? <RRBar rr={s.rr} /> : <span className="text-muted-foreground text-xs">—</span>}</td>
        <td className="px-4 py-3"><ConfBar val={s.confidence} /></td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${s.risk}%`, background: s.risk >= 60 ? "#FF3060" : s.risk >= 40 ? "#F59E0B" : "#00FF88" }} />
            </div>
            <span className={cn("mono text-xs", s.risk >= 60 ? "loss" : s.risk >= 40 ? "text-yellow-400" : "gain")}>{s.risk}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground mono">{s.generatedAt} UAE</span>
            <span className={cn("transition-transform duration-200 text-muted-foreground", expanded && "rotate-180")}>
              <ChevronDown className="w-3.5 h-3.5" />
            </span>
          </div>
        </td>
      </motion.tr>

      <AnimatePresence>
        {expanded && (
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <td colSpan={10} className="px-4 pb-4 pt-0 bg-accent/20">
              <div className="flex gap-6 p-4 rounded-lg border border-border/50 bg-card/50">
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 font-semibold">AI Rationale</p>
                  <p className="text-sm text-foreground/90 leading-relaxed">{s.rationale}</p>
                </div>
                <div className="w-72 shrink-0 border-l border-border pl-6">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> News Catalyst
                  </p>
                  <p className="text-xs text-foreground/80 leading-relaxed">{s.newsItem}</p>
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

export default function SignalsPage() {
  const [marketFilter, setMarketFilter] = useState<"ALL" | "US" | "UAE" | "INDIA">("ALL");
  const [actionFilter, setActionFilter] = useState<"ALL" | "BUY" | "SELL" | "HOLD" | "EXIT">("ALL");

  const filtered = SIGNALS.filter((s) => {
    if (marketFilter !== "ALL" && s.market !== marketFilter) return false;
    if (actionFilter !== "ALL" && s.action !== actionFilter) return false;
    return true;
  });

  const counts = {
    BUY:  SIGNALS.filter((s) => s.action === "BUY").length,
    SELL: SIGNALS.filter((s) => s.action === "SELL").length,
    HOLD: SIGNALS.filter((s) => s.action === "HOLD").length,
    EXIT: SIGNALS.filter((s) => s.action === "EXIT").length,
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-heading text-xl font-bold">Signals</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Morning brain run · 08:00 UAE · {SIGNALS.length} signals generated</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-xs text-muted-foreground">Live · May 27</span>
        </div>
      </motion.div>

      {/* Action summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {(["BUY", "SELL", "HOLD", "EXIT"] as const).map((action, i) => {
          const cfg = ACTION_CFG[action];
          return (
            <motion.button
              key={action}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              onClick={() => setActionFilter(actionFilter === action ? "ALL" : action)}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border transition-all",
                actionFilter === action ? cn("border-current/40", cfg.cls) : "bg-card border-border hover:border-border/80"
              )}
            >
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">{action} SIGNALS</p>
                <p className="font-heading text-2xl font-bold mt-0.5 mono">{counts[action]}</p>
              </div>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", cfg.cls)}>
                <cfg.icon className="w-4 h-4" />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground mr-1">Market:</span>
        {(["ALL", "US", "UAE", "INDIA"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMarketFilter(m)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
              marketFilter === m
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
            )}
          >
            {m}
          </button>
        ))}
        <div className="w-px h-4 bg-border mx-1" />
        <span className="text-xs text-muted-foreground mr-1">Action:</span>
        {(["ALL", "BUY", "SELL", "HOLD", "EXIT"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setActionFilter(a)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
              actionFilter === a
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
            )}
          >
            {a}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Info className="w-3 h-3" />
          Click any row to expand rationale
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["ACTION", "TICKER", "ENTRY", "STOP LOSS", "TARGET 1", "TARGET 2", "R:R", "CONFIDENCE", "RISK", "TIME"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((s, i) => (
                  <SignalRow key={s.id} s={s} idx={i} />
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No signals match current filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
