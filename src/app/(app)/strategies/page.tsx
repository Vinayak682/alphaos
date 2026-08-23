"use client";
import BacktestPanel from "@/components/strategies/BacktestPanel";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatPct } from "@/lib/utils";
import { useStrategyBacktests } from "@/hooks/useStrategyBacktests";
import type { BacktestResult } from "@/lib/backtest";
import { WALK_FORWARD as WF } from "@/lib/backtest";
import { Zap, ChevronDown, BarChart2, ShieldAlert } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";

const STRATEGIES = [
  {
    id: 1, name: "Momentum Surge", style: "TREND", markets: ["US", "India"],
    active: true,
    description: "Identifies strong momentum breakouts above 52-week highs with institutional volume confirmation. Uses RSI, MACD, and EMA200 alignment.",
    indicators: ["RSI(14) > 60", "MACD crossover", "EMA200 uptrend", "Volume > 150% avg"],
    color: "#00FF88",
  },
  {
    id: 2, name: "Mean Reversion", style: "COUNTER", markets: ["US", "UAE"],
    active: true,
    description: "Trades mean reversion to fair value when assets are 2+ standard deviations from Bollinger Bands. Works best in ranging, non-trending markets.",
    indicators: ["BB lower touch", "RSI < 30", "Volume spike", "Price momentum reversal"],
    color: "#60a5fa",
  },
  {
    id: 3, name: "News Catalyst", notBacktestable: "Needs historical news + sentiment scores — no free archive", style: "EVENT", markets: ["US", "UAE", "India"],
    active: true,
    description: "Trades high-impact news events: earnings beats, major deals, regulatory approvals. Claude AI scores news sentiment and acts within minutes of release.",
    indicators: ["Sentiment > 0.7", "Impact: HIGH", "Volume surge", "Price gap"],
    color: "#F59E0B",
  },
  {
    id: 4, name: "Copy Trade", notBacktestable: "Needs point-in-time 13F / bulk-deal history", style: "SMART$", markets: ["US", "India"],
    active: true,
    description: "Follows top-100 institutional traders from SEC 13F filings and NSE bulk deals. Mirrors institutional accumulation with a 2-day lag.",
    indicators: ["13F new position", "Block deal > ₹100Cr", "Inst. ownership delta", "Price trend aligned"],
    color: "#a855f7",
  },
  {
    id: 5, name: "Cross-Market Arb", notBacktestable: "Needs paired ADR + NSE ticks and intraday FX", style: "ARB", markets: ["US", "India"],
    active: false,
    description: "Exploits price divergence between Indian ADRs traded on NYSE and their NSE equivalents. Currently in paper trading mode — requires fast execution.",
    indicators: ["ADR premium > 2%", "NSE equivalent price", "FX rate (USD/INR)", "Execution window"],
    color: "#6b7280",
  },
  {
    id: 6, name: "Geo Hedge", notBacktestable: "Needs a GDELT risk-score time series", style: "MACRO", markets: ["UAE", "Global"],
    active: true,
    description: "Hedges geopolitical risk using GDELT risk scores. Shifts allocation to defensive UAE sovereign-backed stocks when regional tensions spike above threshold.",
    indicators: ["GDELT risk > 60", "VIX spike", "Oil price movement", "USD strength"],
    color: "#14b8a6",
  },
];

// PERF_DATA removed — the chart is built from measured backtest results.

const STYLE_CLR: Record<string, string> = {
  TREND:   "text-green-400 bg-green-400/10",
  COUNTER: "text-blue-400 bg-blue-400/10",
  EVENT:   "text-yellow-400 bg-yellow-400/10",
  "SMART$":"text-purple-400 bg-purple-400/10",
  ARB:     "text-gray-400 bg-gray-400/10",
  MACRO:   "text-teal-400 bg-teal-400/10",
};

function StrategyCard({ s, delay, bt, btLoading }: { s: typeof STRATEGIES[0]; delay: number; bt?: BacktestResult; btLoading: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={cn(
        "bg-card border rounded-xl overflow-hidden transition-colors",
        s.active ? "border-border hover:border-border/80" : "border-border/40 opacity-70"
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", STYLE_CLR[s.style])}>{s.style}</span>
              {s.active
                ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary">ACTIVE</span>
                : <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">PAPER</span>
              }
            </div>
            <h3 className="font-heading font-bold text-base">{s.name}</h3>
            <div className="flex gap-1.5 mt-1">
              {s.markets.map((m) => (
                <span key={m} className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{m}</span>
              ))}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${s.color}20` }}>
            <Zap className="w-5 h-5" style={{ color: s.color }} />
          </div>
        </div>

        {bt ? (
          <>
            {/* Drawdown leads, because it is the only property that survived
                walk-forward. Return is shown honestly beside its benchmark. */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[
                { label: "Max DD",   value: `−${bt.metrics.maxDrawdownPct.toFixed(0)}%`,
                  color: bt.metrics.maxDrawdownPct < bt.metrics.buyHoldMaxDdPct ? "gain" : "loss",
                  sub: `B&H −${bt.metrics.buyHoldMaxDdPct.toFixed(0)}%` },
                { label: "Win Rate", value: `${bt.metrics.winRate.toFixed(0)}%`, color: "text-foreground",
                  sub: `${bt.metrics.tradeCount} trades` },
                { label: "Sharpe",   value: bt.metrics.sharpe != null ? bt.metrics.sharpe.toFixed(2) : "—",
                  color: "text-foreground", sub: "annualised" },
              ].map(({ label, value, color, sub }) => (
                <div key={label} className="text-center p-2 bg-muted/40 rounded-lg">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className={cn("mono font-bold text-sm mt-0.5", color)}>{value}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[11px] mb-1 px-1">
              <span className="text-muted-foreground">{bt.symbol} · {bt.metrics.years.toFixed(1)}y</span>
              <span className="flex items-center gap-2">
                <span className={cn("mono font-semibold", bt.metrics.totalReturnPct >= 0 ? "gain" : "loss")}>
                  {formatPct(bt.metrics.totalReturnPct)}
                </span>
                <span className="text-muted-foreground">vs</span>
                <span className={cn("mono", bt.metrics.buyHoldReturnPct >= 0 ? "gain" : "loss")}>
                  {formatPct(bt.metrics.buyHoldReturnPct)}
                </span>
              </span>
            </div>
            <p className="text-[10px] text-yellow-400/80 mb-3 px-1">
              Single window — did not survive walk-forward. Treat the drawdown figure as the
              durable one.
            </p>
          </>
        ) : (
          <div className="bg-muted/30 border border-border/60 rounded-lg px-3 py-2 mb-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Not backtestable
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {s.notBacktestable ?? (btLoading ? "Measuring…" : "No executable spec mapped")}
            </p>
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")} />
          {expanded ? "Hide details" : "View details"}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-border overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Entry Rules</p>
                <div className="space-y-1">
                  {s.indicators.map((ind) => (
                    <div key={ind} className="flex items-center gap-2 text-xs">
                      <div className="w-1 h-1 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="mono">{ind}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function StrategiesPage() {
  const { results, loading: btLoading } = useStrategyBacktests();
  const measured = STRATEGIES
    .filter((s) => results[s.id])
    .map((s) => ({
      name: s.name.split(" ")[0],
      strategy: results[s.id].metrics.totalReturnPct,
      bench: results[s.id].metrics.buyHoldReturnPct,
      color: s.color,
    }));

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="font-heading text-xl font-bold flex items-center gap-2">
          Strategies
          {/* The rules are real reference data; the win rates, R:R, signal
              counts and monthly returns are illustrative — there is no
              backtesting engine, so nothing here was measured. */}
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
            REFERENCE
          </span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          6 built-in strategy definitions · performance figures are measured by the
          backtest engine below, or omitted where the rules cannot be tested
        </p>
      </motion.div>

      {/* The one result on this page that was not tuned on its own data. */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-4 h-4 text-yellow-400" />
          <h2 className="text-sm font-semibold font-heading text-yellow-400">
            Walk-forward result — these are risk tools, not alpha
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Five portfolio variants were ranked on {WF.tunedOn}, and the winner run
          <strong className="text-foreground"> once</strong> on {WF.testedOn}. It is the only test here
          not evaluated on the data that selected it — and it overturned the in-sample conclusion.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <div className="bg-card/60 rounded-lg px-3 py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">In-sample edge</p>
            <p className="mono font-bold text-sm gain mt-0.5">
              +{(WF.inSampleSharpe - WF.inSampleBenchmarkSharpe).toFixed(2)} Sharpe
            </p>
            <p className="text-[10px] text-muted-foreground">{WF.inSampleSharpe} vs {WF.inSampleBenchmarkSharpe}</p>
          </div>
          <div className="bg-card/60 rounded-lg px-3 py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Out-of-sample edge</p>
            <p className="mono font-bold text-sm loss mt-0.5">
              {(WF.outOfSampleSharpe - WF.outOfSampleBenchmarkSharpe).toFixed(2)} Sharpe
            </p>
            <p className="text-[10px] text-muted-foreground">{WF.outOfSampleSharpe} vs {WF.outOfSampleBenchmarkSharpe} — did not hold</p>
          </div>
          <div className="bg-card/60 rounded-lg px-3 py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Drawdown, out-of-sample</p>
            <p className="mono font-bold text-sm gain mt-0.5">−{WF.outOfSampleMaxDdPct}%</p>
            <p className="text-[10px] text-muted-foreground">buy &amp; hold −{WF.outOfSampleBenchmarkMaxDdPct}% — this DID hold</p>
          </div>
          <div className="bg-card/60 rounded-lg px-3 py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Edge correlation</p>
            <p className="mono font-bold text-sm mt-0.5">+{WF.edgeCorrelation}</p>
            <p className="text-[10px] text-muted-foreground">in-sample rank barely predicts out-of-sample</p>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Only {WF.variantsWithPositiveOosEdge} of {WF.variantsTested} variants held a positive
          out-of-sample edge, and the one in-sample selection picked was not among them. What
          generalised without exception was drawdown reduction — every variant roughly halved it.
          <strong className="text-foreground"> Read every single-window backtest below as an artifact
          of its window, not as evidence of edge.</strong>
        </p>
      </motion.div>

      <BacktestPanel />

      {measured.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-sm font-semibold font-heading">
              Measured Total Return vs Buy &amp; Hold
              <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                backtested on real OHLCV, costs included
              </span>
            </h2>
          </div>
          <p className="text-[10px] text-muted-foreground mb-3">
            Only the {measured.length} strategies with an executable spec appear here. The rest
            need data no free source provides, so they are shown without performance figures
            rather than illustrative ones.
          </p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={measured} margin={{ left: -20 }}>
              <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "var(--font-mono)" }} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: 11 }}
                formatter={(v, n) => [`${Number(v).toFixed(1)}%`, n === "bench" ? "Buy & hold" : "Strategy"]}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
              <Bar dataKey="strategy" radius={[4, 4, 0, 0]} name="strategy">
                {measured.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.85} />)}
              </Bar>
              <Bar dataKey="bench" radius={[4, 4, 0, 0]} name="bench" fill="rgba(255,255,255,0.25)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {STRATEGIES.map((s, i) => (
          <StrategyCard key={s.id} s={s} delay={i * 0.06} bt={results[s.id]} btLoading={btLoading} />
        ))}
      </div>
    </div>
  );
}
