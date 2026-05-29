"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, LogOut, Search, ArrowUpRight, Loader2 } from "lucide-react";
import { useLivePrices } from "@/hooks/useLivePrices";

const STOCK_META = [
  { ticker: "EMAAR",       name: "Emaar Properties",       signal: "BUY",  conf: 79, risk: 31, exchange: "DFM" },
  { ticker: "EMIRATESNBD", name: "Emirates NBD",           signal: "HOLD", conf: 68, risk: 32, exchange: "DFM" },
  { ticker: "DEWA",        name: "Dubai Electricity & Water",signal: "HOLD",conf: 64, risk: 24, exchange: "DFM" },
  { ticker: "DIB",         name: "Dubai Islamic Bank",     signal: "HOLD", conf: 63, risk: 28, exchange: "DFM" },
  { ticker: "DEYAAR",      name: "Deyaar Development",     signal: "HOLD", conf: 58, risk: 36, exchange: "DFM" },
];

const ALL_TICKERS = STOCK_META.map((s) => s.ticker);

const SIGNAL_CFG = {
  BUY:  { cls: "bg-primary/15 text-primary border-primary/30",           icon: TrendingUp  },
  SELL: { cls: "bg-destructive/15 text-destructive border-destructive/30",icon: TrendingDown },
  HOLD: { cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",  icon: Minus       },
  EXIT: { cls: "bg-orange-500/15 text-orange-400 border-orange-500/30",  icon: LogOut      },
};

export default function UAEMarketsPage() {
  const [search, setSearch] = useState("");
  const { prices, loading, lastUpdated, liveCount, ticks } = useLivePrices(ALL_TICKERS, "UAE");

  const filtered = STOCK_META.filter(
    (s) => s.ticker.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold flex items-center gap-2">
              🇦🇪 UAE Markets
              <span className="text-[11px] font-normal text-muted-foreground font-sans">DFM · ADX</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Data via Yahoo Finance · {liveCount}/{ALL_TICKERS.length} live
              {lastUpdated && <span> · Updated {lastUpdated.toLocaleTimeString()}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />}
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border", liveCount > 0 ? "bg-primary/15 border-primary/30" : "bg-muted border-border")}>
              <motion.div className={cn("w-1.5 h-1.5 rounded-full", liveCount > 0 ? "bg-primary" : "bg-muted-foreground")} animate={liveCount > 0 ? { opacity: [1, 0.3, 1] } : {}} transition={{ duration: 1.5, repeat: Infinity }} />
              <span className={cn("text-xs font-medium", liveCount > 0 ? "text-primary" : "text-muted-foreground")}>{liveCount > 0 ? "LIVE" : "OFFLINE"}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ticker or name…" className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {["TICKER", "NAME", "EXCHANGE", "PRICE (AED)", "CHG %", "AI SIGNAL", "CONFIDENCE", "RISK"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-widest text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const cfg = SIGNAL_CFG[s.signal as keyof typeof SIGNAL_CFG];
                const Icon = cfg.icon;
                const lp = prices.get(s.ticker);
                const price = lp?.price;
                const changePct = lp?.changePct;
                const tick = ticks[s.ticker];

                return (
                  <motion.tr key={s.ticker} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.03 }}
                    className={cn("border-b border-border/40 hover:bg-accent/20 transition-colors group cursor-pointer",
                      tick === "up" && "bg-primary/5", tick === "down" && "bg-destructive/5"
                    )}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="mono font-bold">{s.ticker}</span>
                        {lp?.isLive && <span className="w-1 h-1 rounded-full bg-primary" />}
                        <ArrowUpRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.exchange}</td>
                    <td className="px-4 py-3 mono font-semibold">
                      {price ? `د.إ${price.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {changePct !== undefined ? (
                        <span className={cn("mono text-sm font-semibold", changePct >= 0 ? "gain" : "loss")}>
                          {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-bold w-fit", cfg.cls)}>
                        <Icon className="w-3 h-3" />{s.signal}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${s.conf}%` }} transition={{ duration: 0.6, delay: i * 0.03 + 0.2 }}
                            className={cn("h-full rounded-full", s.conf >= 80 ? "bg-primary" : "bg-yellow-400")} />
                        </div>
                        <span className={cn("mono text-xs font-semibold", s.conf >= 80 ? "gain" : "text-yellow-400")}>{s.conf}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${s.risk}%`, background: s.risk >= 60 ? "#FF3060" : s.risk >= 40 ? "#F59E0B" : "#00FF88" }} />
                        </div>
                        <span className={cn("mono text-xs", s.risk >= 60 ? "loss" : s.risk >= 40 ? "text-yellow-400" : "gain")}>{s.risk}</span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
