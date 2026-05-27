"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Shield, Target, Activity, AlertTriangle, ChevronRight, BookOpen, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Strategy } from "@/lib/strategies";
import { STRATEGY_COLORS, STYLE_LABELS, RISK_COLORS_MAP } from "@/lib/strategies";

// ─── Mini equity sparkline ────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: { day: number; value: number }[]; color: string }) {
  if (!data.length) return null;
  const W = 200, H = 48;
  const vals = data.map(d => d.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  });
  const pathD = `M ${pts.join(" L ")}`;
  const fillD = `${pathD} L ${W},${H} L 0,${H} Z`;
  const colorMap: Record<string, string> = {
    blue: "#3B82F6", cyan: "#06B6D4", orange: "#F97316", green: "#22C55E",
    yellow: "#EAB308", purple: "#A855F7", indigo: "#6366F1", emerald: "#10B981",
    violet: "#8B5CF6", teal: "#14B8A6",
  };
  const c = colorMap[color] ?? "#00FF88";
  return (
    <svg width={W} height={H} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.3" />
          <stop offset="100%" stopColor={c} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#sg-${color})`} />
      <path d={pathD} stroke={c} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Drawdown bar chart ───────────────────────────────────────────────────────
function DrawdownChart({ series }: { series: number[] }) {
  const W = 320, H = 64;
  const min = Math.min(...series, -1);
  const bars = series.slice(0, 40);
  const barW = W / bars.length - 1;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="overflow-visible">
      {bars.map((v, i) => {
        const barH = Math.abs(v / min) * H;
        const alpha = Math.min(0.9, 0.3 + Math.abs(v / min) * 0.6);
        return (
          <rect
            key={i}
            x={i * (barW + 1)}
            y={H - barH}
            width={barW}
            height={barH}
            fill={`rgba(255,60,80,${alpha})`}
            rx={1}
          />
        );
      })}
      <line x1={0} y1={0} x2={W} y2={0} stroke="rgba(255,60,80,0.3)" strokeWidth={1} strokeDasharray="4,4" />
    </svg>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>
      {children}
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, cls }: { label: string; value: string | number; cls?: string }) {
  return (
    <div className="bg-muted/40 rounded-lg px-3 py-2 text-center">
      <div className={cn("text-sm font-semibold mono", cls)}>{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">{label}</div>
    </div>
  );
}

// ─── Main drawer ─────────────────────────────────────────────────────────────
interface Props { strategy: Strategy | null; onClose: () => void }

export default function StrategyDrawer({ strategy: s, onClose }: Props) {
  if (!s) return null;
  const clr = STRATEGY_COLORS[s.color] ?? STRATEGY_COLORS["blue"];

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        key="drawer"
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-[oklch(0.1_0.01_240)] border-l border-border flex flex-col overflow-hidden"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
      >
        {/* Header */}
        <div className={cn("p-5 border-b border-border", "bg-gradient-to-r from-transparent to-transparent relative overflow-hidden")}>
          <motion.div
            className="absolute inset-0 opacity-10"
            style={{ background: `radial-gradient(ellipse at top right, var(--${s.color}-500, #3B82F6), transparent 70%)` }}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border", clr.bg, clr.text, clr.border)}>
                  {STYLE_LABELS[s.style]}
                </span>
                {s.markets.map(m => (
                  <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{m}</span>
                ))}
                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded border", RISK_COLORS_MAP[s.riskLevel])}>
                  {s.riskLevel}
                </span>
              </div>
              <h2 className="text-lg font-bold leading-tight">{s.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Inspired by: {s.trader}</p>
            </div>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="shrink-0 p-1.5 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Equity sparkline */}
          <div className="mt-3">
            <Sparkline data={s.equityCurve} color={s.color} />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Performance grid */}
          <Section icon={BarChart3} title="Backtested Performance">
            <div className="grid grid-cols-4 gap-2">
              <StatPill label="Win Rate" value={`${s.performance.winRate}%`} cls="text-primary" />
              <StatPill label="CAGR" value={`${s.performance.cagr}%`} cls="gain" />
              <StatPill label="Sharpe" value={s.performance.sharpeRatio} cls="text-foreground" />
              <StatPill label="Profit Factor" value={s.performance.profitFactor} cls="text-foreground" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <StatPill label="Avg Win" value={`+${s.performance.avgProfit}%`} cls="gain" />
              <StatPill label="Avg Loss" value={`-${s.performance.avgLoss}%`} cls="loss" />
              <StatPill label="Max DD" value={`${s.performance.maxDrawdown}%`} cls="loss" />
              <StatPill label="Trades" value={s.performance.totalTrades} cls="text-foreground" />
            </div>
            <div className="mt-2">
              <p className="text-[10px] text-muted-foreground mb-1.5">Drawdown Curve</p>
              <DrawdownChart series={s.maxDrawdownSeries} />
            </div>
          </Section>

          {/* Description */}
          <Section icon={BookOpen} title="Strategy Overview">
            <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
            <div className="mt-3 space-y-1.5">
              {s.keyPrinciples.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ChevronRight className={cn("w-3 h-3 mt-0.5 shrink-0", clr.text)} />
                  {p}
                </motion.div>
              ))}
            </div>
          </Section>

          {/* Entry */}
          <Section icon={TrendingUp} title="Entry Rules">
            <div className={cn("rounded-lg p-3 border text-xs space-y-2", "bg-muted/30 border-border")}>
              <div>
                <span className={cn("font-semibold", clr.text)}>Setup: </span>
                <span className="text-muted-foreground">{s.entry.setup}</span>
              </div>
              <div>
                <span className={cn("font-semibold", clr.text)}>Timeframe: </span>
                <span className="text-muted-foreground">{s.entry.timeframe}</span>
              </div>
              <div>
                <span className={cn("font-semibold", clr.text)}>Volume: </span>
                <span className="text-muted-foreground">{s.entry.volumeCondition}</span>
              </div>
              <div>
                <span className={cn("font-semibold", clr.text)}>Confirmation: </span>
                <span className="text-muted-foreground">{s.entry.confirmation}</span>
              </div>
            </div>
            <div className="space-y-1 mt-2">
              {s.entry.triggers.map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs bg-muted/20 rounded px-2.5 py-1.5">
                  <span className={cn("font-semibold shrink-0", clr.text)}>Trigger {i + 1}:</span>
                  <span className="text-muted-foreground">{t}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {s.entry.indicators.map((ind, i) => (
                <span key={i} className={cn("text-[10px] px-2 py-1 rounded border font-mono", clr.bg, clr.text, clr.border)}>{ind}</span>
              ))}
            </div>
          </Section>

          {/* Exit */}
          <Section icon={Target} title="Exit Rules">
            <div className="space-y-2">
              {[
                { label: "Take Profit", val: s.exit.takeProfit, cls: "gain" },
                { label: "Stop Loss",   val: s.exit.stopLoss,   cls: "loss" },
                { label: "Trailing",    val: s.exit.trailingStop, cls: "text-yellow-400" },
                ...(s.exit.partialExit ? [{ label: "Scale Out", val: s.exit.partialExit, cls: "text-blue-400" }] : []),
                ...(s.exit.timeExit    ? [{ label: "Time Exit",  val: s.exit.timeExit,    cls: "text-muted-foreground" }] : []),
              ].map(({ label, val, cls }) => (
                <div key={label} className="rounded-lg bg-muted/25 px-3 py-2 text-xs border border-border/50">
                  <span className={cn("font-semibold mr-2", cls)}>{label}:</span>
                  <span className="text-muted-foreground">{val}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Risk */}
          <Section icon={Shield} title="Risk Management">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: "Position Size",   val: s.risk.positionSize },
                { label: "R:R Minimum",     val: s.risk.riskReward },
                { label: "Max Drawdown",    val: s.risk.maxDrawdown },
                { label: "Max Positions",   val: `${s.risk.maxOpenPositions} positions` },
                ...(s.risk.dailyLossLimit   ? [{ label: "Daily Loss Cap", val: s.risk.dailyLossLimit }] : []),
                ...(s.risk.correlationLimit ? [{ label: "Correlation",    val: s.risk.correlationLimit }] : []),
              ].map(({ label, val }) => (
                <div key={label} className="bg-muted/30 rounded-lg px-2.5 py-2 space-y-0.5 border border-border/50">
                  <div className="text-[10px] text-muted-foreground font-medium">{label}</div>
                  <div className="text-xs font-medium leading-snug">{val}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {s.tags.map(tag => (
              <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-muted/40 text-muted-foreground border border-border/50">
                #{tag}
              </span>
            ))}
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
            Past performance does not guarantee future results. Backtested strategies may be subject to overfitting. Always paper-trade before live deployment.
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-border flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className={cn("flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors", clr.bg, clr.text, clr.border)}
          >
            Backtest Strategy
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground"
          >
            Deploy Bot
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
