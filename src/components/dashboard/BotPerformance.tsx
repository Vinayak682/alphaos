"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";

const BOTS = [
  { name: "Momentum Pro",  market: "US",     winRate: 71, pnlPct: 22.4, trades: 84,  status: "active" },
  { name: "Crypto Quant",  market: "CRYPTO", winRate: 68, pnlPct: 38.1, trades: 142, status: "active" },
  { name: "India Growth",  market: "INDIA",  winRate: 74, pnlPct: 17.8, trades: 56,  status: "active" },
  { name: "Swing Master",  market: "US",     winRate: 65, pnlPct: 11.2, trades: 38,  status: "paused" },
];

const MARKET_DOT: Record<string, string> = {
  US:     "bg-blue-400",
  CRYPTO: "bg-orange-400",
  INDIA:  "bg-green-400",
  UAE:    "bg-purple-400",
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, x: -12 },
  show:   { opacity: 1, x: 0, transition: { ease: [0.25, 0.1, 0.25, 1] } },
};

export default function BotPerformance() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-sm font-semibold">AI Bots Running</h3>
        </div>
        <motion.span
          className="text-xs gain font-medium"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          3 Active
        </motion.span>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border">
        {BOTS.map((b, i) => (
          <motion.div
            key={b.name}
            variants={item}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.03)", x: 2 }}
            className="px-4 py-3 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                {b.status === "active" ? (
                  <motion.div
                    className={cn("w-1.5 h-1.5 rounded-full", MARKET_DOT[b.market])}
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                  />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                )}
                <span className="text-sm font-medium">{b.name}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  b.status === "active" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {b.status}
                </span>
              </div>
              <motion.span
                className={cn("text-sm font-semibold mono", b.pnlPct >= 0 ? "gain" : "loss")}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                +{b.pnlPct}%
              </motion.span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
              <span>Win <span className="text-foreground mono">{b.winRate}%</span></span>
              <span>Trades <span className="text-foreground mono">{b.trades}</span></span>
            </div>

            {/* Animated win rate bar */}
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${b.winRate}%` }}
                transition={{ duration: 0.9, delay: 0.4 + i * 0.1, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
