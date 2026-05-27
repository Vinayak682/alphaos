"use client";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatPrice, formatPct } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { DEFAULT_WATCHLIST, MARKET_LABELS } from "@/lib/constants";
import { TrendingUp, TrendingDown, RefreshCw, Clock } from "lucide-react";
import { useMarketData } from "@/hooks/useMarketData";
import type { Market } from "@/lib/constants";

// Fallback prices if API is delayed / free tier
const FALLBACK: Record<string, { price: number; change: number; volume: string }> = {
  AAPL:          { price: 213.45,   change: -0.54, volume: "52.3M"  },
  NVDA:          { price: 891.20,   change:  3.21, volume: "38.1M"  },
  TSLA:          { price: 342.80,   change: -1.23, volume: "71.2M"  },
  MSFT:          { price: 425.60,   change:  0.87, volume: "18.4M"  },
  AMZN:          { price: 198.30,   change:  1.42, volume: "24.7M"  },
  META:          { price: 544.90,   change:  2.11, volume: "12.8M"  },
  GOOGL:         { price: 182.40,   change:  0.33, volume: "16.5M"  },
  SPY:           { price: 548.90,   change:  0.43, volume: "85.1M"  },
  BTCUSDT:       { price: 108420.5, change:  2.34, volume: "$42.1B" },
  ETHUSDT:       { price: 3842.10,  change:  1.87, volume: "$18.3B" },
  SOLUSDT:       { price: 172.40,   change:  4.51, volume: "$5.2B"  },
  BNBUSDT:       { price: 642.30,   change:  0.92, volume: "$2.8B"  },
  AVAXUSDT:      { price: 38.90,    change: -1.14, volume: "$1.4B"  },
};

function fmtVol(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
}

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.22, delay: i * 0.04, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

export default function MarketsPage() {
  const { activeMarket, setSelectedSymbol } = useStore();
  const symbols = DEFAULT_WATCHLIST[activeMarket as keyof typeof DEFAULT_WATCHLIST] ?? [];

  // Only fetch US + CRYPTO from Polygon — India & UAE fall back to mock
  const polyMarket: Market =
    activeMarket === "CRYPTO" ? "CRYPTO" :
    activeMarket === "US"     ? "US"     : "US";

  const usePolygon = activeMarket === "US" || activeMarket === "CRYPTO";
  const { quotes, loading, error, lastUpdated, ticks } = useMarketData(
    usePolygon ? symbols : [],
    polyMarket
  );

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {MARKET_LABELS[activeMarket as keyof typeof MARKET_LABELS]} Markets
        </h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {lastUpdated && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          {loading && <RefreshCw className="w-3 h-3 animate-spin" />}
          {error && <span className="text-destructive text-xs">⚠ {error.slice(0, 40)}</span>}
          <div className="flex items-center gap-1.5">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            {usePolygon ? "Polygon.io Live" : "Static data"}
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs">
              <th className="text-left px-4 py-3 font-medium">Symbol</th>
              <th className="text-right px-4 py-3 font-medium">Price</th>
              <th className="text-right px-4 py-3 font-medium">Change</th>
              <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Volume</th>
              <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">High / Low</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <AnimatePresence>
              {symbols.map((sym, i) => {
                // Prefer live data, fall back to mock
                const live    = quotes[sym.toUpperCase()];
                const fb      = FALLBACK[sym];
                const price   = live?.price    ?? fb?.price   ?? 0;
                const chg     = live?.changePct ?? fb?.change  ?? 0;
                const vol     = live ? fmtVol(live.volume) : fb?.volume ?? "—";
                const high    = live?.high ?? 0;
                const low     = live?.low  ?? 0;
                const isLive  = !!live;
                const isUp    = chg >= 0;
                const tick    = ticks[sym.toUpperCase()];

                return (
                  <motion.tr
                    key={sym}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="show"
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.025)" }}
                    className={cn(
                      "cursor-pointer transition-colors",
                      tick === "up"   && "tick-up",
                      tick === "down" && "tick-down"
                    )}
                    onClick={() => setSelectedSymbol(sym)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="mono font-medium">{sym}</span>
                        {isLive && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-[9px] px-1 py-0.5 rounded bg-primary/15 text-primary font-medium"
                          >
                            POLYGON
                          </motion.span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <motion.span
                        key={price}
                        initial={{ color: tick === "up" ? "#00FF88" : tick === "down" ? "#FF3060" : "inherit" }}
                        animate={{ color: "inherit" }}
                        transition={{ duration: 0.8 }}
                        className="mono font-semibold"
                      >
                        {formatPrice(price)}
                      </motion.span>
                    </td>

                    <td className={cn("px-4 py-3 text-right mono font-semibold", isUp ? "gain" : "loss")}>
                      <span className="flex items-center justify-end gap-1">
                        {isUp
                          ? <TrendingUp className="w-3 h-3" />
                          : <TrendingDown className="w-3 h-3" />}
                        {formatPct(chg)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right text-muted-foreground mono hidden md:table-cell">
                      {vol}
                    </td>

                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      {high > 0 ? (
                        <div className="text-xs mono">
                          <span className="gain">{formatPrice(high)}</span>
                          <span className="text-muted-foreground mx-1">/</span>
                          <span className="loss">{formatPrice(low)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </motion.div>

      {/* Data source footer */}
      <p className="text-[10px] text-muted-foreground text-right">
        {usePolygon
          ? "📡 Polygon.io · Daily OHLCV via free tier · refreshes every 60s · upgrade for real-time"
          : "📊 Static data · Connect broker API for live India / UAE quotes"}
      </p>
    </div>
  );
}
