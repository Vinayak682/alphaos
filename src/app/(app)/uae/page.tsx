"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, LogOut, Search, ArrowUpRight } from "lucide-react";

const INDICES = [
  { name: "DFM Index",  value: 4_218.3, change: 0.62,  ticker: "DFM"  },
  { name: "ADX Index",  value: 9_612.8, change: 1.14,  ticker: "ADX"  },
  { name: "FAB",        value: 14.62,   change: 0.41,  ticker: "FAB"  },
  { name: "Oil (Brent)",value: 82.40,   change: -0.31, ticker: "BRT"  },
];

const STOCKS = [
  { ticker: "FAB",         name: "First Abu Dhabi Bank",   price: 14.62, change: 0.41,  vol: "12.4M",  signal: "BUY",  conf: 84, risk: 34, currency: "د.إ", exchange: "ADX" },
  { ticker: "EMAAR",       name: "Emaar Properties",       price: 8.92,  change: -0.33, vol: "9.8M",   signal: "BUY",  conf: 79, risk: 31, currency: "د.إ", exchange: "DFM" },
  { ticker: "ADNOCGAS",    name: "ADNOC Gas",              price: 4.32,  change: 1.21,  vol: "28.1M",  signal: "BUY",  conf: 82, risk: 27, currency: "د.إ", exchange: "ADX" },
  { ticker: "EMIRATESNBD", name: "Emirates NBD",           price: 18.40, change: 0.82,  vol: "5.2M",   signal: "HOLD", conf: 68, risk: 32, currency: "د.إ", exchange: "DFM" },
  { ticker: "DEWA",        name: "Dubai Electricity & Water",price: 2.68, change: 0.37, vol: "14.3M",  signal: "HOLD", conf: 64, risk: 24, currency: "د.إ", exchange: "DFM" },
  { ticker: "ADCB",        name: "Abu Dhabi Comm. Bank",   price: 10.20, change: 0.19,  vol: "7.8M",   signal: "HOLD", conf: 66, risk: 29, currency: "د.إ", exchange: "ADX" },
  { ticker: "DIB",         name: "Dubai Islamic Bank",     price: 7.14,  change: 0.28,  vol: "6.1M",   signal: "HOLD", conf: 63, risk: 28, currency: "د.إ", exchange: "DFM" },
  { ticker: "ETISALAT",    name: "e& (Etisalat)",          price: 22.80, change: -0.43, vol: "4.2M",   signal: "HOLD", conf: 61, risk: 33, currency: "د.إ", exchange: "ADX" },
  { ticker: "DAMAC",       name: "DAMAC Properties",       price: 2.40,  change: 1.68,  vol: "18.4M",  signal: "BUY",  conf: 73, risk: 38, currency: "د.إ", exchange: "DFM" },
  { ticker: "DEYAAR",      name: "Deyaar Development",     price: 0.98,  change: 0.51,  vol: "11.2M",  signal: "HOLD", conf: 58, risk: 36, currency: "د.إ", exchange: "DFM" },
  { ticker: "ADNOCDIST",   name: "ADNOC Distribution",     price: 4.08,  change: 0.24,  vol: "8.8M",   signal: "HOLD", conf: 65, risk: 22, currency: "د.إ", exchange: "ADX" },
  { ticker: "ALDAR",       name: "Aldar Properties",       price: 5.92,  change: 0.51,  vol: "13.2M",  signal: "BUY",  conf: 75, risk: 30, currency: "د.إ", exchange: "ADX" },
];

const SIGNAL_CFG = {
  BUY:  { cls: "bg-primary/15 text-primary border-primary/30",            icon: TrendingUp  },
  SELL: { cls: "bg-destructive/15 text-destructive border-destructive/30", icon: TrendingDown },
  HOLD: { cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",   icon: Minus       },
  EXIT: { cls: "bg-orange-500/15 text-orange-400 border-orange-500/30",   icon: LogOut      },
};

export default function UAEMarketsPage() {
  const [search, setSearch] = useState("");
  const filtered = STOCKS.filter(
    (s) => s.ticker.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold flex items-center gap-2">
              🇦🇪 UAE Markets
              <span className="text-[11px] font-normal text-muted-foreground font-sans">DFM · ADX · NASDAQ Dubai</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Data via Twelve Data · AI signals from morning brain 08:04 UAE</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-purple-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <span className="text-xs font-medium text-purple-400">DFM OPEN</span>
            <span className="text-[10px] text-muted-foreground">Closes in 2h 44m</span>
          </div>
        </div>
      </motion.div>

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

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ticker or name…"
          className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {["TICKER", "NAME", "EXCHANGE", "PRICE (د.إ)", "CHG %", "VOLUME", "AI SIGNAL", "CONFIDENCE", "RISK"].map((h) => (
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
                        <ArrowUpRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-purple-400/60 transition-colors" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">{s.exchange}</span>
                    </td>
                    <td className="px-4 py-3 mono font-semibold">د.إ{s.price.toFixed(2)}</td>
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
