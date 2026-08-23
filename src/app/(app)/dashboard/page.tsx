"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { Briefcase, TrendingUp, Activity, Target, ArrowUpRight } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import SignalFeed from "@/components/dashboard/SignalFeed";
import OpenPositions from "@/components/dashboard/OpenPositions";
import BotPerformance from "@/components/dashboard/BotPerformance";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import TradeModal from "@/components/ui/TradeModal";
import { usePaperPortfolio } from "@/hooks/usePaperPortfolio";
import { useEquityCurve } from "@/hooks/useEquityCurve";
import { formatPct } from "@/lib/utils";
import Link from "next/link";

function PortfolioSparkline({ series }: { series: number[] }) {
  const W = 200, H = 48;
  if (series.length < 2) {
    return (
      <svg width={W} height={H} className="shrink-0">
        <line x1="0" y1={H / 2} x2={W} y2={H / 2}
          stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    );
  }
  // Pad a flat series so a straight line still renders inside the box.
  const lo = Math.min(...series), hi = Math.max(...series);
  const pad = (hi - lo) < 1e-6 ? Math.max(1, Math.abs(hi) * 0.001) : (hi - lo) * 0.15;
  const min = lo - pad;
  const max = hi + pad;
  const range = max - min;
  const pts = series.map((v, i) => {
    const x = (i / (series.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const firstPt = pts[0].split(",");
  const lastPt = pts[pts.length - 1].split(",");
  // Filled area
  const areaPath = `M ${pts.join(" L ")} L ${lastPt[0]},${H} L ${firstPt[0]},${H} Z`;

  return (
    <svg width={W} height={H} className="shrink-0">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00FF88" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00FF88" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkGrad)" />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="#00FF88"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* End dot */}
      <circle cx={lastPt[0]} cy={lastPt[1]} r="3" fill="#00FF88" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="6" fill="#00FF88" fillOpacity="0.2" />
    </svg>
  );
}

export default function DashboardPage() {
  const { stats, openTrade, source } = usePaperPortfolio();
  const p = stats;
  const equity = useEquityCurve();
  const [tradeModalOpen, setTradeModalOpen] = useState(false);

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      <TradeModal
        open={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        onTrade={openTrade}
        cashBalance={p.cashBalance}
      />

      {/* Hero portfolio banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
        className="relative rounded-2xl border border-border overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 px-6 py-5"
      >
        {/* Animated bg orbs */}
        <motion.div
          className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-primary/6 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-blue-500/5 blur-2xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="relative flex items-end justify-between flex-wrap gap-4">
          {/* Left: portfolio value */}
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-medium flex items-center gap-2">
              Total Portfolio Value
              {/* Say so when these are placeholders rather than a real balance. */}
              {source === "mock" ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                  DEMO DATA
                </span>
              ) : (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                  {source === "api" ? "● LIVE" : "● LIVE · DB"}
                </span>
              )}
            </p>
            <div className="font-heading text-4xl font-bold tracking-tight">
              <AnimatedNumber value={p.totalValue} prefix="$" decimals={2} duration={1600} />
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div>
                <p className="text-[10px] text-muted-foreground">Day P&L</p>
                <p className="text-sm font-semibold gain mono">
                  +<AnimatedNumber value={p.dayPnl} prefix="$" decimals={2} duration={1200} className="gain" />
                  <span className="text-xs ml-1 text-muted-foreground">({formatPct(p.dayPnlPct)})</span>
                </p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-[10px] text-muted-foreground">All-time P&L</p>
                <p className="text-sm font-semibold gain mono">
                  +<AnimatedNumber value={p.totalPnlPct} suffix="%" decimals={2} duration={1000} className="gain" />
                </p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p className="text-[10px] text-muted-foreground">Cash</p>
                <p className="text-sm font-medium mono text-muted-foreground">
                  $<AnimatedNumber value={p.cashBalance / 1000} suffix="k" decimals={1} duration={800} />
                </p>
              </div>
            </div>
          </div>

          {/* Right: equity curve rebuilt from the real trade log */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
              {equity.isReal ? equity.spanLabel : "No trades yet"}
            </span>
            <PortfolioSparkline series={equity.points.map((pt) => pt.equity)} />
            {equity.isReal && equity.changeAbs != null && equity.changePct != null ? (
              <span className={`text-[10px] font-medium ${equity.changeAbs >= 0 ? "gain" : "loss"}`}>
                {equity.changeAbs >= 0 ? "↑" : "↓"} ${Math.abs(equity.changeAbs).toFixed(2)} ({formatPct(equity.changePct)})
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">open a trade to build a curve</span>
            )}
            <span className="text-[9px] text-muted-foreground/70">
              realised equity · marked to market today
            </span>
          </div>
        </div>

        {/* Quick nav pills */}
        <div className="relative flex items-center gap-2 mt-4 flex-wrap">
          <button onClick={() => setTradeModalOpen(true)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-primary text-black font-bold hover:bg-primary/90 transition-all">
            + New Trade
          </button>
          {[
            { href: "/portfolio",  label: "Portfolio"    },
            { href: "/signals",    label: "Signals"      },
            { href: "/agent",      label: "AI Agent"     },
            { href: "/risk",       label: "Risk Index"   },
            { href: "/traders",    label: "Top Traders"  },
            { href: "/intel",      label: "Market Intel" },
            { href: "/strategies", label: "Strategies"   },
            { href: "/us",         label: "🇺🇸 US"       },
            { href: "/uae",        label: "🇦🇪 UAE"      },
            { href: "/india",      label: "🇮🇳 India"    },
          ].map(({ href, label }) => (
            <Link key={href} href={href}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all group"
            >
              {label}
              <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/portfolio" className="block">
          <StatCard label="Portfolio" value={p.totalValue} prefix="$" sub={`Cash $${(p.cashBalance/1000).toFixed(1)}k`}
            icon={Briefcase} iconClass="text-blue-400" trend="up" delay={0.05} />
        </Link>
        <Link href="/portfolio" className="block">
          <StatCard label="Day P&L" value={p.dayPnl} prefix="$" sub={formatPct(p.dayPnlPct)}
            subClass="gain" icon={TrendingUp} iconClass="text-primary" trend="up" delay={0.1} />
        </Link>
        <Link href="/portfolio" className="block">
          <StatCard label="Total P&L" value={p.totalPnlPct} suffix="%" sub={`$${(p.totalPnl/1000).toFixed(1)}k`}
            subClass="gain" icon={Activity} iconClass="text-green-400" trend="up" delay={0.15} />
        </Link>
        <Link href="/bot" className="block">
          <StatCard label="Win Rate" value={p.winRate} suffix="%" decimals={1} sub={`${p.openPositions} open`}
            icon={Target} iconClass="text-yellow-400" trend="neutral" delay={0.2} />
        </Link>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="space-y-4">
          <SignalFeed />
          <BotPerformance />
        </div>
        <div className="xl:col-span-2">
          <OpenPositions />
        </div>
      </div>
    </div>
  );
}
