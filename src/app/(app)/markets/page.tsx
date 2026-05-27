"use client";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatPct } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { DEFAULT_WATCHLIST, MARKET_LABELS } from "@/lib/constants";
import { TrendingUp, TrendingDown, RefreshCw, Zap, BarChart3, ArrowRight } from "lucide-react";
import { useMarketData } from "@/hooks/useMarketData";
import { useRouter } from "next/navigation";
import type { Market } from "@/lib/constants";

// ─── Complete static data for ALL markets ────────────────────────────────────
interface SymbolData {
  price: number; change: number; volume: string; mcap: string;
  sector: string; exchange: string; history: number[]; currency: string;
}

const MARKET_DATA: Record<string, SymbolData> = {
  // ── US Equities ──
  AAPL:    { price: 213.45,   change: -0.54, volume: "52.3M",  mcap: "3.28T", sector: "Tech",         exchange: "NASDAQ", currency: "$", history: [218.2, 215.8, 211.4, 209.9, 212.3, 214.1, 213.45] },
  NVDA:    { price: 891.20,   change:  3.21, volume: "38.1M",  mcap: "2.19T", sector: "Semiconductors",exchange: "NASDAQ", currency: "$", history: [855.0, 848.2, 862.4, 878.1, 871.3, 883.2, 891.20] },
  TSLA:    { price: 342.80,   change: -1.23, volume: "71.2M",  mcap: "1.09T", sector: "Auto/EV",       exchange: "NASDAQ", currency: "$", history: [358.4, 352.1, 347.8, 344.2, 348.9, 346.2, 342.80] },
  MSFT:    { price: 425.60,   change:  0.87, volume: "18.4M",  mcap: "3.16T", sector: "Tech",         exchange: "NASDAQ", currency: "$", history: [419.2, 417.8, 421.4, 418.9, 420.3, 423.1, 425.60] },
  AMZN:    { price: 198.30,   change:  1.42, volume: "24.7M",  mcap: "2.11T", sector: "E-Commerce",    exchange: "NASDAQ", currency: "$", history: [192.4, 191.8, 194.2, 193.9, 195.3, 197.1, 198.30] },
  META:    { price: 544.90,   change:  2.11, volume: "12.8M",  mcap: "1.38T", sector: "Social Media",  exchange: "NASDAQ", currency: "$", history: [528.2, 531.4, 536.8, 533.1, 538.9, 541.2, 544.90] },
  GOOGL:   { price: 182.40,   change:  0.33, volume: "16.5M",  mcap: "2.24T", sector: "Tech",         exchange: "NASDAQ", currency: "$", history: [180.2, 179.8, 181.4, 180.9, 181.3, 182.1, 182.40] },
  SPY:     { price: 548.90,   change:  0.43, volume: "85.1M",  mcap: "502B",  sector: "ETF · S&P 500", exchange: "NYSE",   currency: "$", history: [543.2, 542.8, 545.4, 544.9, 546.3, 547.1, 548.90] },
  // ── Crypto ──
  BTCUSDT: { price: 108420.5, change:  2.34, volume: "42.1B",  mcap: "2.14T", sector: "Layer 1",       exchange: "CRYPTO", currency: "$", history: [104200, 103800, 105600, 106900, 107200, 107800, 108420.5] },
  ETHUSDT: { price: 3842.10,  change:  1.87, volume: "18.3B",  mcap: "462B",  sector: "Layer 1",       exchange: "CRYPTO", currency: "$", history: [3720, 3695, 3760, 3791, 3812, 3829, 3842.10] },
  SOLUSDT: { price: 172.40,   change:  4.51, volume: "5.2B",   mcap: "83B",   sector: "Layer 1",       exchange: "CRYPTO", currency: "$", history: [160.2, 158.4, 163.8, 165.1, 168.9, 170.2, 172.40] },
  BNBUSDT: { price: 642.30,   change:  0.92, volume: "2.8B",   mcap: "93B",   sector: "Exchange",      exchange: "CRYPTO", currency: "$", history: [634.2, 631.8, 638.4, 636.9, 639.3, 641.1, 642.30] },
  AVAXUSDT:{ price: 38.90,    change: -1.14, volume: "1.4B",   mcap: "16B",   sector: "Layer 1",       exchange: "CRYPTO", currency: "$", history: [40.2, 39.8, 39.1, 38.4, 38.9, 39.2, 38.90] },
  // ── India (NSE · INR) ──
  TITAN:       { price: 3418.0,  change:  1.24, volume: "3.2M",  mcap: "3.03L", sector: "Consumer",     exchange: "NSE", currency: "₹", history: [3342, 3365, 3390, 3405, 3398, 3409, 3418.0] },
  TCS:         { price: 4120.0,  change:  0.98, volume: "2.8M",  mcap: "14.9L", sector: "IT",           exchange: "NSE", currency: "₹", history: [4048, 4062, 4085, 4098, 4104, 4112, 4120.0] },
  INFY:        { price: 1921.5,  change: -0.42, volume: "5.1M",  mcap: "8.0L",  sector: "IT",           exchange: "NSE", currency: "₹", history: [1938, 1934, 1928, 1924, 1919, 1922, 1921.5] },
  HDFCBANK:    { price: 1886.0,  change:  0.67, volume: "7.4M",  mcap: "14.2L", sector: "Banking",      exchange: "NSE", currency: "₹", history: [1862, 1869, 1875, 1879, 1882, 1884, 1886.0] },
  RELIANCE:    { price: 2945.6,  change:  1.12, volume: "9.2M",  mcap: "19.9L", sector: "Conglomerate", exchange: "NSE", currency: "₹", history: [2895, 2905, 2918, 2928, 2938, 2942, 2945.6] },
  STARHEALTH:  { price: 551.4,   change: -0.88, volume: "1.9M",  mcap: "0.33L", sector: "Insurance",    exchange: "NSE", currency: "₹", history: [562, 558, 555, 552, 553, 551, 551.4] },
  CONCORD:     { price: 2088.0,  change:  2.14, volume: "0.8M",  mcap: "0.25L", sector: "Pharma",       exchange: "NSE", currency: "₹", history: [2024, 2038, 2052, 2064, 2071, 2082, 2088.0] },
  // ── UAE (ADX / DFM · AED) ──
  EMAAR:       { price: 8.94,    change: -0.33, volume: "48.2M", mcap: "77.8B", sector: "Real Estate",  exchange: "DFM", currency: "د.إ", history: [9.10, 9.05, 9.00, 8.98, 8.95, 8.93, 8.94] },
  FAB:         { price: 16.20,   change:  0.62, volume: "21.4M", mcap: "135B",  sector: "Banking",      exchange: "ADX", currency: "د.إ", history: [15.92, 15.98, 16.05, 16.10, 16.14, 16.18, 16.20] },
  ADNOCGAS:    { price: 4.85,    change:  1.26, volume: "35.8M", mcap: "96.8B", sector: "Energy",       exchange: "ADX", currency: "د.إ", history: [4.72, 4.76, 4.79, 4.81, 4.82, 4.84, 4.85] },
  EMIRATESNBD: { price: 19.50,   change:  0.52, volume: "12.6M", mcap: "84.2B", sector: "Banking",      exchange: "DFM", currency: "د.إ", history: [19.12, 19.18, 19.28, 19.36, 19.42, 19.46, 19.50] },
  DEWA:        { price: 2.88,    change:  0.35, volume: "28.1M", mcap: "78.0B", sector: "Utilities",    exchange: "DFM", currency: "د.إ", history: [2.82, 2.83, 2.85, 2.86, 2.87, 2.87, 2.88] },
  ADCB:        { price: 10.40,   change: -0.48, volume: "18.9M", mcap: "72.4B", sector: "Banking",      exchange: "ADX", currency: "د.إ", history: [10.58, 10.54, 10.50, 10.46, 10.44, 10.42, 10.40] },
  DIB:         { price: 7.80,    change:  0.90, volume: "22.3M", mcap: "55.2B", sector: "Islamic Bank",  exchange: "DFM", currency: "د.إ", history: [7.62, 7.66, 7.70, 7.74, 7.77, 7.79, 7.80] },
};

// ─── Market overview cards ────────────────────────────────────────────────────
const MARKET_OVERVIEW: Record<Market, { label: string; value: string; change: number; sub: string }[]> = {
  US: [
    { label: "S&P 500",    value: "5,892.40", change:  0.62, sub: "↑ YTD +12.4%" },
    { label: "NASDAQ 100", value: "20,841.2", change:  1.14, sub: "Tech led"      },
    { label: "VIX",        value: "14.82",    change: -3.24, sub: "Fear low"      },
    { label: "DXY",        value: "103.42",   change: -0.18, sub: "USD Index"     },
  ],
  INDIA: [
    { label: "NIFTY 50",   value: "24,560",   change:  0.82, sub: "NSE Flagship" },
    { label: "SENSEX",     value: "81,204",   change:  0.71, sub: "BSE 30"       },
    { label: "NIFTY BANK", value: "52,840",   change:  1.04, sub: "Financials"   },
    { label: "USD/INR",    value: "83.48",    change:  0.12, sub: "Rupee"        },
  ],
  UAE: [
    { label: "ADX Index",  value: "9,842.4",  change:  0.48, sub: "Abu Dhabi"    },
    { label: "DFM Index",  value: "4,612.8",  change:  0.31, sub: "Dubai"        },
    { label: "USD/AED",    value: "3.672",    change:  0.00, sub: "Pegged"       },
    { label: "Oil (Brent)",value: "82.40",    change:  1.24, sub: "$/bbl"        },
  ],
  CRYPTO: [
    { label: "BTC Dom",    value: "54.2%",    change:  0.84, sub: "Dominance"    },
    { label: "Total MCap", value: "$3.62T",   change:  2.18, sub: "Global Crypto" },
    { label: "Fear/Greed", value: "72",       change:  8.00, sub: "Greed"        },
    { label: "ETH/BTC",    value: "0.0354",   change: -0.42, sub: "Alt ratio"    },
  ],
};

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (data.length < 2) return null;
  const W = 72, H = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const color = up ? "#00FF88" : "#FF3060";
  const lastX = (W).toFixed(1);
  const lastY = (H - ((data[data.length-1] - min) / range) * (H - 4) - 2).toFixed(1);
  return (
    <svg width={W} height={H} className="shrink-0">
      <defs>
        <linearGradient id={`grad-${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts.join(" ")} fill="none" stroke={color}
        strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r="2" fill={color} />
    </svg>
  );
}

// ─── Volume bar ───────────────────────────────────────────────────────────────
function VolumeBar({ volume }: { volume: string }) {
  // Parse volume to get relative width (rough)
  const num = parseFloat(volume);
  const maxWidthMap: Record<string, number> = { "B": 40, "L": 60, "M": 80 };
  const unit = volume.slice(-1);
  const pct = Math.min((num / (unit === "B" ? 150 : unit === "L" ? 20 : 100)) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="mono text-xs text-muted-foreground w-14 text-right">{volume}</span>
      <div className="w-16 h-1 bg-muted/40 rounded-full overflow-hidden">
        <div className="h-full bg-primary/40 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Sector badge ─────────────────────────────────────────────────────────────
const SECTOR_COLORS: Record<string, string> = {
  "Tech": "text-blue-400 bg-blue-400/10",
  "Semiconductors": "text-violet-400 bg-violet-400/10",
  "IT": "text-blue-400 bg-blue-400/10",
  "Banking": "text-emerald-400 bg-emerald-400/10",
  "Energy": "text-orange-400 bg-orange-400/10",
  "Real Estate": "text-purple-400 bg-purple-400/10",
  "Consumer": "text-pink-400 bg-pink-400/10",
  "Crypto": "text-yellow-400 bg-yellow-400/10",
  "Layer 1": "text-yellow-400 bg-yellow-400/10",
  "Exchange": "text-yellow-400 bg-yellow-400/10",
  "Conglomerate": "text-teal-400 bg-teal-400/10",
  "Insurance": "text-cyan-400 bg-cyan-400/10",
  "Pharma": "text-green-400 bg-green-400/10",
  "Utilities": "text-sky-400 bg-sky-400/10",
  "Islamic Bank": "text-emerald-400 bg-emerald-400/10",
  "Auto/EV": "text-red-400 bg-red-400/10",
  "E-Commerce": "text-orange-400 bg-orange-400/10",
  "Social Media": "text-indigo-400 bg-indigo-400/10",
  "ETF · S&P 500": "text-slate-400 bg-slate-400/10",
};

const MARKET_ACCENT: Record<Market, string> = {
  US:     "text-blue-400 border-blue-400/30 bg-blue-400/8",
  INDIA:  "text-green-400 border-green-400/30 bg-green-400/8",
  UAE:    "text-purple-400 border-purple-400/30 bg-purple-400/8",
  CRYPTO: "text-orange-400 border-orange-400/30 bg-orange-400/8",
};
const MARKET_GLOW: Record<Market, string> = {
  US:     "shadow-[0_0_20px_-8px_rgba(59,130,246,0.4)]",
  INDIA:  "shadow-[0_0_20px_-8px_rgba(34,197,94,0.4)]",
  UAE:    "shadow-[0_0_20px_-8px_rgba(168,85,247,0.4)]",
  CRYPTO: "shadow-[0_0_20px_-8px_rgba(249,115,22,0.4)]",
};

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  show:   (i: number) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.22, delay: i * 0.04, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MarketsPage() {
  const { activeMarket, setActiveMarket, setSelectedSymbol } = useStore();
  const router = useRouter();
  const symbols = DEFAULT_WATCHLIST[activeMarket as keyof typeof DEFAULT_WATCHLIST] ?? [];

  // Only hit Polygon for US + Crypto (free tier)
  const usePolygon = activeMarket === "US" || activeMarket === "CRYPTO";
  const { quotes, loading, lastUpdated } = useMarketData(
    usePolygon ? symbols : [],
    activeMarket === "CRYPTO" ? "CRYPTO" : "US"
  );

  const overview = MARKET_OVERVIEW[activeMarket as Market] ?? [];

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">

      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            {MARKET_LABELS[activeMarket as Market]} Markets
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {symbols.length} symbols · {usePolygon ? "Live via Polygon.io" : "Static data · NSE/ADX/DFM"}
            {lastUpdated && ` · Updated ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          {usePolygon && (
            <span className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              <motion.div className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
              POLYGON LIVE
            </span>
          )}
        </div>
      </motion.div>

      {/* Market tabs */}
      <div className="flex items-center gap-2">
        {(["US", "INDIA", "UAE", "CRYPTO"] as Market[]).map((m) => (
          <motion.button
            key={m}
            onClick={() => setActiveMarket(m)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200",
              activeMarket === m
                ? cn(MARKET_ACCENT[m], MARKET_GLOW[m])
                : "text-muted-foreground border-transparent hover:border-border hover:text-foreground"
            )}
          >
            {MARKET_LABELS[m]}
          </motion.button>
        ))}
      </div>

      {/* Overview index cards */}
      <motion.div
        key={activeMarket + "-overview"}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {overview.map((card, i) => (
          <motion.div key={card.label}
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="bg-card border border-border rounded-xl px-4 py-3 space-y-0.5 hover:border-border/60 transition-colors"
          >
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{card.label}</div>
            <div className="font-heading text-base font-semibold mono">{card.value}</div>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs mono font-medium", card.change >= 0 ? "gain" : "loss")}>
                {card.change >= 0 ? "+" : ""}{card.change.toFixed(2)}%
              </span>
              <span className="text-[10px] text-muted-foreground">{card.sub}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Symbol table */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMarket}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="bg-card border border-border rounded-xl overflow-hidden"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs bg-muted/20">
                <th className="text-left px-4 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium">Symbol</th>
                <th className="hidden sm:table-cell px-4 py-3 font-medium text-center">7D Chart</th>
                <th className="text-right px-4 py-3 font-medium">Price</th>
                <th className="text-right px-4 py-3 font-medium">24h %</th>
                <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Volume</th>
                <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Mkt Cap</th>
                <th className="text-right px-4 py-3 font-medium hidden xl:table-cell">Sector</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {symbols.map((sym, i) => {
                const live = quotes[sym.toUpperCase()];
                const fb   = MARKET_DATA[sym];
                if (!fb) return null;

                const price  = live?.price     ?? fb.price;
                const change = live?.changePct  ?? fb.change;
                const isLive = !!live;
                const isUp   = change >= 0;
                const curr   = fb.currency;

                return (
                  <motion.tr
                    key={sym}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="show"
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    className="cursor-pointer group transition-colors"
                    onClick={() => { setSelectedSymbol(sym); router.push("/charts"); }}
                  >
                    {/* Rank */}
                    <td className="px-4 py-3 text-xs text-muted-foreground mono">{i + 1}</td>

                    {/* Symbol + exchange */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {/* Color dot */}
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold",
                          isUp ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                        )}>
                          {sym.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="mono font-semibold text-sm group-hover:text-primary transition-colors">{sym}</span>
                            {isLive && (
                              <span className="text-[8px] px-1 py-0.5 rounded bg-primary/10 text-primary font-medium">LIVE</span>
                            )}
                          </div>
                          <span className="text-[9px] text-muted-foreground">{fb.exchange}</span>
                        </div>
                      </div>
                    </td>

                    {/* Sparkline */}
                    <td className="hidden sm:table-cell px-4 py-2 text-center">
                      <Sparkline data={fb.history} up={isUp} />
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 text-right">
                      <motion.span
                        key={price}
                        className="mono font-bold text-sm"
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {curr}{price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </motion.span>
                    </td>

                    {/* 24h change */}
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold mono",
                        isUp
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                      )}>
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {formatPct(change)}
                      </span>
                    </td>

                    {/* Volume */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <VolumeBar volume={fb.volume} />
                    </td>

                    {/* Market cap */}
                    <td className="px-4 py-3 text-right mono text-xs text-muted-foreground hidden lg:table-cell">
                      {curr}{fb.mcap}
                    </td>

                    {/* Sector */}
                    <td className="px-4 py-3 text-right hidden xl:table-cell">
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-medium",
                        SECTOR_COLORS[fb.sector] ?? "text-muted-foreground bg-muted/40"
                      )}>
                        {fb.sector}
                      </span>
                    </td>

                    {/* Arrow */}
                    <td className="px-3 py-3">
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all" />
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-primary/50" />
          {usePolygon
            ? "Polygon.io · Daily OHLCV · Free tier · 60s refresh"
            : `Static data · ${activeMarket === "INDIA" ? "NSE prices in INR" : "ADX/DFM prices in AED"} · Connect broker API for live quotes`}
        </span>
        <span className="flex items-center gap-1">
          <BarChart3 className="w-3 h-3" />
          Click any row to open chart
        </span>
      </div>
    </div>
  );
}
