"use client";
import { cn, formatCurrency, formatPct } from "@/lib/utils";
import { MOCK_PORTFOLIO, MARKET_LABELS, MARKETS } from "@/lib/constants";
import { useStore } from "@/store/useStore";
import { Bell, Search, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  const { activeMarket, setActiveMarket } = useStore();
  const p = MOCK_PORTFOLIO;

  return (
    <header className="h-14 bg-[oklch(0.11_0.01_240)] border-b border-border flex items-center px-4 gap-4 shrink-0">
      {/* Market tabs */}
      <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1">
        {MARKETS.map((m) => (
          <button
            key={m}
            onClick={() => setActiveMarket(m)}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors",
              activeMarket === m
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {MARKET_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xs relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search symbol…"
          className="w-full bg-muted/40 border border-border rounded-md pl-8 pr-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="flex-1" />

      {/* Portfolio summary strip */}
      <div className="hidden lg:flex items-center gap-5 text-xs">
        <div className="text-center">
          <div className="text-muted-foreground">Portfolio</div>
          <div className="mono font-semibold text-foreground">
            {formatCurrency(p.totalValue)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">Day P&amp;L</div>
          <div className={cn("mono font-semibold", p.dayPnl >= 0 ? "gain" : "loss")}>
            {formatCurrency(p.dayPnl)} ({formatPct(p.dayPnlPct)})
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">Total P&amp;L</div>
          <div className={cn("mono font-semibold", p.totalPnl >= 0 ? "gain" : "loss")}>
            {formatPct(p.totalPnlPct)}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="hidden sm:inline">Live</span>
        </div>
        <button className="relative p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="w-4 h-4" />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-destructive rounded-full" />
        </button>
      </div>
    </header>
  );
}
