"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Brain, Plus, Play, Pause, Search, Filter,
  TrendingUp, TrendingDown, Shield, Zap, ChevronRight,
  Activity, BookOpen, BarChart3, Globe,
} from "lucide-react";
import {
  STRATEGIES, STRATEGY_COLORS, STYLE_LABELS, RISK_COLORS_MAP,
  type Strategy, type StyleType,
} from "@/lib/strategies";
import StrategyDrawer from "@/components/bot/StrategyDrawer";

// ─── Mini equity spark ────────────────────────────────────────────────────────
function Spark({ data, color }: { data: { day: number; value: number }[]; color: string }) {
  if (!data.length) return null;
  const W = 80, H = 24;
  const vals = data.map(d => d.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 2) - 1;
    return `${x},${y}`;
  });
  const colorMap: Record<string, string> = {
    blue: "#3B82F6", cyan: "#06B6D4", orange: "#F97316", green: "#22C55E",
    yellow: "#EAB308", purple: "#A855F7", indigo: "#6366F1", emerald: "#10B981",
    violet: "#8B5CF6", teal: "#14B8A6",
  };
  const c = colorMap[color] ?? "#00FF88";
  return (
    <svg width={W} height={H} className="overflow-visible shrink-0">
      <polyline points={pts.join(" ")} fill="none" stroke={c} strokeWidth="1.5"
        strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

// ─── Win rate bar ─────────────────────────────────────────────────────────────
function WinBar({ pct, color }: { pct: number; color: string }) {
  const clr = STRATEGY_COLORS[color];
  return (
    <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
      <motion.div
        className={cn("h-full rounded-full", clr?.bg?.replace("/15", "/50") ?? "bg-primary/50")}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
      />
    </div>
  );
}

// ─── Strategy card ────────────────────────────────────────────────────────────
function StrategyCard({ s, index, onClick }: { s: Strategy; index: number; onClick: () => void }) {
  const clr = STRATEGY_COLORS[s.color] ?? STRATEGY_COLORS["blue"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.38, delay: index * 0.06, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={onClick}
      className={cn(
        "bg-card border border-border rounded-xl p-4 space-y-3 cursor-pointer",
        "transition-all duration-300 relative overflow-hidden group",
        clr.glow,
      )}
    >
      {/* Subtle glow bg on hover */}
      <motion.div
        className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300", clr.bg)}
        style={{ borderRadius: "inherit" }}
      />

      {/* Status dot */}
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {s.status === "running" ? (
              <motion.div className="w-2 h-2 rounded-full bg-primary shrink-0"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }} />
            ) : s.status === "backtesting" ? (
              <motion.div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0"
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
            ) : (
              <div className="w-2 h-2 rounded-full bg-muted-foreground shrink-0" />
            )}
            <h3 className="font-semibold text-sm truncate">{s.name}</h3>
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {s.markets.map(m => (
              <span key={m} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-medium">{m}</span>
            ))}
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-medium", clr.bg, clr.text, clr.border)}>
              {STYLE_LABELS[s.style]}
            </span>
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-medium", RISK_COLORS_MAP[s.riskLevel])}>
              {s.riskLevel}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">By: {s.trader}</p>
        </div>
        <Spark data={s.equityCurve} color={s.color} />
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 relative">{s.description}</p>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 relative">
        <div className="text-center">
          <div className={cn("text-sm font-bold mono", s.pnl >= 0 ? "gain" : "loss")}>
            {s.pnl >= 0 ? "+" : ""}{s.pnl}%
          </div>
          <div className="text-[9px] text-muted-foreground">P&L</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold mono">{s.performance.winRate}%</div>
          <div className="text-[9px] text-muted-foreground">Win Rate</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold mono">{s.performance.profitFactor}</div>
          <div className="text-[9px] text-muted-foreground">Profit Factor</div>
        </div>
      </div>

      <WinBar pct={s.performance.winRate} color={s.color} />

      {/* Footer */}
      <div className="flex items-center justify-between relative">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Zap className={cn("w-3 h-3", clr.text)} />
          {s.signals} signals today
        </span>
        <span className={cn("text-[10px] font-medium flex items-center gap-0.5", clr.text)}>
          Full strategy <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </motion.div>
  );
}

// ─── Global stats banner ──────────────────────────────────────────────────────
function GlobalStats() {
  const running   = STRATEGIES.filter(s => s.status === "running").length;
  const totalPnl  = (STRATEGIES.reduce((a, s) => a + s.pnl, 0) / STRATEGIES.length).toFixed(1);
  const avgWin    = Math.round(STRATEGIES.reduce((a, s) => a + s.performance.winRate, 0) / STRATEGIES.length);
  const signals   = STRATEGIES.reduce((a, s) => a + s.signals, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="grid grid-cols-4 gap-3"
    >
      {[
        { label: "Active Bots",     value: running,          cls: "text-primary",   icon: Activity },
        { label: "Avg P&L",         value: `+${totalPnl}%`,  cls: "gain",           icon: TrendingUp },
        { label: "Avg Win Rate",    value: `${avgWin}%`,     cls: "text-foreground",icon: Shield },
        { label: "Signals Today",   value: signals,          cls: "text-yellow-400",icon: Zap },
      ].map(({ label, value, cls, icon: Icon }, i) => (
        <motion.div key={label}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 + i * 0.06 }}
          className="bg-card border border-border rounded-xl p-3 flex items-center gap-3"
        >
          <Icon className={cn("w-4 h-4 shrink-0", cls)} />
          <div>
            <div className={cn("text-base font-bold mono", cls)}>{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Filter chips ─────────────────────────────────────────────────────────────
const MARKET_FILTERS = ["All", "US", "INDIA", "UAE", "CRYPTO"];
const STYLE_FILTERS: Array<StyleType | "All"> = ["All", "SCALP", "DAY", "SWING", "POSITION", "QUANT", "MACRO"];
const RISK_FILTERS  = ["All", "LOW", "MEDIUM", "HIGH", "QUANT"];

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
        active
          ? "bg-primary/20 text-primary border border-primary/40"
          : "bg-muted/40 text-muted-foreground border border-transparent hover:border-border"
      )}
    >
      {label === "All" ? "All" : label}
    </motion.button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BotPage() {
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null);
  const [marketFilter, setMarketFilter]     = useState("All");
  const [styleFilter, setStyleFilter]       = useState<StyleType | "All">("All");
  const [riskFilter, setRiskFilter]         = useState("All");
  const [search, setSearch]                 = useState("");
  const [statusFilter, setStatusFilter]     = useState<"all" | "running" | "paused" | "backtesting">("all");

  // Auto-open drawer if ?strategy=X is in the URL (e.g. navigated from dashboard signals)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const strategyParam = params.get("strategy");
    if (strategyParam) {
      const found = STRATEGIES.find(
        (s) => s.name.toLowerCase() === strategyParam.toLowerCase()
      );
      if (found) {
        // Small delay so the page renders first
        setTimeout(() => setActiveStrategy(found), 150);
      }
    }
  }, []);

  const filtered = useMemo(() => {
    return STRATEGIES.filter(s => {
      const matchMarket = marketFilter === "All" || s.markets.includes(marketFilter);
      const matchStyle  = styleFilter  === "All" || s.style === styleFilter;
      const matchRisk   = riskFilter   === "All" || s.riskLevel === riskFilter;
      const matchStatus = statusFilter === "all"  || s.status === statusFilter;
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.trader.toLowerCase().includes(search.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      return matchMarket && matchStyle && matchRisk && matchStatus && matchSearch;
    });
  }, [marketFilter, styleFilter, riskFilter, statusFilter, search]);

  return (
    <>
      <div className="p-4 space-y-4 h-full overflow-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">AI Trading Bots</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {STRATEGIES.length} strategies · World-class traders · US · UAE · India · Crypto
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Bot
          </motion.button>
        </motion.div>

        {/* Global stats */}
        <GlobalStats />

        {/* AI ingestion banner */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-card border border-primary/30 rounded-xl p-4 flex items-start gap-3 relative overflow-hidden">
          <motion.div className="absolute inset-0 bg-gradient-to-r from-primary/6 to-transparent"
            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }} />
          <Brain className="w-5 h-5 text-primary mt-0.5 shrink-0 relative z-10" />
          <div className="relative z-10 flex-1">
            <p className="text-sm font-medium">Upload your own trader data — Claude AI builds custom bots</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              CSV/JSON trade logs → auto-parsed into entry rules, stop-loss logic, win-rate analysis &amp; live signals.
              All 10 strategies below were synthesized from top-50 global traders.
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
            className="ml-auto shrink-0 relative z-10 bg-primary/15 text-primary border border-primary/30 px-3 py-1.5 rounded-md text-xs font-medium">
            Upload CSV
          </motion.button>
        </motion.div>

        {/* Search + filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search strategies, traders, tags…"
              className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Market filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-0.5" />
            {MARKET_FILTERS.map(m => (
              <FilterChip key={m} label={m} active={marketFilter === m} onClick={() => setMarketFilter(m)} />
            ))}
            <div className="mx-1 h-4 w-px bg-border shrink-0" />
            {STYLE_FILTERS.map(st => (
              <FilterChip key={st} label={st === "All" ? "All Styles" : STYLE_LABELS[st as StyleType] ?? st}
                active={styleFilter === st} onClick={() => setStyleFilter(st as StyleType | "All")} />
            ))}
          </div>

          {/* Risk + status filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-0.5" />
            {RISK_FILTERS.map(r => (
              <FilterChip key={r} label={r === "All" ? "All Risk" : r}
                active={riskFilter === r} onClick={() => setRiskFilter(r)} />
            ))}
            <div className="mx-1 h-4 w-px bg-border shrink-0" />
            {(["all", "running", "paused", "backtesting"] as const).map(s => (
              <FilterChip key={s} label={s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
                active={statusFilter === s} onClick={() => setStatusFilter(s)} />
            ))}
          </div>
        </motion.div>

        {/* Results count */}
        <AnimatePresence>
          {filtered.length !== STRATEGIES.length && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-xs text-muted-foreground">
              Showing {filtered.length} of {STRATEGIES.length} strategies
            </motion.p>
          )}
        </AnimatePresence>

        {/* Strategy grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((s, i) => (
              <StrategyCard key={s.id} s={s} index={i} onClick={() => setActiveStrategy(s)} />
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 text-muted-foreground">
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No strategies match your filters</p>
            <button onClick={() => { setMarketFilter("All"); setStyleFilter("All"); setRiskFilter("All"); setSearch(""); }}
              className="mt-2 text-xs text-primary hover:underline">Clear all filters</button>
          </motion.div>
        )}

        {/* Data attribution footer */}
        <p className="text-[10px] text-muted-foreground text-right pb-2">
          🧠 Strategies synthesized from global top-50 traders · Entry/exit/risk rules modeled from public methodology · Backtests simulated
        </p>
      </div>

      {/* Strategy detail drawer */}
      <StrategyDrawer strategy={activeStrategy} onClose={() => setActiveStrategy(null)} />
    </>
  );
}
