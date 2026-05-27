"use client";
import { cn, formatPrice, formatPct } from "@/lib/utils";
import { useMarketData } from "@/hooks/useMarketData";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// Free-tier: fetch US + Crypto via daily aggregates (no snapshot required)
const US_SYMBOLS     = ["AAPL", "NVDA", "TSLA", "MSFT", "SPY"];
const CRYPTO_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];

const STATIC_FALLBACK = [
  { symbol: "BTC/USD",      price: 108420.5, changePct:  2.34 },
  { symbol: "ETH/USD",      price: 3842.10,  changePct:  1.87 },
  { symbol: "AAPL",         price: 213.45,   changePct: -0.54 },
  { symbol: "NVDA",         price: 891.20,   changePct:  3.21 },
  { symbol: "NIFTY 50",     price: 24560.80, changePct:  0.82 },
  { symbol: "SENSEX",       price: 81204.30, changePct:  0.71 },
  { symbol: "TSLA",         price: 342.80,   changePct: -1.23 },
  { symbol: "SPY",          price: 548.90,   changePct:  0.43 },
  { symbol: "SOL/USD",      price: 172.40,   changePct:  4.51 },
  { symbol: "RELIANCE.NS",  price: 2945.60,  changePct:  1.12 },
  { symbol: "EMAAR.DFM",    price: 8.94,     changePct: -0.33 },
  { symbol: "GOLD",         price: 3342.80,  changePct:  0.28 },
];

interface TickItem { symbol: string; price: number; changePct: number; isLive?: boolean }

export default function TickerBar() {
  const { quotes: usQuotes }     = useMarketData(US_SYMBOLS,     "US");
  const { quotes: cryptoQuotes } = useMarketData(CRYPTO_SYMBOLS, "CRYPTO");
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
  const [flashMap, setFlashMap]     = useState<Record<string, "up" | "down">>({});

  // Merge live + static
  const tickers: TickItem[] = STATIC_FALLBACK.map((fb) => {
    const sym      = fb.symbol;
    const liveUS   = usQuotes[sym];
    const liveCrypto = cryptoQuotes[sym.replace("/", "").replace("USD", "USDT")];
    const live     = liveUS ?? liveCrypto;
    return live
      ? { symbol: sym, price: live.price, changePct: live.changePct, isLive: true }
      : fb;
  });

  // Flash detection
  useEffect(() => {
    const newFlash: Record<string, "up" | "down"> = {};
    const newPrev: Record<string, number> = { ...prevPrices };
    for (const t of tickers) {
      const prev = prevPrices[t.symbol];
      if (prev !== undefined && prev !== t.price) {
        newFlash[t.symbol] = t.price > prev ? "up" : "down";
      }
      newPrev[t.symbol] = t.price;
    }
    if (Object.keys(newFlash).length) {
      setFlashMap(newFlash);
      setTimeout(() => setFlashMap({}), 600);
    }
    setPrevPrices(newPrev);
  }, [JSON.stringify(tickers.map(t => t.price))]); // eslint-disable-line

  const doubled = [...tickers, ...tickers]; // seamless loop

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
            <span className="text-muted-foreground font-medium">{t.symbol}</span>
            <motion.span
              key={`${t.symbol}-${t.price}`}
              initial={{ color: flashMap[t.symbol] === "up" ? "#00FF88" : flashMap[t.symbol] === "down" ? "#FF3060" : "inherit" }}
              animate={{ color: "inherit" }}
              transition={{ duration: 0.8 }}
              className="mono text-foreground font-medium"
            >
              {formatPrice(t.price)}
            </motion.span>
            <span className={cn("mono", t.changePct >= 0 ? "gain" : "loss")}>
              {formatPct(t.changePct)}
            </span>
            {t.isLive && (
              <span className="w-1 h-1 rounded-full bg-primary opacity-70" />
            )}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
