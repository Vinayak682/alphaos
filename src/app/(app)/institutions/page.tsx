"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Building2, TrendingUp, TrendingDown, ChevronRight, Globe,
  Shield, DollarSign, BarChart3, Star, Users, Landmark,
  ArrowUpRight, ArrowDownRight, Info,
} from "lucide-react";
import {
  US_INSTITUTIONS, INDIA_SUPERINVESTORS, UAE_DIVIDEND_STOCKS,
  STRATEGY_EXACT_PARAMS, WAHA_FUNDS, UAE_SOVEREIGN_FUNDS,
  type USInstitution,
} from "@/lib/institutions";

// ─── Color map ─────────────────────────────────────────────────────────────────
const CLR: Record<string, { text: string; bg: string; border: string }> = {
  blue:    { text: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/20"    },
  cyan:    { text: "text-cyan-400",    bg: "bg-cyan-400/10",    border: "border-cyan-400/20"    },
  violet:  { text: "text-violet-400",  bg: "bg-violet-400/10",  border: "border-violet-400/20"  },
  orange:  { text: "text-orange-400",  bg: "bg-orange-400/10",  border: "border-orange-400/20"  },
  emerald: { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  teal:    { text: "text-teal-400",    bg: "bg-teal-400/10",    border: "border-teal-400/20"    },
  purple:  { text: "text-purple-400",  bg: "bg-purple-400/10",  border: "border-purple-400/20"  },
  indigo:  { text: "text-indigo-400",  bg: "bg-indigo-400/10",  border: "border-indigo-400/20"  },
  red:     { text: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/20"     },
  green:   { text: "text-green-400",   bg: "bg-green-400/10",   border: "border-green-400/20"   },
  yellow:  { text: "text-yellow-400",  bg: "bg-yellow-400/10",  border: "border-yellow-400/20"  },
};
const c = (color: string) => CLR[color] ?? CLR["blue"];

// ─── Tab button ────────────────────────────────────────────────────────────────
function Tab({ label, icon: Icon, active, onClick, count }: { label: string; icon: React.ElementType; active: boolean; onClick: () => void; count?: number }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        active
          ? "bg-primary/20 text-primary border border-primary/40"
          : "bg-muted/30 text-muted-foreground border border-transparent hover:border-border hover:text-foreground"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
      {count !== undefined && (
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-bold", active ? "bg-primary/30" : "bg-muted")}>{count}</span>
      )}
    </motion.button>
  );
}

// ─── Portfolio bar chart ────────────────────────────────────────────────────────
function PortfolioBar({ holdings }: { holdings: { ticker: string; pct: number; name: string }[] }) {
  const colors = ["bg-blue-500", "bg-cyan-500", "bg-violet-500", "bg-emerald-500", "bg-orange-500"];
  return (
    <div className="space-y-1.5 mt-2">
      {holdings.slice(0, 3).map((h, i) => (
        <div key={h.ticker}>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
            <span className="font-mono font-medium">{h.ticker}</span>
            <span>{h.pct.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", colors[i])}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(h.pct * 3, 100)}%` }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── US Institution card ───────────────────────────────────────────────────────
function USCard({ inst, index, onClick }: { inst: USInstitution; index: number; onClick: () => void }) {
  const clr = c(inst.color);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        "bg-card border rounded-xl p-4 space-y-3 cursor-pointer transition-all duration-300 group",
        clr.border,
        `hover:${clr.bg}`
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-sm leading-tight">{inst.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{inst.manager}</p>
        </div>
        <div className="text-right shrink-0">
          <div className={cn("text-base font-bold mono", clr.text)}>
            ${inst.portfolioValueB.toFixed(1)}B
          </div>
          <div className="text-[10px] text-muted-foreground">{inst.uniqueStocks} stocks</div>
        </div>
      </div>

      {/* Strategy badge */}
      <span className={cn("inline-block text-[10px] px-2 py-1 rounded border font-medium", clr.bg, clr.text, clr.border)}>
        {inst.strategy.split("/")[0].trim()}
      </span>

      {/* Top holdings bar */}
      <PortfolioBar holdings={inst.topHoldings.map(h => ({ ticker: h.ticker, pct: h.pct, name: h.name }))} />

      {/* Recent moves */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div>
          <p className="text-muted-foreground mb-1 font-medium">↑ Adding</p>
          {inst.recentBuys.slice(0, 2).map(b => (
            <div key={b.ticker} className="flex items-center gap-1 text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
              <span className="font-mono">{b.ticker}</span>
              <span className="text-muted-foreground">{b.changePct > 0 ? "+" : ""}{b.changePct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
        <div>
          <p className="text-muted-foreground mb-1 font-medium">↓ Reducing</p>
          {inst.recentSells.slice(0, 2).map(s => (
            <div key={s.ticker} className="flex items-center gap-1 text-red-400">
              <ArrowDownRight className="w-3 h-3" />
              <span className="font-mono">{s.ticker}</span>
              <span className="text-muted-foreground">{s.changePct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className={cn("text-[10px] flex items-center gap-1 font-medium", clr.text)}>
        Full breakdown <ChevronRight className="w-3 h-3" />
      </div>
    </motion.div>
  );
}

// ─── Institution detail panel ──────────────────────────────────────────────────
function USDetail({ inst, onClose }: { inst: USInstitution; onClose: () => void }) {
  const clr = c(inst.color);
  return (
    <AnimatePresence>
      <motion.div key="overlay" className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div key="panel"
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[oklch(0.1_0.01_240)] border-l border-border flex flex-col overflow-hidden"
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}>
        <div className={cn("p-5 border-b border-border", clr.bg)}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-lg">{inst.name}</h2>
              <p className="text-xs text-muted-foreground">{inst.manager} · {inst.reportingPeriod}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded">✕</button>
          </div>
          <div className="flex gap-4 mt-3">
            <div><div className={cn("text-xl font-bold mono", clr.text)}>${inst.portfolioValueB.toFixed(2)}B</div><div className="text-[10px] text-muted-foreground">Portfolio Value</div></div>
            <div><div className="text-xl font-bold mono">{inst.uniqueStocks.toLocaleString()}</div><div className="text-[10px] text-muted-foreground">Positions</div></div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Strategy */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Strategy</h3>
            <p className={cn("text-xs font-semibold", clr.text)}>{inst.strategy}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{inst.strategyDetail}</p>
            <div className={cn("mt-2 text-xs px-3 py-1.5 rounded border", clr.bg, clr.border, clr.text)}>🏆 {inst.performance}</div>
          </div>
          {/* Top sectors */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Sector Allocation</h3>
            <div className="space-y-2">
              {inst.topSectors.map((s, i) => (
                <div key={s.sector}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{s.sector}</span><span className="font-mono font-medium">{s.pct}%</span></div>
                  <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                    <motion.div className={cn("h-full rounded-full", ["bg-blue-500","bg-cyan-500","bg-violet-500"][i])}
                      initial={{ width: 0 }} animate={{ width: `${s.pct * 2}%` }} transition={{ delay: i * 0.1, duration: 0.7 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Holdings */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Top Holdings</h3>
            <div className="space-y-2">
              {inst.topHoldings.map(h => (
                <div key={h.ticker} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                  <div><div className="font-mono font-semibold text-sm">{h.ticker}</div><div className="text-[10px] text-muted-foreground">{h.name}</div></div>
                  <div className="text-right"><div className="font-mono font-bold text-sm">${h.valueB.toFixed(2)}B</div><div className={cn("text-[10px] font-medium", clr.text)}>{h.pct.toFixed(2)}%</div></div>
                </div>
              ))}
            </div>
          </div>
          {/* Buys / Sells */}
          {(inst.recentBuys.length > 0 || inst.recentSells.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {inst.recentBuys.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-2">↑ Recent Buys</h3>
                  <div className="space-y-1">
                    {inst.recentBuys.map(b => (
                      <div key={b.ticker} className="flex justify-between text-xs bg-emerald-500/10 rounded px-2 py-1.5 border border-emerald-500/20">
                        <span className="font-mono font-medium">{b.ticker}</span>
                        <span className="text-emerald-400 font-mono">+{b.changePct.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {inst.recentSells.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-2">↓ Recent Sells</h3>
                  <div className="space-y-1">
                    {inst.recentSells.map(s => (
                      <div key={s.ticker} className="flex justify-between text-xs bg-red-500/10 rounded px-2 py-1.5 border border-red-500/20">
                        <span className="font-mono font-medium">{s.ticker}</span>
                        <span className="text-red-400 font-mono">{s.changePct.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
type TabType = "us" | "india" | "uae" | "strategies";

export default function InstitutionsPage() {
  const [tab, setTab] = useState<TabType>("us");
  const [selected, setSelected] = useState<USInstitution | null>(null);

  const totalUS  = US_INSTITUTIONS.reduce((a, i) => a + i.portfolioValueB, 0);
  const totalINR = INDIA_SUPERINVESTORS.reduce((a, i) => a + i.portfolioINRCr, 0);
  const avgYield = UAE_DIVIDEND_STOCKS.reduce((a, s) => a + s.dividendYield, 0) / UAE_DIVIDEND_STOCKS.length;

  return (
    <>
      <div className="p-4 space-y-4 h-full overflow-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Institutional Intelligence</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real 13F filings · Indian superinvestors · UAE sovereign dividend data
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Q1 2026 data
          </div>
        </motion.div>

        {/* KPI strip */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-3">
          {[
            { label: "US Tracked AUM",   value: `$${(totalUS / 1000).toFixed(1)}T`,      cls: "text-blue-400",    icon: Building2  },
            { label: "US Institutions",  value: US_INSTITUTIONS.length,                   cls: "text-foreground",  icon: Globe      },
            { label: "India AUM",        value: `₹${(totalINR / 1000).toFixed(0)}K Cr`,  cls: "text-green-400",   icon: Users      },
            { label: "UAE Avg Yield",    value: `${avgYield.toFixed(1)}%`,                cls: "text-yellow-400",  icon: DollarSign },
          ].map(({ label, value, cls, icon: Icon }, i) => (
            <motion.div key={label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
              <Icon className={cn("w-4 h-4 shrink-0", cls)} />
              <div>
                <div className={cn("text-base font-bold mono", cls)}>{value}</div>
                <div className="text-[10px] text-muted-foreground">{label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          <Tab label="US 13F Filings"         icon={Building2}  active={tab === "us"}         onClick={() => setTab("us")}         count={US_INSTITUTIONS.length} />
          <Tab label="India Superinvestors"   icon={Users}      active={tab === "india"}      onClick={() => setTab("india")}      count={INDIA_SUPERINVESTORS.length} />
          <Tab label="UAE Dividend Universe"  icon={Landmark}   active={tab === "uae"}        onClick={() => setTab("uae")}        count={UAE_DIVIDEND_STOCKS.length} />
          <Tab label="Strategy Parameters"    icon={BarChart3}  active={tab === "strategies"} onClick={() => setTab("strategies")} count={STRATEGY_EXACT_PARAMS.length} />
        </div>

        {/* ── US 13F Tab ─────────────────────────────────────────────────────── */}
        {tab === "us" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Source: SEC Form 13F filings Q1 2026 · SensaMarket / MacroMicro · Covers long equity positions only
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {US_INSTITUTIONS.map((inst, i) => (
                <USCard key={inst.id} inst={inst} index={i} onClick={() => setSelected(inst)} />
              ))}
            </div>
            {/* Bridgewater special callout */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-card border border-violet-500/30 rounded-xl p-4 relative overflow-hidden">
              <motion.div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent pointer-events-none"
                animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity }} />
              <div className="relative flex items-start gap-3">
                <Info className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-violet-300">Bridgewater Q1 2026 Structural Shift</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Dalio's Bridgewater executed a major reallocation in Q1 2026: <span className="text-emerald-400 font-medium">+125% Amazon, +66% Micron, +57% Broadcom, +21% NVIDIA</span> + initiated TSMC (1.62% of portfolio).
                    Simultaneously <span className="text-red-400 font-medium">sold 36% of IVV ETF</span> and exited Salesforce (100%), Adobe (99.9%), Booking Holdings (99.9%).
                    This reflects a rotation from broad equity beta toward concentrated AI infrastructure plays.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── India Tab ──────────────────────────────────────────────────────── */}
        {tab === "india" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-xs text-muted-foreground">Source: SEBI bulk/block deal disclosures · NSE/BSE filings · Trendlyne / Equitymaster · Univest</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {INDIA_SUPERINVESTORS.map((inv, i) => {
                const clr = c(inv.color);
                return (
                  <motion.div key={inv.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.35 }} whileHover={{ y: -2 }}
                    className={cn("bg-card border rounded-xl p-4 space-y-3 transition-all duration-300", clr.border)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">{inv.name}</h3>
                        <p className="text-xs text-muted-foreground">{inv.firm}</p>
                      </div>
                      <div className="text-right">
                        <div className={cn("text-base font-bold mono", clr.text)}>₹{inv.portfolioINRCr.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr</div>
                        <div className="text-[10px] text-muted-foreground">{inv.stockCount} stocks</div>
                      </div>
                    </div>
                    {/* Holdings */}
                    <div className="space-y-1.5">
                      {inv.topHoldings.slice(0, 3).map((h, j) => (
                        <div key={h.ticker} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" style={{ color: [clr.text.replace("text-","")][0] }} />
                            <span className="font-mono text-xs font-medium">{h.ticker}</span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{h.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-mono">₹{(h.valueCr / 100).toFixed(0)}Cr</span>
                            <span className={cn("text-[10px] font-bold", clr.text)}>{h.pct.toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Framework */}
                    <div className={cn("text-[10px] px-2.5 py-2 rounded-lg border leading-relaxed", clr.bg, clr.border)}>
                      <span className={cn("font-semibold", clr.text)}>Framework: </span>
                      <span className="text-muted-foreground">{inv.framework.slice(0, 120)}…</span>
                    </div>
                    {/* Risk rules */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-muted/30 rounded px-2 py-1.5">
                        <div className="font-medium text-muted-foreground mb-0.5">Entry</div>
                        <div className="text-foreground/80">{inv.entryDiscipline.slice(0, 80)}…</div>
                      </div>
                      <div className="bg-muted/30 rounded px-2 py-1.5">
                        <div className="font-medium text-red-400 mb-0.5">Exit / Stop</div>
                        <div className="text-foreground/80">{inv.exitRule.slice(0, 80)}…</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {/* Jhunjhunwala trading brain note */}
            <div className="bg-card border border-green-500/30 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
              <span className="text-green-400 font-semibold">📊 Jhunjhunwala Dual-Brain Rule: </span>
              Trading brain win rate = 40% — but strict stop-losses ensure capital preservation. "Buy when the share is in an uptrend, sell when the share enters a downtrend." Pyramiding (add to winners) strictly enforced. Averaging down is <span className="text-red-400 font-medium">FORBIDDEN</span>.
            </div>
          </motion.div>
        )}

        {/* ── UAE Tab ─────────────────────────────────────────────────────────── */}
        {tab === "uae" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-xs text-muted-foreground">Source: ADX / DFM exchange filings · StashAway MENA dividend research 2026 · Policybazaar UAE</p>

            {/* Sovereign funds */}
            <div className="grid grid-cols-3 gap-3">
              {UAE_SOVEREIGN_FUNDS.map((f, i) => (
                <motion.div key={f.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="bg-card border border-yellow-500/20 rounded-xl p-3 space-y-1.5">
                  <div className="text-yellow-400 font-bold text-sm">{f.estimatedAUM}</div>
                  <div className="font-medium text-xs">{f.name.split("(")[0].trim()}</div>
                  <div className="text-[10px] text-muted-foreground">{f.strategy}</div>
                </motion.div>
              ))}
            </div>

            {/* Dividend universe table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold">UAE Large-Cap Dividend Universe</h3>
                <span className="text-xs text-muted-foreground">20+ companies · AED 10B+ market cap · 3%+ yield</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left px-4 py-2.5">Company</th>
                      <th className="text-left px-4 py-2.5">Exchange</th>
                      <th className="text-right px-4 py-2.5">Market Cap (AED)</th>
                      <th className="text-right px-4 py-2.5">Div. Yield</th>
                      <th className="text-right px-4 py-2.5">Avg Vol (M/day)</th>
                      <th className="text-left px-4 py-2.5 hidden lg:table-cell">Sovereign Holder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {UAE_DIVIDEND_STOCKS.map((s, i) => {
                      const clr = c(s.color);
                      return (
                        <motion.tr key={s.ticker} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="font-mono font-semibold">{s.ticker}</div>
                            <div className="text-muted-foreground text-[10px]">{s.name}</div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold border", clr.bg, clr.text, clr.border)}>
                              {s.exchange}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">AED {s.marketCapAED.toFixed(2)}B</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={cn("font-bold font-mono", s.dividendYield >= 6 ? "text-emerald-400" : s.dividendYield >= 4.5 ? "gain" : "text-foreground")}>
                              {s.dividendYield.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{s.avgDailyVolShares.toFixed(2)}M</td>
                          <td className="px-4 py-2.5 hidden lg:table-cell text-muted-foreground text-[10px]">{s.sovereignHolder}</td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Waha funds */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Waha Capital — Active Hedge Funds</h3>
              <div className="grid grid-cols-3 gap-3">
                {WAHA_FUNDS.map((f, i) => (
                  <motion.div key={f.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className="bg-card border border-teal-500/20 rounded-xl p-3 space-y-1.5">
                    <div className="text-teal-400 font-bold text-base">{f.cumulativeReturn}</div>
                    <div className="font-medium text-xs leading-snug">{f.name.replace("Waha ", "")}</div>
                    <div className="text-[10px] text-muted-foreground">{f.aum} · since {f.inception}</div>
                    <div className="text-[10px] text-muted-foreground">{f.focus}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Strategy Parameters Tab ──────────────────────────────────────────── */}
        {tab === "strategies" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Exact parameters from research document — VCP, Turtle, CAN SLIM, Risk Parity, Moat, and more.
            </p>
            {STRATEGY_EXACT_PARAMS.map((s, i) => (
              <motion.div key={s.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{s.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{s.regime}</p>
                  </div>
                  <div className="flex gap-2 text-[10px]">
                    {s.targetRR && <span className="px-2 py-1 rounded bg-primary/15 text-primary border border-primary/30 font-medium">R:R {s.targetRR.split(" ")[0]}</span>}
                    {s.targetSharpe && <span className="px-2 py-1 rounded bg-violet-500/15 text-violet-400 border border-violet-500/30 font-medium">Sharpe {s.targetSharpe}</span>}
                  </div>
                </div>
                {/* Parameters grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-0 divide-x divide-y divide-border">
                  {[
                    { label: "Entry Trigger",   val: s.entryTrigger,   cls: "text-primary"    },
                    { label: "Exit Trigger",    val: s.exitTrigger,    cls: "text-yellow-400" },
                    { label: "Hard Stop-Loss",  val: s.hardStopLoss,   cls: "loss"            },
                    { label: "Trailing Stop",   val: s.trailingStop,   cls: "text-orange-400" },
                    { label: "Volume Rule",     val: s.volumeRule,     cls: "text-cyan-400"   },
                    { label: "Position Sizing", val: s.positionSizing, cls: "text-foreground" },
                  ].map(({ label, val, cls }) => (
                    <div key={label} className="px-3 py-2.5 text-[10px]">
                      <div className={cn("font-semibold mb-1", cls)}>{label}</div>
                      <div className="text-muted-foreground leading-relaxed">{val}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <p className="text-[10px] text-muted-foreground text-right pb-2">
          📊 13F data: Q1 2026 filings · India: SEBI bulk deal disclosures · UAE: ADX/DFM exchange + StashAway MENA research
        </p>
      </div>

      {/* Detail panel */}
      {selected && <USDetail inst={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
