"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, LogOut, Search, ArrowUpRight } from "lucide-react";

const INDICES = [
  { name: "NIFTY 50",  value: 24_560.8, change: 0.82,  ticker: "NIFTY" },
  { name: "SENSEX",    value: 81_204.3, change: 0.71,  ticker: "SENSEX"},
  { name: "BANK NIFTY",value: 53_412.6, change: 1.24,  ticker: "BANKNIFTY" },
  { name: "USD/INR",   value: 83.42,    change: -0.12, ticker: "USDINR" },
];

const STOCKS = [
  { ticker: "RELIANCE",  name: "Reliance Industries",    price: 2944.0,  change: 0.81,  vol: "12.4M",  signal: "EXIT", conf: 72, risk: 62, exchange: "NSE" },
  { ticker: "HDFCBANK",  name: "HDFC Bank",              price: 1642.0,  change: 1.21,  vol: "9.1M",   signal: "BUY",  conf: 81, risk: 41, exchange: "NSE" },
  { ticker: "TCS",       name: "Tata Consultancy Svc.",  price: 3824.0,  change: 0.44,  vol: "2.8M",   signal: "HOLD", conf: 73, risk: 29, exchange: "NSE" },
  { ticker: "INFY",      name: "Infosys",                price: 1812.0,  change: 0.22,  vol: "4.2M",   signal: "HOLD", conf: 64, risk: 32, exchange: "NSE" },
  { ticker: "SBIN",      name: "State Bank of India",    price: 812.0,   change: 1.44,  vol: "18.2M",  signal: "BUY",  conf: 74, risk: 36, exchange: "NSE" },
  { ticker: "TITAN",     name: "Titan Company",          price: 3480.0,  change: 0.98,  vol: "1.9M",   signal: "BUY",  conf: 78, risk: 28, exchange: "NSE" },
  { ticker: "WIPRO",     name: "Wipro",                  price: 524.0,   change: -0.31, vol: "3.1M",   signal: "HOLD", conf: 60, risk: 34, exchange: "NSE" },
  { ticker: "BAJFINANCE",name: "Bajaj Finance",          price: 7214.0,  change: 1.82,  vol: "1.4M",   signal: "BUY",  conf: 76, risk: 33, exchange: "NSE" },
  { ticker: "ITC",       name: "ITC Limited",            price: 484.0,   change: 0.62,  vol: "11.2M",  signal: "HOLD", conf: 63, risk: 24, exchange: "NSE" },
  { ticker: "LTIM",      name: "LTIMindtree",            price: 5812.0,  change: 0.84,  vol: "0.8M",   signal: "HOLD", conf: 65, risk: 30, exchange: "NSE" },
  { ticker: "MARUTI",    name: "Maruti Suzuki",          price: 12480.0, change: 0.51,  vol: "0.6M",   signal: "HOLD", conf: 62, risk: 27, exchange: "NSE" },
  { ticker: "ASIANPAINT",name: "Asian Paints",           price: 2812.0,  change: -0.42, vol: "0.9M",   signal: "HOLD", conf: 59, risk: 31, exchange: "NSE" },
  { ticker: "SUNPHARMA", name: "Sun Pharmaceutical",     price: 1680.0,  change: 0.74,  vol: "2.1M",   signal: "BUY",  conf: 71, risk: 26, exchange: "NSE" },
  { ticker: "NIFTY50",   name: "Nifty 50 Index Fund",   price: 245.60,  change: 0.82,  vol: "4.8M",   signal: "HOLD", conf: 66, risk: 21, exchange: "BSE" },
];

const SIGNAL_CFG = {
  BUY:  { cls: "bg-primary/15 text-primary border-primary/30",            icon: TrendingUp  },
  SELL: { cls: "bg-destructive/15 text-destructive border-destructive/30", icon: TrendingDown },
  HOLD: { cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",   icon: Minus       },
  EXIT: { cls: "bg-orange-500/15 text-orange-400 border-orange-500/30",   icon: LogOut      },
};

export default function IndiaMarketsPage() {
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
              🇮🇳 India Markets
              <span className="text-[11px] font-normal text-muted-foreground font-sans">NSE · BSE</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Data via Twelve Data · AI signals from morning brain 08:04 UAE</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/15 border border-green-500/30">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-green-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <span className="text-xs font-medium text-green-400">NSE CLOSED</span>
            <span className="text-[10px] text-muted-foreground">Opens in 16h 22m</span>
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
                {["TICKER", "NAME", "EXCH", "PRICE (₹)", "CHG %", "VOLUME", "AI SIGNAL", "CONFIDENCE", "RISK"].map((h) => (
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
                        <ArrowUpRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-green-400/60 transition-colors" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">{s.exchange}</span>
                    </td>
                    <td className="px-4 py-3 mono font-semibold">₹{s.price.toLocaleString()}</td>
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
