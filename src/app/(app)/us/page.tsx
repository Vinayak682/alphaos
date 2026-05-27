"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, LogOut, Search, ArrowUpRight } from "lucide-react";

const INDICES = [
  { name: "S&P 500",   value: 5_234.18, change: 0.81,  ticker: "SPX"   },
  { name: "NASDAQ",    value: 16_420.3, change: 1.12,  ticker: "NDX"   },
  { name: "DOW",       value: 39_112.4, change: 0.43,  ticker: "DJIA"  },
  { name: "VIX",       value: 14.82,    change: -3.21, ticker: "VIX"   },
];

const STOCKS = [
  { ticker: "NVDA",  name: "NVIDIA Corp",          price: 923.40,  change: 1.21,  vol: "45.2M",  signal: "BUY",  conf: 88, risk: 28 },
  { ticker: "MSFT",  name: "Microsoft Corp",        price: 421.60,  change: 0.87,  vol: "18.1M",  signal: "BUY",  conf: 85, risk: 24 },
  { ticker: "AAPL",  name: "Apple Inc",             price: 189.20,  change: -0.31, vol: "23.1M",  signal: "HOLD", conf: 70, risk: 38 },
  { ticker: "AMZN",  name: "Amazon.com Inc",        price: 194.80,  change: 0.52,  vol: "14.3M",  signal: "HOLD", conf: 71, risk: 35 },
  { ticker: "GOOGL", name: "Alphabet Inc",          price: 180.40,  change: 0.38,  vol: "11.2M",  signal: "HOLD", conf: 68, risk: 32 },
  { ticker: "META",  name: "Meta Platforms",        price: 512.90,  change: 1.44,  vol: "9.8M",   signal: "BUY",  conf: 77, risk: 29 },
  { ticker: "TSLA",  name: "Tesla Inc",             price: 182.10,  change: -3.12, vol: "88.4M",  signal: "SELL", conf: 76, risk: 58 },
  { ticker: "SPY",   name: "SPDR S&P 500 ETF",     price: 523.80,  change: 0.79,  vol: "55.8M",  signal: "HOLD", conf: 65, risk: 22 },
  { ticker: "QQQ",   name: "Invesco QQQ ETF",       price: 448.20,  change: 1.05,  vol: "34.2M",  signal: "HOLD", conf: 66, risk: 26 },
  { ticker: "NFLX",  name: "Netflix Inc",           price: 698.40,  change: 2.21,  vol: "5.1M",   signal: "BUY",  conf: 74, risk: 31 },
  { ticker: "AMD",   name: "Advanced Micro Dev.",   price: 158.70,  change: 1.84,  vol: "28.9M",  signal: "BUY",  conf: 72, risk: 34 },
  { ticker: "INTC",  name: "Intel Corp",            price: 29.40,   change: -1.02, vol: "32.1M",  signal: "HOLD", conf: 55, risk: 48 },
  { ticker: "JPM",   name: "JPMorgan Chase",        price: 208.60,  change: 0.41,  vol: "7.2M",   signal: "HOLD", conf: 67, risk: 27 },
  { ticker: "GLD",   name: "SPDR Gold ETF",         price: 232.80,  change: 0.28,  vol: "8.4M",   signal: "HOLD", conf: 62, risk: 18 },
];

const SIGNAL_CFG = {
  BUY:  { cls: "bg-primary/15 text-primary border-primary/30",           icon: TrendingUp  },
  SELL: { cls: "bg-destructive/15 text-destructive border-destructive/30",icon: TrendingDown },
  HOLD: { cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",  icon: Minus       },
  EXIT: { cls: "bg-orange-500/15 text-orange-400 border-orange-500/30",  icon: LogOut      },
};

export default function USMarketsPage() {
  const [search, setSearch] = useState("");
  const filtered = STOCKS.filter(
    (s) => s.ticker.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold flex items-center gap-2">
              🇺🇸 US Markets
              <span className="text-[11px] font-normal text-muted-foreground font-sans">NASDAQ · NYSE · CBOE</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Data via Polygon.io · AI signals from morning brain 08:04 UAE</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <span className="text-xs font-medium text-primary">NYSE OPEN</span>
            <span className="text-[10px] text-muted-foreground">Closes in 4h 12m</span>
          </div>
        </div>
      </motion.div>

      {/* Index strip */}
      <div className="grid grid-cols-4 gap-3">
        {INDICES.map((idx, i) => (
          <motion.div
            key={idx.ticker}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-3"
          >
            <p className="text-[10px] text-muted-foreground font-medium">{idx.name}</p>
            <p className="font-heading text-xl font-bold mono mt-0.5">{idx.value.toLocaleString()}</p>
            <p className={cn("text-xs mono font-semibold mt-0.5", idx.change >= 0 ? "gain" : "loss")}>
              {idx.change >= 0 ? "+" : ""}{idx.change.toFixed(2)}%
            </p>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ticker or name…"
          className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {["TICKER", "NAME", "PRICE", "CHG %", "VOLUME", "AI SIGNAL", "CONFIDENCE", "RISK SCORE"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-widest text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const cfg = SIGNAL_CFG[s.signal as keyof typeof SIGNAL_CFG];
                const Icon = cfg.icon;
                return (
                  <motion.tr
                    key={s.ticker}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="border-b border-border/40 hover:bg-accent/20 transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="mono font-bold">{s.ticker}</span>
                        <ArrowUpRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.name}</td>
                    <td className="px-4 py-3 mono font-semibold">${s.price.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={cn("mono text-sm font-semibold", s.change >= 0 ? "gain" : "loss")}>
                        {s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 mono text-xs text-muted-foreground">{s.vol}</td>
                    <td className="px-4 py-3">
                      <span className={cn("flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-bold w-fit", cfg.cls)}>
                        <Icon className="w-3 h-3" />
                        {s.signal}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${s.conf}%` }}
                            transition={{ duration: 0.6, delay: i * 0.03 + 0.2 }}
                            className={cn("h-full rounded-full", s.conf >= 80 ? "bg-primary" : "bg-yellow-400")}
                          />
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
