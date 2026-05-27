"use client";
import { motion } from "framer-motion";
import { cn, formatCurrency, formatPct } from "@/lib/utils";

const POSITIONS = [
  { symbol: "NVDA",    side: "LONG",  qty: 12,   entry: 845.20,  current: 891.20,  market: "US"     },
  { symbol: "BTCUSDT", side: "LONG",  qty: 0.25, entry: 103200,  current: 108420,  market: "CRYPTO" },
  { symbol: "AAPL",    side: "LONG",  qty: 50,   entry: 218.10,  current: 213.45,  market: "US"     },
  { symbol: "ETHUSDT", side: "SHORT", qty: 2.5,  entry: 3920.0,  current: 3842.1,  market: "CRYPTO" },
  { symbol: "TCS.NS",  side: "LONG",  qty: 20,   entry: 3980.0,  current: 4120.0,  market: "INDIA"  },
];

const MARKET_COLORS: Record<string, string> = {
  US:     "bg-blue-500/20 text-blue-400",
  CRYPTO: "bg-orange-500/20 text-orange-400",
  INDIA:  "bg-green-500/20 text-green-400",
  UAE:    "bg-purple-500/20 text-purple-400",
};

const rowVariants = {
  hidden: { opacity: 0, x: -16 },
  show:   (i: number) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.35, delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export default function OpenPositions() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Open Positions</h3>
        <span className="text-xs text-muted-foreground">{POSITIONS.length} active</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left px-4 py-2 font-medium">Symbol</th>
              <th className="text-left px-4 py-2 font-medium">Side</th>
              <th className="text-right px-4 py-2 font-medium">Qty</th>
              <th className="text-right px-4 py-2 font-medium">Entry</th>
              <th className="text-right px-4 py-2 font-medium">Current</th>
              <th className="text-right px-4 py-2 font-medium">P&L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {POSITIONS.map((p, i) => {
              const pnl = p.side === "LONG"
                ? (p.current - p.entry) * p.qty
                : (p.entry - p.current) * p.qty;
              const pnlPct = p.side === "LONG"
                ? ((p.current - p.entry) / p.entry) * 100
                : ((p.entry - p.current) / p.entry) * 100;
              return (
                <motion.tr
                  key={p.symbol}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="show"
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.025)" }}
                  className="cursor-pointer"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="mono font-medium">{p.symbol}</span>
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", MARKET_COLORS[p.market])}>
                        {p.market}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn("font-semibold", p.side === "LONG" ? "gain" : "loss")}>{p.side}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right mono">{p.qty}</td>
                  <td className="px-4 py-2.5 text-right mono">{p.entry.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right mono">{p.current.toLocaleString()}</td>
                  <td className={cn("px-4 py-2.5 text-right mono font-semibold", pnl >= 0 ? "gain" : "loss")}>
                    <div>{formatCurrency(Math.abs(pnl))}</div>
                    <div className="text-[10px] font-normal">{formatPct(pnlPct)}</div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
