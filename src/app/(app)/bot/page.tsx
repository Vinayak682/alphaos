"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Bot, Play, Pause, Plus, Brain, TrendingUp, Zap } from "lucide-react";

const BOTS = [
  {
    id: "1", name: "Momentum Pro", market: "US", style: "SWING",
    trader: "Mark Minervini", status: "running",
    pnl: 22.4, winRate: 71, trades: 84, signals: 12,
    description: "Momentum-driven equity strategy based on Stage 2 breakouts with strict risk management.",
    color: "blue",
  },
  {
    id: "2", name: "Crypto Quant", market: "CRYPTO", style: "SCALP",
    trader: "Raoul Pal", status: "running",
    pnl: 38.1, winRate: 68, trades: 142, signals: 28,
    description: "Macro-driven crypto positioning with on-chain metrics and liquidity analysis.",
    color: "orange",
  },
  {
    id: "3", name: "India Growth", market: "INDIA", style: "POSITION",
    trader: "Rakesh Jhunjhunwala", status: "running",
    pnl: 17.8, winRate: 74, trades: 56, signals: 8,
    description: "Long-term quality growth investing focused on Indian large-caps and consumption themes.",
    color: "green",
  },
  {
    id: "4", name: "Swing Master", market: "US", style: "SWING",
    trader: "William O'Neil", status: "paused",
    pnl: 11.2, winRate: 65, trades: 38, signals: 0,
    description: "CAN SLIM methodology — earnings growth + relative strength + base breakouts.",
    color: "purple",
  },
];

const MARKET_BADGE: Record<string, string> = {
  US:     "bg-blue-500/20 text-blue-400",
  CRYPTO: "bg-orange-500/20 text-orange-400",
  INDIA:  "bg-green-500/20 text-green-400",
};

const GLOW: Record<string, string> = {
  blue:   "hover:shadow-[0_0_30px_-8px_rgba(60,140,255,0.4)]  hover:border-blue-500/30",
  orange: "hover:shadow-[0_0_30px_-8px_rgba(255,140,60,0.4)]  hover:border-orange-500/30",
  green:  "hover:shadow-[0_0_30px_-8px_rgba(0,220,130,0.4)]   hover:border-primary/40",
  purple: "hover:shadow-[0_0_30px_-8px_rgba(160,80,255,0.4)]  hover:border-purple-500/30",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const card      = { hidden: { opacity: 0, y: 24, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } } };

export default function BotPage() {
  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">AI Trading Bots</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Cloned from top 50 traders · Auto-executing signals</p>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Bot
        </motion.button>
      </motion.div>

      {/* Upload banner */}
      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
        className="bg-card border border-primary/30 rounded-xl p-4 flex items-start gap-3 relative overflow-hidden">
        <motion.div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"
          animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }} />
        <Brain className="w-5 h-5 text-primary mt-0.5 shrink-0 relative z-10" />
        <div className="relative z-10">
          <p className="text-sm font-medium">Ready to ingest your top 50 trader data</p>
          <p className="text-xs text-muted-foreground mt-0.5">Upload CSV/JSON → Claude AI parses, profiles &amp; auto-builds bots.</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
          className="ml-auto shrink-0 relative z-10 bg-primary/15 text-primary border border-primary/30 px-3 py-1.5 rounded-md text-xs font-medium">
          Upload Data
        </motion.button>
      </motion.div>

      {/* Bot cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {BOTS.map((bot) => (
          <motion.div key={bot.id} variants={card} whileHover={{ y: -3 }}
            className={cn("bg-card border border-border rounded-xl p-4 space-y-3 transition-all duration-300 cursor-pointer", GLOW[bot.color])}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {bot.status === "running" ? (
                    <motion.div className="w-2 h-2 rounded-full bg-primary"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity }} />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  )}
                  <h3 className="font-semibold text-sm">{bot.name}</h3>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", MARKET_BADGE[bot.market])}>{bot.market}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{bot.style}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Inspired by: {bot.trader}</p>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className={cn("p-1.5 rounded-md transition-colors shrink-0",
                  bot.status === "running"
                    ? "bg-muted hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                    : "bg-primary/15 hover:bg-primary/25 text-primary")}>
                {bot.status === "running" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </motion.button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">{bot.description}</p>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "P&L",      val: `+${bot.pnl}%`, cls: "gain" },
                { label: "Win Rate", val: `${bot.winRate}%`, cls: "text-foreground" },
                { label: "Trades",   val: bot.trades,       cls: "text-foreground" },
              ].map((m, i) => (
                <motion.div key={m.label} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.07 }}
                  className="bg-muted/50 rounded-lg py-2">
                  <div className={cn("text-sm font-semibold mono", m.cls)}>{m.val}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{m.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-primary" />
                {bot.signals} signals today
              </span>
              <motion.button whileHover={{ x: 2 }} className="text-primary hover:underline text-xs">
                View signals →
              </motion.button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
