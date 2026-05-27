"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Bot, ArrowRight } from "lucide-react";
import Link from "next/link";

const BOTS = [
  { name: "Golden Cross Momentum", market: "US",     winRate: 71, pnlPct: 22.4, trades: 84,  status: "active",  href: "/bot?strategy=Golden+Cross+Momentum" },
  { name: "Crypto Macro Quant",    market: "CRYPTO", winRate: 68, pnlPct: 38.1, trades: 142, status: "active",  href: "/bot?strategy=Crypto+Macro+Quant"    },
  { name: "Nifty Options Seller",  market: "INDIA",  winRate: 74, pnlPct: 17.8, trades: 56,  status: "active",  href: "/bot?strategy=Nifty+Options+Seller"  },
  { name: "CAN SLIM Pro",          market: "US",     winRate: 65, pnlPct: 11.2, trades: 38,  status: "paused",  href: "/bot?strategy=CAN+SLIM+Pro"          },
];

const MARKET_DOT: Record<string, string> = {
  US:     "bg-blue-400",
  CRYPTO: "bg-orange-400",
  INDIA:  "bg-green-400",
  UAE:    "bg-purple-400",
};

const MARKET_LABEL: Record<string, string> = {
  US:     "text-blue-400",
  CRYPTO: "text-orange-400",
  INDIA:  "text-green-400",
  UAE:    "text-purple-400",
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, x: -12 },
  show:   { opacity: 1, x: 0, transition: { ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

export default function BotPerformance() {
  const activeCount = BOTS.filter(b => b.status === "active").length;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-sm font-semibold font-heading">AI Bots Running</h3>
        </div>
        <Link href="/bot">
          <motion.span
            className="text-xs gain font-semibold hover:underline cursor-pointer"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {activeCount} Active
          </motion.span>
        </Link>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border">
        {BOTS.map((b, i) => (
          <Link key={b.name} href={b.href} className="block group">
            <motion.div
              variants={item}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.04)", x: 2 }}
              className="px-4 py-3 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {b.status === "active" ? (
                    <motion.div
                      className={cn("w-1.5 h-1.5 rounded-full shrink-0", MARKET_DOT[b.market])}
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                    />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">{b.name}</span>
                  <span className={cn("text-[9px] font-medium shrink-0", MARKET_LABEL[b.market])}>{b.market}</span>
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0",
                    b.status === "active" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {b.status}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <motion.span
                    className={cn("text-sm font-bold mono", b.pnlPct >= 0 ? "gain" : "loss")}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                  >
                    +{b.pnlPct}%
                  </motion.span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                <span>Win <span className="text-foreground mono font-medium">{b.winRate}%</span></span>
                <span>Trades <span className="text-foreground mono font-medium">{b.trades}</span></span>
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
          </Link>
        ))}
      </motion.div>

      {/* Footer */}
      <Link href="/bot"
        className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-border text-xs text-muted-foreground hover:text-primary transition-colors group"
      >
        <span>Manage all bots</span>
        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
