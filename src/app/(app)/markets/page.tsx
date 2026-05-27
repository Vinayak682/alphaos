"use client";
import { motion } from "framer-motion";
import { cn, formatPrice, formatPct } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { DEFAULT_WATCHLIST, MARKET_LABELS } from "@/lib/constants";
import { TrendingUp, TrendingDown } from "lucide-react";

const MOCK_PRICES: Record<string, { price: number; change: number; volume: string }> = {
  AAPL:          { price: 213.45,   change: -0.54, volume: "52.3M" },
  NVDA:          { price: 891.20,   change:  3.21, volume: "38.1M" },
  TSLA:          { price: 342.80,   change: -1.23, volume: "71.2M" },
  MSFT:          { price: 425.60,   change:  0.87, volume: "18.4M" },
  AMZN:          { price: 198.30,   change:  1.42, volume: "24.7M" },
  META:          { price: 544.90,   change:  2.11, volume: "12.8M" },
  GOOGL:         { price: 182.40,   change:  0.33, volume: "16.5M" },
  SPY:           { price: 548.90,   change:  0.43, volume: "85.1M" },
  "RELIANCE.NS": { price: 2945.60,  change:  1.12, volume: "4.2M"  },
  "TCS.NS":      { price: 4120.00,  change:  0.78, volume: "2.1M"  },
  "INFY.NS":     { price: 1840.30,  change: -0.31, volume: "3.8M"  },
  "HDFCBANK.NS": { price: 1720.50,  change:  0.55, volume: "5.6M"  },
  "WIPRO.NS":    { price: 528.40,   change: -0.88, volume: "2.9M"  },
  "EMAAR.DFM":   { price: 8.94,     change: -0.33, volume: "1.8M"  },
  "DIB.DFM":     { price: 7.12,     change:  0.14, volume: "0.9M"  },
  "FAB.ADX":     { price: 14.56,    change:  0.21, volume: "2.3M"  },
  "ADNOC.ADX":   { price: 4.08,     change: -0.12, volume: "1.1M"  },
  BTCUSDT:       { price: 108420.5, change:  2.34, volume: "$42.1B" },
  ETHUSDT:       { price: 3842.10,  change:  1.87, volume: "$18.3B" },
  SOLUSDT:       { price: 172.40,   change:  4.51, volume: "$5.2B"  },
  BNBUSDT:       { price: 642.30,   change:  0.92, volume: "$2.8B"  },
  AVAXUSDT:      { price: 38.90,    change: -1.14, volume: "$1.4B"  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.25, delay: i * 0.04, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export default function MarketsPage() {
  const { activeMarket, setSelectedSymbol } = useStore();
  const symbols = DEFAULT_WATCHLIST[activeMarket as keyof typeof DEFAULT_WATCHLIST] ?? [];

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-base font-semibold">{MARKET_LABELS[activeMarket as keyof typeof MARKET_LABELS]} Markets</h2>
        <span className="text-xs text-muted-foreground">{symbols.length} symbols</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs">
              <th className="text-left px-4 py-3 font-medium">Symbol</th>
              <th className="text-right px-4 py-3 font-medium">Price</th>
              <th className="text-right px-4 py-3 font-medium">Change</th>
              <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Volume</th>
              <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Signal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {symbols.map((sym, i) => {
              const data = MOCK_PRICES[sym];
              if (!data) return null;
              const isUp = data.change >= 0;
              return (
                <motion.tr
                  key={sym}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="show"
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.025)", x: 2 }}
                  className="cursor-pointer transition-colors"
                  onClick={() => setSelectedSymbol(sym)}
                >
                  <td className="px-4 py-3 font-medium mono">{sym}</td>
                  <td className="px-4 py-3 text-right mono">{formatPrice(data.price)}</td>
                  <td className={cn("px-4 py-3 text-right mono font-semibold", isUp ? "gain" : "loss")}>
                    <span className="flex items-center justify-end gap-1">
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {formatPct(data.change)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">{data.volume}</td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <motion.div
                      className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold", isUp ? "gain-bg gain" : "loss-bg loss")}
                      whileHover={{ scale: 1.05 }}
                    >
                      {isUp ? "↑ BULL" : "↓ BEAR"}
                    </motion.div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
