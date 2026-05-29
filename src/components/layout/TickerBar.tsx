"use client";
import { cn, formatPrice, formatPct } from "@/lib/utils";
import { useLivePrices } from "@/hooks/useLivePrices";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const US_SYMS    = ["AAPL", "NVDA", "TSLA", "MSFT", "SPY"];
const CRYPTO_SYMS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
const INDIA_SYMS  = ["RELIANCE", "HDFCBANK", "TCS"];
const UAE_SYMS    = ["EMAAR", "EMIRATESNBD"];

const DISPLAY_ORDER = [
  { sym: "BTCUSDT",      label: "BTC/USD",       market: "CRYPTO" as const, prefix: "$" },
  { sym: "ETHUSDT",      label: "ETH/USD",       market: "CRYPTO" as const, prefix: "$" },
  { sym: "AAPL",         label: "AAPL",          market: "US" as const,     prefix: "$" },
  { sym: "NVDA",         label: "NVDA",          market: "US" as const,     prefix: "$" },
  { sym: "RELIANCE",     label: "RELIANCE.NS",   market: "INDIA" as const,  prefix: "₹" },
  { sym: "HDFCBANK",     label: "HDFCBANK.NS",   market: "INDIA" as const,  prefix: "₹" },
  { sym: "TSLA",         label: "TSLA",          market: "US" as const,     prefix: "$" },
  { sym: "SPY",          label: "SPY",           market: "US" as const,     prefix: "$" },
  { sym: "SOLUSDT",      label: "SOL/USD",       market: "CRYPTO" as const, prefix: "$" },
  { sym: "TCS",          label: "TCS.NS",        market: "INDIA" as const,  prefix: "₹" },
  { sym: "EMAAR",        label: "EMAAR.DFM",     market: "UAE" as const,    prefix: "د.إ" },
  { sym: "EMIRATESNBD",  label: "ENBD.DFM",      market: "UAE" as const,    prefix: "د.إ" },
  { sym: "MSFT",         label: "MSFT",          market: "US" as const,     prefix: "$" },
];

interface TickItem { symbol: string; label: string; price: number; changePct: number; isLive: boolean; prefix: string }

export default function TickerBar() {
  const { prices: usPrices }     = useLivePrices(US_SYMS, "US");
  const { prices: cryptoPrices } = useLivePrices(CRYPTO_SYMS, "CRYPTO");
  const { prices: indiaPrices }  = useLivePrices(INDIA_SYMS, "INDIA");
  const { prices: uaePrices }    = useLivePrices(UAE_SYMS, "UAE");

  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
  const [flashMap, setFlashMap]     = useState<Record<string, "up" | "down">>({});

  const allPrices = new Map([...usPrices, ...cryptoPrices, ...indiaPrices, ...uaePrices]);

  const tickers: TickItem[] = DISPLAY_ORDER.map((d) => {
    const lp = allPrices.get(d.sym);
    return {
      symbol:    d.sym,
      label:     d.label,
      price:     lp?.price ?? 0,
      changePct: lp?.changePct ?? 0,
      isLive:    lp?.isLive ?? false,
      prefix:    d.prefix,
    };
  });

  useEffect(() => {
    const newFlash: Record<string, "up" | "down"> = {};
    const newPrev: Record<string, number> = { ...prevPrices };
    for (const t of tickers) {
      const prev = prevPrices[t.symbol];
      if (prev !== undefined && prev !== t.price && t.price > 0) {
        newFlash[t.symbol] = t.price > prev ? "up" : "down";
      }
      if (t.price > 0) newPrev[t.symbol] = t.price;
    }
    if (Object.keys(newFlash).length) {
      setFlashMap(newFlash);
      setTimeout(() => setFlashMap({}), 600);
    }
    setPrevPrices(newPrev);
  }, [JSON.stringify(tickers.map(t => t.price))]); // eslint-disable-line

  const doubled = [...tickers, ...tickers];

  return (
    <div className="h-8 bg-[oklch(0.09_0.01_240)] border-b border-border overflow-hidden flex items-center select-none">
      <motion.div
        className="flex gap-7 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((t, i) => (
          <span
            key={i}
            className={cn(
              "flex items-center gap-2 text-xs shrink-0 transition-colors duration-300",
              flashMap[t.symbol] === "up"   && "bg-primary/10",
              flashMap[t.symbol] === "down" && "bg-destructive/10"
            )}
          >
            <span className="text-muted-foreground font-medium">{t.label}</span>
            <motion.span
              key={`${t.symbol}-${t.price}`}
              initial={{ color: flashMap[t.symbol] === "up" ? "#00FF88" : flashMap[t.symbol] === "down" ? "#FF3060" : "inherit" }}
              animate={{ color: "inherit" }}
              transition={{ duration: 0.8 }}
              className="mono text-foreground font-medium"
            >
              {t.price > 0 ? `${t.prefix}${formatPrice(t.price)}` : "—"}
            </motion.span>
            {t.price > 0 && (
              <span className={cn("mono", t.changePct >= 0 ? "gain" : "loss")}>
                {formatPct(t.changePct)}
              </span>
            )}
            {t.isLive && (
              <span className="w-1 h-1 rounded-full bg-primary opacity-70" />
            )}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
