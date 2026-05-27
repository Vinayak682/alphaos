"use client";
import { motion } from "framer-motion";
import { Briefcase, TrendingUp, Activity, Target } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import SignalFeed from "@/components/dashboard/SignalFeed";
import OpenPositions from "@/components/dashboard/OpenPositions";
import BotPerformance from "@/components/dashboard/BotPerformance";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { MOCK_PORTFOLIO } from "@/lib/constants";
import { formatPct } from "@/lib/utils";

const p = MOCK_PORTFOLIO;

export default function DashboardPage() {
  return (
    <div className="p-4 space-y-4 h-full overflow-auto">

      {/* Hero portfolio banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
        className="relative rounded-xl border border-border overflow-hidden bg-gradient-to-r from-card via-card to-primary/5 px-6 py-5"
      >
        {/* Animated background orb */}
        <motion.div
          className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-primary/8 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative flex items-end gap-6 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Portfolio Value</p>
            <div className="text-3xl font-bold mono tracking-tight">
              <AnimatedNumber value={p.totalValue} prefix="$" decimals={2} duration={1600} />
            </div>
          </div>
          <div className="flex gap-5 pb-0.5">
            <div>
              <p className="text-xs text-muted-foreground">Day P&L</p>
              <p className="text-base font-semibold gain mono">
                +<AnimatedNumber value={p.dayPnl} prefix="$" decimals={2} duration={1200} className="gain" />
                <span className="text-sm ml-1 text-muted-foreground">({formatPct(p.dayPnlPct)})</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">All-time P&L</p>
              <p className="text-base font-semibold gain mono">
                +<AnimatedNumber value={p.totalPnlPct} suffix="%" decimals={2} duration={1000} className="gain" />
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Portfolio" value={p.totalValue} prefix="$" sub={`Cash $${(p.cashBalance/1000).toFixed(1)}k`} icon={Briefcase} iconClass="text-blue-400" trend="up" delay={0.05} />
        <StatCard label="Day P&L" value={p.dayPnl} prefix="$" sub={formatPct(p.dayPnlPct)} subClass="gain" icon={TrendingUp} iconClass="text-primary" trend="up" delay={0.1} />
        <StatCard label="Total P&L" value={p.totalPnlPct} suffix="%" sub={`$${(p.totalPnl/1000).toFixed(1)}k`} subClass="gain" icon={Activity} iconClass="text-green-400" trend="up" delay={0.15} />
        <StatCard label="Win Rate" value={p.winRate} suffix="%" decimals={1} sub={`${p.openPositions} open`} icon={Target} iconClass="text-yellow-400" trend="neutral" delay={0.2} />
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
