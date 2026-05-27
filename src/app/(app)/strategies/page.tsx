"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Zap, ChevronDown, BarChart2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";

const STRATEGIES = [
  {
    id: 1, name: "Momentum Surge", style: "TREND", markets: ["US", "India"],
    winRate: 68, avgRR: 2.3, signals: 847, active: true,
    monthlyReturn: 8.2, benchmarkReturn: 4.1,
    description: "Identifies strong momentum breakouts above 52-week highs with institutional volume confirmation. Uses RSI, MACD, and EMA200 alignment.",
    indicators: ["RSI(14) > 60", "MACD crossover", "EMA200 uptrend", "Volume > 150% avg"],
    bestSignals: ["NVDA +28%", "MSFT +21%", "TITAN +19%"],
    color: "#00FF88",
  },
  {
    id: 2, name: "Mean Reversion", style: "COUNTER", markets: ["US", "UAE"],
    winRate: 71, avgRR: 1.8, signals: 512, active: true,
    monthlyReturn: 6.4, benchmarkReturn: 4.1,
    description: "Trades mean reversion to fair value when assets are 2+ standard deviations from Bollinger Bands. Works best in ranging, non-trending markets.",
    indicators: ["BB lower touch", "RSI < 30", "Volume spike", "Price momentum reversal"],
    bestSignals: ["EMAAR +14%", "FAB +11%", "AAPL +9%"],
    color: "#60a5fa",
  },
  {
    id: 3, name: "News Catalyst", style: "EVENT", markets: ["US", "UAE", "India"],
    winRate: 64, avgRR: 3.1, signals: 321, active: true,
    monthlyReturn: 9.8, benchmarkReturn: 4.1,
    description: "Trades high-impact news events: earnings beats, major deals, regulatory approvals. Claude AI scores news sentiment and acts within minutes of release.",
    indicators: ["Sentiment > 0.7", "Impact: HIGH", "Volume surge", "Price gap"],
    bestSignals: ["ADNOCGAS +22%", "TCS +15%", "MSFT +18%"],
    color: "#F59E0B",
  },
  {
    id: 4, name: "Copy Trade", style: "SMART$", markets: ["US", "India"],
    winRate: 72, avgRR: 2.1, signals: 189, active: true,
    monthlyReturn: 7.6, benchmarkReturn: 4.1,
    description: "Follows top-100 institutional traders from SEC 13F filings and NSE bulk deals. Mirrors institutional accumulation with a 2-day lag.",
    indicators: ["13F new position", "Block deal > ₹100Cr", "Inst. ownership delta", "Price trend aligned"],
    bestSignals: ["NVDA +31%", "HDFCBANK +16%", "BAJFINANCE +24%"],
    color: "#a855f7",
  },
  {
    id: 5, name: "Cross-Market Arb", style: "ARB", markets: ["US", "India"],
    winRate: 58, avgRR: 1.4, signals: 94, active: false,
    monthlyReturn: 3.8, benchmarkReturn: 4.1,
    description: "Exploits price divergence between Indian ADRs traded on NYSE and their NSE equivalents. Currently in paper trading mode — requires fast execution.",
    indicators: ["ADR premium > 2%", "NSE equivalent price", "FX rate (USD/INR)", "Execution window"],
    bestSignals: ["INFY ADR +4.2%", "WIT +3.1%", "HDB +3.8%"],
    color: "#6b7280",
  },
  {
    id: 6, name: "Geo Hedge", style: "MACRO", markets: ["UAE", "Global"],
    winRate: 61, avgRR: 1.6, signals: 142, active: true,
    monthlyReturn: 5.2, benchmarkReturn: 4.1,
    description: "Hedges geopolitical risk using GDELT risk scores. Shifts allocation to defensive UAE sovereign-backed stocks when regional tensions spike above threshold.",
    indicators: ["GDELT risk > 60", "VIX spike", "Oil price movement", "USD strength"],
    bestSignals: ["ADIA fund +8%", "DEWA +7%", "GLD +12%"],
    color: "#14b8a6",
  },
];

const PERF_DATA = STRATEGIES.map((s) => ({
  name: s.name.split(" ")[0],
  strategy: s.monthlyReturn,
  color: s.color,
}));

const STYLE_CLR: Record<string, string> = {
  TREND:   "text-green-400 bg-green-400/10",
  COUNTER: "text-blue-400 bg-blue-400/10",
  EVENT:   "text-yellow-400 bg-yellow-400/10",
  "SMART$":"text-purple-400 bg-purple-400/10",
  ARB:     "text-gray-400 bg-gray-400/10",
  MACRO:   "text-teal-400 bg-teal-400/10",
};

function StrategyCard({ s, delay }: { s: typeof STRATEGIES[0]; delay: number }) {
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

        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "Win Rate", value: `${s.winRate}%`,       color: "gain" },
            { label: "Avg R:R",  value: `${s.avgRR}x`,         color: s.avgRR >= 2 ? "gain" : "text-yellow-400" },
            { label: "Signals",  value: s.signals.toLocaleString(), color: "text-foreground" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center p-2 bg-muted/40 rounded-lg">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className={cn("mono font-bold text-sm mt-0.5", color)}>{value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] text-muted-foreground w-20 shrink-0">Monthly RTN</span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(s.monthlyReturn / 12) * 100}%` }}
              transition={{ duration: 0.8, delay: delay + 0.3 }}
              className="h-full rounded-full"
              style={{ background: s.color }}
            />
          </div>
          <span className="mono text-xs font-semibold gain">+{s.monthlyReturn}%</span>
        </div>

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
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Best Historical Signals</p>
                <div className="flex gap-2 flex-wrap">
                  {s.bestSignals.map((sig) => (
                    <span key={sig} className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-mono">{sig}</span>
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
  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="font-heading text-xl font-bold">Strategies</h1>
        <p className="text-xs text-muted-foreground mt-0.5">6 built-in AI strategies · 5 active · 1 in paper mode</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-3.5 h-3.5 text-primary" />
          <h2 className="text-sm font-semibold font-heading">Monthly Return vs Benchmark (S&P500 +4.1%)</h2>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={PERF_DATA} margin={{ left: -20 }}>
            <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "var(--font-mono)" }} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "var(--font-mono)" }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: 11 }}
              formatter={(v) => [`+${v}%`, "Monthly return"]}
            />
            <ReferenceLine y={4.1} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
            <Bar dataKey="strategy" radius={[4, 4, 0, 0]}>
              {PERF_DATA.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {STRATEGIES.map((s, i) => (
          <StrategyCard key={s.id} s={s} delay={i * 0.06} />
        ))}
      </div>
    </div>
  );
}
