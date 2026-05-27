"use client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import { useState, useEffect } from "react";

const INITIAL_SIGNALS = [
  { id: "1", symbol: "NVDA",        action: "BUY",  price: 891.20, strategy: "Momentum Pro",  confidence: 87, market: "US",     ts: "2s ago"  },
  { id: "2", symbol: "BTCUSDT",     action: "SELL", price: 108420, strategy: "Crypto Quant",  confidence: 79, market: "CRYPTO", ts: "14s ago" },
  { id: "3", symbol: "RELIANCE.NS", action: "BUY",  price: 2945.6, strategy: "India Growth",  confidence: 82, market: "INDIA",  ts: "1m ago"  },
  { id: "4", symbol: "AAPL",        action: "CLOSE",price: 213.45, strategy: "Swing Master",  confidence: 91, market: "US",     ts: "3m ago"  },
  { id: "5", symbol: "ETHUSDT",     action: "BUY",  price: 3842.1, strategy: "DeFi Pulse",    confidence: 74, market: "CRYPTO", ts: "5m ago"  },
  { id: "6", symbol: "TCS.NS",      action: "BUY",  price: 4120.0, strategy: "India Growth",  confidence: 68, market: "INDIA",  ts: "8m ago"  },
];

// Simulated incoming signals for demo
const INCOMING = [
  { id: "7", symbol: "SOLUSDT", action: "BUY",  price: 172.40, strategy: "Crypto Quant", confidence: 83, market: "CRYPTO", ts: "just now" },
  { id: "8", symbol: "SPY",     action: "SELL", price: 548.90, strategy: "Momentum Pro", confidence: 76, market: "US",     ts: "just now" },
];

const ACTION_CONFIG = {
  BUY:   { label: "BUY",   icon: TrendingUp,   cls: "bg-primary/15 text-primary border-primary/30"               },
  SELL:  { label: "SELL",  icon: TrendingDown, cls: "bg-destructive/15 text-destructive border-destructive/30"   },
  CLOSE: { label: "CLOSE", icon: Minus,        cls: "bg-muted text-muted-foreground border-border"               },
};

export default function SignalFeed() {
  const [signals, setSignals] = useState(INITIAL_SIGNALS);
  const [incomingIdx, setIncomingIdx] = useState(0);

  // Simulate live signals every 8s
  useEffect(() => {
    const id = setInterval(() => {
      const next = INCOMING[incomingIdx % INCOMING.length];
      setSignals((prev) => [{ ...next, id: Date.now().toString() }, ...prev].slice(0, 8));
      setIncomingIdx((i) => i + 1);
    }, 8000);
    return () => clearInterval(id);
  }, [incomingIdx]);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-sm font-semibold">Live Signals</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          Real-time
        </div>
      </div>

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
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <motion.div
                  className={cn("flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold shrink-0", cfg.cls)}
                  whileHover={{ scale: 1.05 }}
                >
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium mono">{s.symbol}</span>
                    <span className="text-xs text-muted-foreground truncate">{s.strategy}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mono">${s.price.toLocaleString()}</div>
                </div>
                <div className="text-right shrink-0">
                  <motion.div
                    className={cn(
                      "text-xs font-semibold",
                      s.confidence >= 80 ? "gain" : s.confidence >= 65 ? "text-yellow-400" : "text-muted-foreground"
                    )}
                    initial={i === 0 ? { scale: 1.4, color: "#00FF88" } : {}}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {s.confidence}%
                  </motion.div>
                  <div className="text-xs text-muted-foreground">{s.ts}</div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
