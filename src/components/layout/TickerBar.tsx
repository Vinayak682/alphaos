"use client";
import { useEffect, useRef, useState } from "react";
import { cn, formatPrice, formatPct } from "@/lib/utils";

const TICKERS = [
  { symbol: "BTC/USD",     price: 108420.50, change: 2.34  },
  { symbol: "ETH/USD",     price: 3842.10,   change: 1.87  },
  { symbol: "AAPL",        price: 213.45,    change: -0.54 },
  { symbol: "NVDA",        price: 891.20,    change: 3.21  },
  { symbol: "NIFTY 50",    price: 24560.80,  change: 0.82  },
  { symbol: "SENSEX",      price: 81204.30,  change: 0.71  },
  { symbol: "TSLA",        price: 342.80,    change: -1.23 },
  { symbol: "SPY",         price: 548.90,    change: 0.43  },
  { symbol: "SOL/USD",     price: 172.40,    change: 4.51  },
  { symbol: "RELIANCE.NS", price: 2945.60,   change: 1.12  },
  { symbol: "EMAAR.DFM",   price: 8.94,      change: -0.33 },
  { symbol: "GOLD",        price: 3342.80,   change: 0.28  },
];

export default function TickerBar() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="h-8 bg-[oklch(0.09_0.01_240)] border-b border-border overflow-hidden flex items-center">
      <div
        ref={ref}
        className="flex gap-6 animate-[scroll_40s_linear_infinite] whitespace-nowrap"
        style={{
          animation: "tickerScroll 50s linear infinite",
        }}
      >
        {[...TICKERS, ...TICKERS].map((t, i) => (
          <span key={i} className="flex items-center gap-2 text-xs shrink-0">
            <span className="text-muted-foreground font-medium">{t.symbol}</span>
            <span className="mono text-foreground">{formatPrice(t.price)}</span>
            <span className={cn("mono", t.change >= 0 ? "gain" : "loss")}>
              {formatPct(t.change)}
            </span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
