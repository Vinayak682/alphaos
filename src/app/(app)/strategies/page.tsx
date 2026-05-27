"use client";
import { motion } from "framer-motion";
import { Zap, Plus, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const STRATEGIES = [
  { name: "NVDA Momentum",  type: "SWING",   market: "US",     active: true,  signals: 8,  pnl: 18.4, color: "blue"   },
  { name: "BTC Breakout",   type: "SCALP",   market: "CRYPTO", active: true,  signals: 34, pnl: 41.2, color: "orange" },
  { name: "Nifty Swing",    type: "SWING",   market: "INDIA",  active: false, signals: 0,  pnl: 9.7,  color: "green"  },
  { name: "SPY Options",    type: "OPTIONS", market: "US",     active: false, signals: 0,  pnl: -2.1, color: "red"    },
];

const GLOW: Record<string, string> = {
  blue:   "hover:shadow-[0_0_25px_-6px_rgba(60,140,255,0.35)]  hover:border-blue-500/25",
  orange: "hover:shadow-[0_0_25px_-6px_rgba(255,140,60,0.35)]  hover:border-orange-500/25",
  green:  "hover:shadow-[0_0_25px_-6px_rgba(0,220,130,0.35)]   hover:border-primary/30",
  red:    "hover:shadow-[0_0_25px_-6px_rgba(255,60,80,0.35)]   hover:border-destructive/25",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } } };

export default function StrategiesPage() {
  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Strategies</h2>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Strategy
        </motion.button>
      </motion.div>

      {/* Webhook setup */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
        className="bg-card border border-primary/20 rounded-xl p-4 relative overflow-hidden">
        <motion.div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent"
          animate={{ x: ["-100%", "100%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />
        <div className="relative flex items-start gap-3">
          <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Connect TradingView Alerts</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Paste your webhook URL into any TradingView alert to start receiving signals instantly.</p>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2.5">
              <code className="font-mono text-xs text-primary flex-1 truncate">
                POST https://api.alphaos.app/webhook/tradingview
              </code>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                <Copy className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STRATEGIES.map((s) => (
          <motion.div key={s.name} variants={item} whileHover={{ y: -3 }}
            className={cn("bg-card border border-border rounded-xl p-4 space-y-3 transition-all duration-300 cursor-pointer", GLOW[s.color])}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {s.active ? (
                  <motion.div className="w-2 h-2 rounded-full bg-primary"
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }} />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                )}
                <span className="font-medium text-sm">{s.name}</span>
              </div>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                className={cn("text-sm font-semibold mono", s.pnl >= 0 ? "gain" : "loss")}>
                {s.pnl >= 0 ? "+" : ""}{s.pnl}%
              </motion.div>
            </div>
            <div className="flex gap-2 text-xs">
              {[s.type, s.market].map((tag) => (
                <span key={tag} className="bg-muted px-2 py-0.5 rounded text-muted-foreground">{tag}</span>
              ))}
              <span className={cn("px-2 py-0.5 rounded font-medium",
                s.active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                {s.active ? "Active" : "Paused"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="w-3 h-3 text-primary" />
              {s.signals} signals today
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
