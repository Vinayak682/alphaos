"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MOCK_PORTFOLIO } from "@/lib/constants";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart2, Wallet } from "lucide-react";

const p = MOCK_PORTFOLIO;

const POSITIONS = [
  { symbol: "NVDA",        name: "NVIDIA Corp",              market: "US",     side: "LONG",  qty: 12,    entry: 845.20,    current: 891.20,    currency: "$",  risk: 28 },
  { symbol: "MSFT",        name: "Microsoft Corp",            market: "US",     side: "LONG",  qty: 8,     entry: 398.40,    current: 421.60,    currency: "$",  risk: 24 },
  { symbol: "META",        name: "Meta Platforms",            market: "US",     side: "LONG",  qty: 5,     entry: 489.20,    current: 512.90,    currency: "$",  risk: 29 },
  { symbol: "AAPL",        name: "Apple Inc",                 market: "US",     side: "LONG",  qty: 50,    entry: 218.10,    current: 213.45,    currency: "$",  risk: 38 },
  { symbol: "TSLA",        name: "Tesla Inc",                 market: "US",     side: "SHORT", qty: 10,    entry: 198.40,    current: 182.10,    currency: "$",  risk: 58 },
  { symbol: "BTCUSDT",     name: "Bitcoin / USDT",            market: "CRYPTO", side: "LONG",  qty: 0.25,  entry: 103200,    current: 108420,    currency: "$",  risk: 42 },
  { symbol: "ETHUSDT",     name: "Ethereum / USDT",           market: "CRYPTO", side: "SHORT", qty: 2.5,   entry: 3920.0,    current: 3842.1,    currency: "$",  risk: 48 },
  { symbol: "SOLUSDT",     name: "Solana / USDT",             market: "CRYPTO", side: "LONG",  qty: 18,    entry: 178.40,    current: 192.30,    currency: "$",  risk: 52 },
  { symbol: "HDFCBANK",    name: "HDFC Bank",                 market: "INDIA",  side: "LONG",  qty: 100,   entry: 1584.0,    current: 1642.0,    currency: "₹",  risk: 41 },
  { symbol: "TCS",         name: "Tata Consultancy Svc.",     market: "INDIA",  side: "LONG",  qty: 20,    entry: 3980.0,    current: 4120.0,    currency: "₹",  risk: 29 },
  { symbol: "TITAN",       name: "Titan Company",             market: "INDIA",  side: "LONG",  qty: 15,    entry: 3380.0,    current: 3480.0,    currency: "₹",  risk: 28 },
  { symbol: "RELIANCE",    name: "Reliance Industries",       market: "INDIA",  side: "LONG",  qty: 30,    entry: 2890.0,    current: 2944.0,    currency: "₹",  risk: 62 },
  { symbol: "FAB",         name: "First Abu Dhabi Bank",      market: "UAE",    side: "LONG",  qty: 500,   entry: 14.12,     current: 14.62,     currency: "د.إ", risk: 34 },
  { symbol: "EMAAR",       name: "Emaar Properties",          market: "UAE",    side: "LONG",  qty: 800,   entry: 9.10,      current: 8.92,      currency: "د.إ", risk: 31 },
  { symbol: "ADNOCGAS",    name: "ADNOC Gas",                 market: "UAE",    side: "LONG",  qty: 1000,  entry: 4.18,      current: 4.32,      currency: "د.إ", risk: 27 },
];

const MARKET_CLR: Record<string, { badge: string; text: string; bar: string }> = {
  US:     { badge: "bg-blue-500/15 text-blue-400 border-blue-500/20",     text: "text-blue-400",   bar: "bg-blue-400" },
  CRYPTO: { badge: "bg-orange-500/15 text-orange-400 border-orange-500/20", text: "text-orange-400", bar: "bg-orange-400" },
  INDIA:  { badge: "bg-green-500/15 text-green-400 border-green-500/20",   text: "text-green-400",  bar: "bg-green-400" },
  UAE:    { badge: "bg-purple-500/15 text-purple-400 border-purple-500/20", text: "text-purple-400", bar: "bg-purple-400" },
};

const ALLOCATION = [
  { label: "US Equities",    pct: 42, value: 120753, market: "US"     },
  { label: "Crypto",         pct: 28, value:  80486, market: "CRYPTO" },
  { label: "Indian Equities",pct: 18, value:  51741, market: "INDIA"  },
  { label: "UAE/GCC",        pct:  7, value:  20122, market: "UAE"    },
  { label: "Cash",           pct:  5, value:  14348, market: "CASH"   },
];

const HISTORY = [
  { date: "May 20", value: 261200 },
  { date: "May 21", value: 268400 },
  { date: "May 22", value: 271800 },
  { date: "May 23", value: 265300 },
  { date: "May 24", value: 278900 },
  { date: "May 25", value: 281200 },
  { date: "May 26", value: 284100 },
  { date: "May 27", value: 287450 },
];

const minVal = Math.min(...HISTORY.map((h) => h.value));
const maxVal = Math.max(...HISTORY.map((h) => h.value));

function computePnl(pos: typeof POSITIONS[0]) {
  const raw = pos.side === "LONG"
    ? (pos.current - pos.entry) * pos.qty
    : (pos.entry - pos.current) * pos.qty;
  const pct = pos.side === "LONG"
    ? ((pos.current - pos.entry) / pos.entry) * 100
    : ((pos.entry - pos.current) / pos.entry) * 100;
  return { raw, pct, isGain: raw >= 0 };
}

// SVG sparkline for equity curve
function EquityCurve() {
  const W = 600, H = 100;
  const pad = 4;
  const range = maxVal - minVal || 1;
  const pts = HISTORY.map((h, i) => {
    const x = (i / (HISTORY.length - 1)) * W;
    const y = H - pad - ((h.value - minVal) / range) * (H - pad * 2);
    return [x, y] as [number, number];
  });
  const polyPts = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const lastPt = pts[pts.length - 1];
  const area = `M ${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L ")} L ${W},${H} L 0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00FF88" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#00FF88" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#eqGrad)" />
      <polyline points={polyPts} fill="none" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="4" fill="#00FF88" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="8" fill="#00FF88" fillOpacity="0.2" />
    </svg>
  );
}

type MarketTab = "ALL" | "US" | "INDIA" | "UAE" | "CRYPTO";

export default function PortfolioPage() {
  const [tab, setTab] = useState<MarketTab>("ALL");

  const filtered = tab === "ALL" ? POSITIONS : POSITIONS.filter((pos) => pos.market === tab);

  const totalPnl = POSITIONS.reduce((acc, pos) => acc + computePnl(pos).raw, 0);
  const gainCount = POSITIONS.filter((pos) => computePnl(pos).isGain).length;

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="font-heading text-xl font-bold">Portfolio</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {POSITIONS.length} positions · Last update 08:04 UAE · {gainCount} gaining / {POSITIONS.length - gainCount} losing
        </p>
      </motion.div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Value",    value: p.totalValue, prefix: "$",  suffix: "",  icon: Wallet,     cls: "text-foreground", iconCls: "text-blue-400",   decimals: 2 },
          { label: "Day P&L",        value: p.dayPnl,     prefix: "+$", suffix: "",  icon: TrendingUp,  cls: "gain",            iconCls: "text-primary",    decimals: 2 },
          { label: "Total P&L",      value: p.totalPnl,   prefix: "+$", suffix: "",  icon: Activity,   cls: "gain",            iconCls: "text-green-400",  decimals: 2 },
          { label: "Cash Reserve",   value: p.cashBalance, prefix: "$", suffix: "",  icon: DollarSign, cls: "text-foreground", iconCls: "text-yellow-400", decimals: 2 },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
            >
              <div className={cn("p-2 rounded-lg bg-muted/40", card.iconCls)}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{card.label}</p>
                <p className={cn("font-heading font-bold text-base mono", card.cls)}>
                  <AnimatedNumber value={card.value} prefix={card.prefix} suffix={card.suffix} decimals={card.decimals} duration={1200} />
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Equity curve + Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Equity curve */}
        <motion.div
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-2 bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5 text-primary" />
              <h2 className="text-sm font-semibold font-heading">8-Day Equity Curve</h2>
            </div>
            <span className="text-xs gain mono font-semibold">+$26,250 (+10.1%)</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-3">May 20 – May 27, 2026</p>
          <div className="h-28 w-full">
            <EquityCurve />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground mono">
            {HISTORY.map((h) => (
              <span key={h.date}>{h.date.split(" ")[1]}</span>
            ))}
          </div>
          <div className="flex justify-between mt-0.5 text-[10px] mono">
            <span className="text-muted-foreground">${(minVal / 1000).toFixed(0)}k</span>
            <span className="gain">${(maxVal / 1000).toFixed(0)}k</span>
          </div>
        </motion.div>

        {/* Allocation */}
        <motion.div
          initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <h2 className="text-sm font-semibold font-heading mb-3">Allocation</h2>
          <div className="space-y-3">
            {ALLOCATION.map((a, i) => {
              const clr = a.market === "CASH"
                ? { bar: "bg-gray-400", text: "text-gray-400" }
                : MARKET_CLR[a.market];
              return (
                <motion.div key={a.label}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.25 + i * 0.07 }}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <motion.div
                        className={cn("w-2 h-2 rounded-full", clr.bar)}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                      />
                      <span className="text-muted-foreground">{a.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground mono text-[10px]">${(a.value / 1000).toFixed(0)}k</span>
                      <span className={cn("font-bold mono w-7 text-right", clr.text)}>{a.pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full", clr.bar)}
                      initial={{ width: 0 }}
                      animate={{ width: `${a.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Positions table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Table header with tabs */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-sm font-semibold font-heading">Open Positions</h2>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{filtered.length}</span>
          </div>
          {/* Market tabs */}
          <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5">
            {(["ALL", "US", "INDIA", "UAE", "CRYPTO"] as MarketTab[]).map((m) => (
              <button
                key={m}
                onClick={() => setTab(m)}
                className={cn(
                  "px-3 py-1 rounded-md text-[10px] font-semibold transition-all",
                  tab === m
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {["SYMBOL", "MARKET", "SIDE", "QTY", "ENTRY", "LTP", "UNREALISED P&L", "P&L %", "RISK"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-widest text-muted-foreground uppercase whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((pos, i) => {
                const { raw, pct, isGain } = computePnl(pos);
                const clr = MARKET_CLR[pos.market];
                return (
                  <motion.tr
                    key={pos.symbol}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    className="border-b border-border/40 hover:bg-accent/20 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <p className="mono font-bold group-hover:text-primary transition-colors">{pos.symbol}</p>
                      <p className="text-[10px] text-muted-foreground">{pos.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border", clr.badge)}>
                        {pos.market}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded",
                        pos.side === "LONG" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                      )}>
                        {pos.side}
                      </span>
                    </td>
                    <td className="px-4 py-3 mono text-xs text-muted-foreground">{pos.qty}</td>
                    <td className="px-4 py-3 mono font-medium text-xs">
                      {pos.currency}{pos.entry.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 mono font-semibold text-sm">
                      {pos.currency}{pos.current.toLocaleString()}
                    </td>
                    <td className={cn("px-4 py-3 mono font-bold text-sm", isGain ? "gain" : "loss")}>
                      {isGain ? "+" : "-"}{pos.currency}{Math.abs(raw).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className={cn("px-4 py-3 mono text-sm font-semibold", isGain ? "gain" : "loss")}>
                      {isGain ? "+" : ""}{pct.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-10 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pos.risk}%`,
                              background: pos.risk >= 60 ? "#FF3060" : pos.risk >= 40 ? "#F59E0B" : "#00FF88",
                            }}
                          />
                        </div>
                        <span className={cn("mono text-xs", pos.risk >= 60 ? "loss" : pos.risk >= 40 ? "text-yellow-400" : "gain")}>
                          {pos.risk}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer: P&L summary */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10 flex-wrap gap-2">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">{filtered.length} positions shown</span>
            <span className={cn("mono font-bold", totalPnl >= 0 ? "gain" : "loss")}>
              Unrealised P&L: {totalPnl >= 0 ? "+" : ""}${Math.abs(totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {gainCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] gain">
                <TrendingUp className="w-3 h-3" /> {gainCount} gaining
              </span>
            )}
            {POSITIONS.length - gainCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] loss">
                <TrendingDown className="w-3 h-3" /> {POSITIONS.length - gainCount} losing
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
