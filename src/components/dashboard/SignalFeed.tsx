"use client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Zap, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INITIAL_SIGNALS = [
  { id: "1", symbol: "NVDA",        action: "BUY",  price: 891.20, strategy: "Golden Cross Momentum", confidence: 87, market: "US",     ts: "2s ago"  },
  { id: "2", symbol: "BTCUSDT",     action: "SELL", price: 108420, strategy: "Crypto Macro Quant",    confidence: 79, market: "CRYPTO", ts: "14s ago" },
  { id: "3", symbol: "RELIANCE.NS", action: "BUY",  price: 2945.6, strategy: "FII Flow Rider",        confidence: 82, market: "INDIA",  ts: "1m ago"  },
  { id: "4", symbol: "AAPL",        action: "CLOSE",price: 213.45, strategy: "CAN SLIM Pro",          confidence: 91, market: "US",     ts: "3m ago"  },
  { id: "5", symbol: "ETHUSDT",     action: "BUY",  price: 3842.1, strategy: "Crypto Macro Quant",    confidence: 74, market: "CRYPTO", ts: "5m ago"  },
  { id: "6", symbol: "TCS.NS",      action: "BUY",  price: 4120.0, strategy: "Nifty Options Seller",  confidence: 68, market: "INDIA",  ts: "8m ago"  },
];

const INCOMING = [
  { id: "7", symbol: "SOLUSDT", action: "BUY",  price: 172.40, strategy: "Crypto Macro Quant",  confidence: 83, market: "CRYPTO", ts: "just now" },
  { id: "8", symbol: "SPY",     action: "SELL", price: 548.90, strategy: "Golden Cross Momentum",confidence: 76, market: "US",     ts: "just now" },
];

const ACTION_CONFIG = {
  BUY:   { label: "BUY",   icon: TrendingUp,   cls: "bg-primary/15 text-primary border-primary/30"             },
  SELL:  { label: "SELL",  icon: TrendingDown, cls: "bg-destructive/15 text-destructive border-destructive/30" },
  CLOSE: { label: "CLOSE", icon: Minus,        cls: "bg-muted text-muted-foreground border-border"             },
};

const MARKET_COLORS: Record<string, string> = {
  US:     "text-blue-400",
  CRYPTO: "text-orange-400",
  INDIA:  "text-green-400",
  UAE:    "text-purple-400",
};

export default function SignalFeed() {
  const [signals, setSignals] = useState(INITIAL_SIGNALS);
  const [incomingIdx, setIncomingIdx] = useState(0);
  const router = useRouter();

  // Simulate live signals every 8s
  useEffect(() => {
    const id = setInterval(() => {
      const next = INCOMING[incomingIdx % INCOMING.length];
      setSignals((prev) => [{ ...next, id: Date.now().toString() }, ...prev].slice(0, 8));
      setIncomingIdx((i) => i + 1);
    }, 8000);
    return () => clearInterval(id);
  }, [incomingIdx]);

  const handleSignalClick = (strategyName: string) => {
    router.push(`/bot?strategy=${encodeURIComponent(strategyName)}`);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-sm font-semibold font-heading">Live Signals</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            Real-time
          </div>
        </div>
      </div>

      {/* Signal rows */}
      <div className="divide-y divide-border overflow-hidden">
        <AnimatePresence initial={false}>
          {signals.map((s, i) => {
            const cfg = ACTION_CONFIG[s.action as keyof typeof ACTION_CONFIG];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors cursor-pointer group"
                onClick={() => handleSignalClick(s.strategy)}
                title={`View ${s.strategy} strategy`}
              >
                {/* Action badge */}
                <motion.div
                  className={cn("flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold shrink-0", cfg.cls)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </motion.div>

                {/* Symbol + strategy */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold mono">{s.symbol}</span>
                    <span className={cn("text-[10px] font-medium", MARKET_COLORS[s.market])}>{s.market}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate group-hover:text-primary/70 transition-colors">
                    {s.strategy} · <span className="mono">${s.price.toLocaleString()}</span>
                  </div>
                </div>

                {/* Confidence + timestamp + arrow */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <motion.div
                      className={cn(
                        "text-xs font-bold mono",
                        s.confidence >= 80 ? "gain" : s.confidence >= 65 ? "text-yellow-400" : "text-muted-foreground"
                      )}
                      initial={i === 0 ? { scale: 1.4, color: "#00FF88" } : {}}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      {s.confidence}%
                    </motion.div>
                    <div className="text-[10px] text-muted-foreground">{s.ts}</div>
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all" />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer — View all link */}
      <Link href="/bot"
        className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-border text-xs text-muted-foreground hover:text-primary transition-colors group"
      >
        <span>View all strategies</span>
        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
