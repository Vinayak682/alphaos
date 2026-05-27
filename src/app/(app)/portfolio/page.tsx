"use client";
import { motion } from "framer-motion";
import { formatCurrency, formatPct, cn } from "@/lib/utils";
import { MOCK_PORTFOLIO } from "@/lib/constants";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

const p = MOCK_PORTFOLIO;

const ALLOCATION = [
  { label: "US Equities",    pct: 42, value: 120753, color: "bg-blue-400",   glow: "shadow-blue-400/20"   },
  { label: "Crypto",         pct: 28, value:  80486, color: "bg-orange-400", glow: "shadow-orange-400/20" },
  { label: "Indian Equities",pct: 18, value:  51741, color: "bg-green-400",  glow: "shadow-green-400/20"  },
  { label: "UAE/GCC",        pct:  7, value:  20122, color: "bg-purple-400", glow: "shadow-purple-400/20" },
  { label: "Cash",           pct:  5, value:  14348, color: "bg-gray-400",   glow: "shadow-gray-400/20"   },
];

const HISTORY = [
  { date: "May 20", value: 261200 },
  { date: "May 21", value: 268400 },
  { date: "May 22", value: 271800 },
  { date: "May 23", value: 265300 },
  { date: "May 24", value: 278900 },
  { date: "May 25", value: 281200 },
  { date: "May 26", value: 284100 },
  { date: "May 27", value: 287450 },
];

const maxVal = Math.max(...HISTORY.map((h) => h.value));
const minVal = Math.min(...HISTORY.map((h) => h.value));

const summaryCards = [
  { label: "Total Value",  value: p.totalValue, prefix: "$", cls: "text-foreground" },
  { label: "Day P&L",      value: p.dayPnl,     prefix: "$", cls: "gain"            },
  { label: "Total P&L",    value: p.totalPnl,   prefix: "$", cls: "gain"            },
  { label: "Cash Balance", value: p.cashBalance, prefix: "$", cls: "text-foreground" },
];

export default function PortfolioPage() {
  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      <motion.h2 initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="text-base font-semibold">Portfolio
      </motion.h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((c, i) => (
          <motion.div key={c.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
            <div className={cn("text-lg font-semibold", c.cls)}>
              <AnimatedNumber value={c.value} prefix={c.prefix} decimals={2} duration={1200} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Equity curve */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">7-Day Equity Curve</h3>
          <div className="flex items-end gap-1 h-32">
            {HISTORY.map((h, i) => {
              const heightPct = ((h.value - minVal) / (maxVal - minVal)) * 80 + 20;
              return (
                <div key={h.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <motion.div
                    className="w-full bg-primary/50 hover:bg-primary rounded-t cursor-pointer relative overflow-hidden"
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.6, delay: 0.2 + i * 0.07, ease: "easeOut" }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <motion.div className="absolute inset-0 bg-primary/30"
                      animate={{ y: ["100%", "-100%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
                  </motion.div>
                  <span className="text-[9px] text-muted-foreground">{h.date.split(" ")[1]}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground mono">
            <span>{formatCurrency(minVal)}</span>
            <span className="gain font-medium">{formatCurrency(maxVal)}</span>
          </div>
        </motion.div>

        {/* Allocation */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Allocation</h3>
          <div className="space-y-3">
            {ALLOCATION.map((a, i) => (
              <motion.div key={a.label}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.25 + i * 0.07 }}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <motion.div className={cn("w-2 h-2 rounded-full", a.color)}
                      animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }} />
                    <span className="text-muted-foreground">{a.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground mono">{formatCurrency(a.value)}</span>
                    <span className="font-semibold mono w-8 text-right">{a.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div className={cn("h-full rounded-full", a.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${a.pct}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: "easeOut" }} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
