"use client";
import { motion } from "framer-motion";
import { Briefcase, TrendingUp, Activity, Target, ArrowUpRight } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import SignalFeed from "@/components/dashboard/SignalFeed";
import OpenPositions from "@/components/dashboard/OpenPositions";
import BotPerformance from "@/components/dashboard/BotPerformance";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { MOCK_PORTFOLIO } from "@/lib/constants";
import { formatPct } from "@/lib/utils";
import Link from "next/link";

const p = MOCK_PORTFOLIO;

// 7-day equity history for the mini portfolio chart
const EQUITY_HISTORY = [261200, 268400, 271800, 265300, 278900, 281200, 284100, 287450];

function PortfolioSparkline() {
  const W = 200, H = 48;
  const min = Math.min(...EQUITY_HISTORY) - 2000;
  const max = Math.max(...EQUITY_HISTORY) + 2000;
  const range = max - min;
  const pts = EQUITY_HISTORY.map((v, i) => {
    const x = (i / (EQUITY_HISTORY.length - 1)) * W;
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
  return (
    <div className="p-4 space-y-4 h-full overflow-auto">

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
            <p className="text-xs text-muted-foreground mb-1 font-medium">Total Portfolio Value</p>
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

          {/* Right: 7-day sparkline + label */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">7-Day</span>
            <PortfolioSparkline />
            <span className="text-[10px] gain font-medium">↑ $26,250 (+10.1%)</span>
          </div>
        </div>

        {/* Quick nav pills */}
        <div className="relative flex items-center gap-2 mt-4 flex-wrap">
          {[
            { href: "/portfolio",    label: "Full Portfolio" },
            { href: "/markets",      label: "Markets"        },
            { href: "/institutions", label: "Institutions"   },
            { href: "/bot",          label: "AI Bots"        },
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
