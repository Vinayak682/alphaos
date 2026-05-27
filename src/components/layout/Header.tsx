"use client";
import { cn, formatCurrency, formatPct } from "@/lib/utils";
import { MOCK_PORTFOLIO, MARKET_LABELS, MARKETS } from "@/lib/constants";
import { useStore } from "@/store/useStore";
import { Bell, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MarketStatus { market: string; open: boolean }

export default function Header() {
  const { activeMarket, setActiveMarket } = useStore();
  const p = MOCK_PORTFOLIO;
  const [status, setStatus] = useState<MarketStatus | null>(null);
  const [alerts, setAlerts] = useState(3);
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/market-status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => null);
  }, []);

  return (
    <header className="h-14 bg-[oklch(0.11_0.01_240)] border-b border-border flex items-center px-4 gap-4 shrink-0">
      {/* Market tabs */}
      <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1">
        {MARKETS.map((m) => (
          <motion.button
            key={m}
            onClick={() => setActiveMarket(m)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors relative",
              activeMarket === m
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {activeMarket === m && (
              <motion.div
                layoutId="market-pill"
                className="absolute inset-0 bg-card rounded-md shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{MARKET_LABELS[m]}</span>
          </motion.button>
        ))}
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xs relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && searchValue.trim()) {
              router.push(`/markets`);
              setSearchValue("");
            }
          }}
          placeholder="Search symbol… (Enter)"
          className="w-full bg-muted/40 border border-border rounded-md pl-8 pr-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
        />
      </div>

      <div className="flex-1" />

      {/* Live portfolio strip */}
      <div className="hidden lg:flex items-center gap-5 text-xs">
        <div className="text-center">
          <div className="text-muted-foreground">Portfolio</div>
          <div className="mono font-semibold">{formatCurrency(p.totalValue)}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">Day P&amp;L</div>
          <div className={cn("mono font-semibold", p.dayPnl >= 0 ? "gain" : "loss")}>
            {formatCurrency(p.dayPnl)}&nbsp;
            <span className="text-muted-foreground font-normal">({formatPct(p.dayPnlPct)})</span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">All-time</div>
          <div className="mono font-semibold gain">{formatPct(p.totalPnlPct)}</div>
        </div>
      </div>

      {/* Market status + alerts */}
      <div className="flex items-center gap-2.5">
        {/* NYSE open/closed pill */}
        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "hidden sm:flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full",
                status.open
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <motion.div
                className={cn("w-1.5 h-1.5 rounded-full", status.open ? "bg-primary" : "bg-muted-foreground")}
                animate={status.open ? { opacity: [1, 0.3, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              NYSE {status.open ? "Open" : "Closed"}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alerts bell — click navigates to /alerts */}
        <Link href="/alerts">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          onClick={() => setAlerts(0)}
        >
          <Bell className="w-4 h-4" />
          <AnimatePresence>
            {alerts > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full text-[9px] font-bold text-white flex items-center justify-center"
              >
                {alerts}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
        </Link>
      </div>
    </header>
  );
}
