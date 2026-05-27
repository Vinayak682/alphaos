"use client";
import { motion } from "framer-motion";
import { cn, formatCurrency, formatPct } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

const POSITIONS = [
  { symbol: "NVDA",    side: "LONG",  qty: 12,   entry: 845.20,  current: 891.20,  market: "US"     },
  { symbol: "BTCUSDT", side: "LONG",  qty: 0.25, entry: 103200,  current: 108420,  market: "CRYPTO" },
  { symbol: "AAPL",    side: "LONG",  qty: 50,   entry: 218.10,  current: 213.45,  market: "US"     },
  { symbol: "ETHUSDT", side: "SHORT", qty: 2.5,  entry: 3920.0,  current: 3842.1,  market: "CRYPTO" },
  { symbol: "TCS.NS",  side: "LONG",  qty: 20,   entry: 3980.0,  current: 4120.0,  market: "INDIA"  },
];

const MARKET_COLORS: Record<string, string> = {
  US:     "bg-blue-500/15 text-blue-400 border-blue-500/20",
  CRYPTO: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  INDIA:  "bg-green-500/15 text-green-400 border-green-500/20",
  UAE:    "bg-purple-500/15 text-purple-400 border-purple-500/20",
};

const rowVariants = {
  hidden: { opacity: 0, x: -16 },
  show:   (i: number) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.35, delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

export default function OpenPositions() {
  const { setSelectedSymbol } = useStore();
  const router = useRouter();

  const handleRowClick = (symbol: string) => {
    setSelectedSymbol(symbol);
    router.push("/charts");
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold font-heading">Open Positions</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{POSITIONS.length} active</span>
          <Link href="/portfolio"
            className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors group"
          >
            <span>Portfolio</span>
            <ExternalLink className="w-3 h-3 group-hover:scale-110 transition-transform" />
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left px-4 py-2.5 font-medium">Symbol</th>
              <th className="text-left px-4 py-2.5 font-medium">Side</th>
              <th className="text-right px-4 py-2.5 font-medium">Qty</th>
              <th className="text-right px-4 py-2.5 font-medium">Entry</th>
              <th className="text-right px-4 py-2.5 font-medium">Current</th>
              <th className="text-right px-4 py-2.5 font-medium">P&L</th>
              <th className="w-8"></th>
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
              const isGain = pnl >= 0;

              return (
                <motion.tr
                  key={p.symbol}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="show"
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                  className="cursor-pointer group"
                  onClick={() => handleRowClick(p.symbol)}
                  title={`View ${p.symbol} chart`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="mono font-semibold text-sm group-hover:text-primary transition-colors">{p.symbol}</span>
                      <span className={cn("px-1.5 py-0.5 rounded border text-[9px] font-medium", MARKET_COLORS[p.market])}>
                        {p.market}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded",
                      p.side === "LONG"
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    )}>
                      {p.side}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right mono text-muted-foreground">{p.qty}</td>
                  <td className="px-4 py-3 text-right mono">{p.entry.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right mono font-medium">{p.current.toLocaleString()}</td>
                  <td className={cn("px-4 py-3 text-right", isGain ? "gain" : "loss")}>
                    <div className="mono font-bold text-xs">{isGain ? "+" : "-"}{formatCurrency(Math.abs(pnl))}</div>
                    <div className="mono text-[10px] opacity-70">{isGain ? "+" : ""}{pnlPct.toFixed(2)}%</div>
                  </td>
                  <td className="px-4 py-3">
                    <ArrowRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all" />
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <Link href="/portfolio"
        className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-border text-xs text-muted-foreground hover:text-primary transition-colors group shrink-0"
      >
        <span>Full portfolio breakdown</span>
        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
