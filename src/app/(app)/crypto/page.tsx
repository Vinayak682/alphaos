"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { RefreshCw, TrendingUp, TrendingDown, ExternalLink, Zap, Bell } from "lucide-react";
import { fgColor, fgLabel } from "@/lib/fearGreed";
import { addAlert } from "@/lib/alerts";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CoinData {
  symbol: string;      // BTCUSDT
  name: string;
  icon: string;
  price: number;
  change24h: number;   // percent
  high24h: number;
  low24h: number;
  volume24h: number;   // in quote (USD)
  fgScore: number;
  marketCap: string;   // formatted string
}

interface CryptoNews {
  headline: string;
  source: string;
  url: string;
  sentiment: "bullish" | "bearish" | "neutral";
  age: string;
  coin?: string;
}

interface Influencer {
  handle: string;
  name: string;
  stance: "BULLISH" | "BEARISH" | "NEUTRAL";
  coin: string;
  signal: string;
  context: string;
  score: number; // 0-100 sentiment
  followers: string;
}

// ── Static data ───────────────────────────────────────────────────────────────
const COINS_META = [
  { symbol: "BTCUSDT",  name: "Bitcoin",  icon: "₿",  bnId: "BTCUSDT",  cgRank: 1,  supply: 19_720_000     },
  { symbol: "ETHUSDT",  name: "Ethereum", icon: "Ξ",  bnId: "ETHUSDT",  cgRank: 2,  supply: 120_200_000    },
  { symbol: "SOLUSDT",  name: "Solana",   icon: "◎",  bnId: "SOLUSDT",  cgRank: 5,  supply: 470_000_000    },
  { symbol: "MATICUSDT",name: "Polygon",  icon: "⬡",  bnId: "MATICUSDT",cgRank: 16, supply: 9_900_000_000  },
];

const INFLUENCERS: Influencer[] = [
  {
    handle: "@saylor",
    name: "Michael Saylor",
    stance: "BULLISH",
    coin: "BTC",
    signal: "Bitcoin is the apex predator of monetary assets. Every dip is an accumulation opportunity.",
    context: "MicroStrategy holds 214,400 BTC. Average cost basis ~$35,180. Strategy: infinite hold.",
    score: 97,
    followers: "4.1M",
  },
  {
    handle: "@RaoulGMI",
    name: "Raoul Pal",
    stance: "BULLISH",
    coin: "BTC/ETH",
    signal: "We are in the exponential phase. Banana zone confirmed. Liquidity cycle driving all risk assets.",
    context: "Global macro fund manager. Real Vision CEO. BTC + ETH core holdings. Expects new ATH cycle Q3 2026.",
    score: 88,
    followers: "1.2M",
  },
  {
    handle: "@LynAldenContact",
    name: "Lyn Alden",
    stance: "BULLISH",
    coin: "BTC",
    signal: "Bitcoin continues to track global M2 money supply. Monetary debasement thesis intact.",
    context: "Macro investment researcher. BTC as the hardest monetary asset. No leverage, long-term compounding view.",
    score: 80,
    followers: "1.0M",
  },
  {
    handle: "@CryptoHayes",
    name: "Arthur Hayes",
    stance: "BULLISH",
    coin: "BTC/ETH",
    signal: "Fiat liquidity tsunami incoming. Dollar debasement forces capital into hard assets — BTC first.",
    context: "BitMEX founder. Published Maelstrom macro theses. Expects BTC $250k+ by year-end 2026.",
    score: 85,
    followers: "1.5M",
  },
  {
    handle: "@CathieDWood",
    name: "Cathie Wood",
    stance: "BULLISH",
    coin: "BTC",
    signal: "Institutional adoption accelerating via ETFs. Long-term BTC price target: $1.5M by 2030.",
    context: "ARK Invest. ARKB ETF. Models $1.5M BTC on institutional allocation reaching 5% of portfolios.",
    score: 82,
    followers: "1.6M",
  },
  {
    handle: "@woonomic",
    name: "Willy Woo",
    stance: "BULLISH",
    coin: "BTC",
    signal: "On-chain: long-term holders accumulating at record pace. Exchange reserves at multi-year lows.",
    context: "On-chain analyst. HODL waves show strong diamond-hand behavior. Illiquid supply increasing.",
    score: 78,
    followers: "1.1M",
  },
  {
    handle: "@blknoiz06",
    name: "Ansem",
    stance: "BULLISH",
    coin: "SOL",
    signal: "Solana ecosystem is the most active L1. Developer activity, DeFi TVL, and NFT volume all ATH.",
    context: "Crypto trader and analyst. Strong Solana ecosystem thesis. Expects SOL to outperform ETH this cycle.",
    score: 84,
    followers: "650K",
  },
  {
    handle: "@CryptoKaleo",
    name: "KALEO",
    stance: "NEUTRAL",
    coin: "BTC/ALT",
    signal: "BTC dominance topping. Waiting for rotation into alts before adding aggression. Patient here.",
    context: "Technical analyst. Known for calling major cycle tops and bottoms. Currently watching dominance levels.",
    score: 55,
    followers: "750K",
  },
];

const FALLBACK_NEWS: CryptoNews[] = [
  { headline: "Bitcoin ETF inflows surge to $1.2B in single day as institutional demand accelerates", source: "CoinDesk", url: "https://coindesk.com", sentiment: "bullish", age: "2h ago", coin: "BTC" },
  { headline: "Ethereum Pectra upgrade live — EIP-7702 enables account abstraction at scale", source: "The Block", url: "https://theblock.co", sentiment: "bullish", age: "4h ago", coin: "ETH" },
  { headline: "Solana DeFi TVL crosses $12B for first time — Raydium + Jupiter driving volume", source: "DeFiLlama", url: "https://defillama.com", sentiment: "bullish", age: "5h ago", coin: "SOL" },
  { headline: "MicroStrategy acquires additional 11,200 BTC — total treasury now 214,400 BTC", source: "Bloomberg", url: "https://bloomberg.com/crypto", sentiment: "bullish", age: "6h ago", coin: "BTC" },
  { headline: "Fed minutes signal two rate cuts in 2026 — risk assets rally on liquidity outlook", source: "Reuters", url: "https://reuters.com/finance", sentiment: "bullish", age: "8h ago", coin: "BTC" },
  { headline: "Polygon 2.0 AggLayer connects 15 new chains — cross-chain volume up 340%", source: "Decrypt", url: "https://decrypt.co", sentiment: "bullish", age: "10h ago", coin: "MATIC" },
  { headline: "Crypto Fear & Greed turns Neutral — market consolidating before next leg higher", source: "Alternative.me", url: "https://alternative.me/crypto/fear-and-greed-index/", sentiment: "neutral", age: "1h ago", coin: "CRYPTO" },
  { headline: "Bitcoin miners capitulation over — hash rate recovers to ATH post-halving", source: "CryptoQuant", url: "https://cryptoquant.com", sentiment: "bullish", age: "12h ago", coin: "BTC" },
];

// ── Binance live price fetch ──────────────────────────────────────────────────
async function fetchBinancePrices(): Promise<Map<string, { price: number; change24h: number; high24h: number; low24h: number; vol24h: number }>> {
  const symbols = COINS_META.map(c => `"${c.bnId}"`).join(",");
  const r = await fetch(
    `https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbols}]`,
    { signal: AbortSignal.timeout(6000) }
  );
  if (!r.ok) throw new Error("Binance error");
  const data: { symbol: string; lastPrice: string; priceChangePercent: string; highPrice: string; lowPrice: string; quoteVolume: string }[] = await r.json();
  const map = new Map<string, { price: number; change24h: number; high24h: number; low24h: number; vol24h: number }>();
  for (const d of data) {
    map.set(d.symbol, {
      price:    parseFloat(d.lastPrice),
      change24h: parseFloat(d.priceChangePercent),
      high24h:  parseFloat(d.highPrice),
      low24h:   parseFloat(d.lowPrice),
      vol24h:   parseFloat(d.quoteVolume),
    });
  }
  return map;
}

async function fetchCryptoFG(): Promise<number> {
  try {
    const r = await fetch("https://api.alternative.me/fng/?limit=1", { signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    return parseInt(d.data[0].value);
  } catch { return 50; }
}

async function fetchCryptoNews(apiKey: string): Promise<CryptoNews[]> {
  if (!apiKey) return FALLBACK_NEWS;
  try {
    const r = await fetch(
      `https://finnhub.io/api/v1/news?category=crypto&token=${apiKey}`,
      { signal: AbortSignal.timeout(7000) }
    );
    if (!r.ok) return FALLBACK_NEWS;
    const items: { headline: string; source: string; url: string; sentiment?: number; datetime: number }[] = await r.json();
    const now = Date.now() / 1000;
    return items.slice(0, 12).map((n) => {
      const age = now - n.datetime;
      const ageStr = age < 3600 ? `${Math.round(age / 60)}m ago`
        : age < 86400 ? `${Math.round(age / 3600)}h ago`
        : `${Math.round(age / 86400)}d ago`;
      const sent = (n.sentiment ?? 0);
      return {
        headline: n.headline,
        source:   n.source || "Finnhub",
        url:      n.url || "https://finnhub.io",
        sentiment: sent > 0.1 ? "bullish" : sent < -0.1 ? "bearish" : "neutral",
        age:      ageStr,
      };
    });
  } catch { return FALLBACK_NEWS; }
}

// ── FG mini gauge ─────────────────────────────────────────────────────────────
function FGMini({ score, color }: { score: number; color: string }) {
  const pct = score / 100;
  const r = 28, cx = 36, cy = 36, sw = 6;
  const circ = Math.PI * r; // semicircle
  function polarToXY(angle: number) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  function arc(from: number, to: number) {
    const s = polarToXY(from), e = polarToXY(to);
    return `M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`;
  }
  const needleAngle = -180 + score * 1.8;
  const tip = polarToXY(needleAngle);
  void circ; void pct;
  return (
    <svg width={72} height={44} viewBox="0 0 72 44">
      <path d={arc(-180, 0)} fill="none" stroke="#1a1a1a" strokeWidth={sw} strokeLinecap="butt" />
      {[
        { from: -180, to: -144, color: "#FF2020" },
        { from: -144, to: -108, color: "#FF8C00" },
        { from: -108, to: -72,  color: "#FFB800" },
        { from: -72,  to: -36,  color: "#00CC66" },
        { from: -36,  to: 0,    color: "#00FF88" },
      ].map(z => (
        <path key={z.from} d={arc(z.from, z.to)} fill="none" stroke={z.color} strokeWidth={sw} strokeLinecap="butt" opacity={0.2} />
      ))}
      <path d={arc(-180, needleAngle)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="butt" opacity={0.9} />
      <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="#fff" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={3} fill="#fff" />
    </svg>
  );
}

// ── Coin card ─────────────────────────────────────────────────────────────────
function CoinCard({ coin, idx, onAlert }: { coin: CoinData; idx: number; onAlert: (symbol: string, price: number) => void }) {
  const up = coin.change24h >= 0;
  const fg = fgColor(coin.fgScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: idx * 0.07 }}
      className="bg-card border border-border rounded-xl p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-sm mono shrink-0">
            {coin.icon}
          </div>
          <div>
            <p className="font-heading font-bold text-sm leading-tight">{coin.name}</p>
            <p className="text-[10px] text-muted-foreground mono">{coin.symbol}</p>
          </div>
        </div>
        <button
          onClick={() => onAlert(coin.symbol, coin.price)}
          className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-colors"
          title="Set price alert"
        >
          <Bell className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Price */}
      <div>
        <p className="mono font-bold text-2xl leading-tight">
          ${coin.price < 1 ? coin.price.toFixed(4) : coin.price < 100 ? coin.price.toFixed(2) : coin.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {up ? <TrendingUp className="w-3 h-3 text-green-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
          <span className={cn("mono text-xs font-semibold", up ? "text-green-400" : "text-red-400")}>
            {up ? "+" : ""}{coin.change24h.toFixed(2)}%
          </span>
          <span className="text-[10px] text-muted-foreground">24h</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center py-2 border-t border-b border-border/50">
        {[
          { label: "24h High", val: `$${coin.high24h < 100 ? coin.high24h.toFixed(2) : coin.high24h.toLocaleString("en-US", { maximumFractionDigits: 0 })}` },
          { label: "24h Low",  val: `$${coin.low24h  < 100 ? coin.low24h.toFixed(2)  : coin.low24h.toLocaleString("en-US",  { maximumFractionDigits: 0 })}` },
          { label: "Mkt Cap",  val: coin.marketCap },
        ].map(s => (
          <div key={s.label}>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="mono text-[11px] font-semibold text-foreground mt-0.5">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Fear & Greed mini */}
      <div className="flex items-center gap-3">
        <FGMini score={coin.fgScore} color={fg} />
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Fear &amp; Greed</p>
          <p className="mono font-bold text-base" style={{ color: fg }}>{coin.fgScore}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: fg }}>{fgLabel(coin.fgScore)}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── News feed ─────────────────────────────────────────────────────────────────
function NewsRow({ n, idx }: { n: CryptoNews; idx: number }) {
  const sentColor = n.sentiment === "bullish" ? "text-green-400 bg-green-400/10" : n.sentiment === "bearish" ? "text-red-400 bg-red-400/10" : "text-yellow-400 bg-yellow-400/10";
  return (
    <motion.a
      href={n.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/40 transition-colors group cursor-pointer"
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">{n.headline}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-muted-foreground">{n.source}</span>
          <span className="text-[10px] text-muted-foreground/50">·</span>
          <span className="text-[10px] text-muted-foreground">{n.age}</span>
          {n.coin && <span className="text-[9px] mono px-1 rounded bg-muted text-muted-foreground">{n.coin}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider", sentColor)}>
          {n.sentiment}
        </span>
        <ExternalLink className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
      </div>
    </motion.a>
  );
}

// ── Influencer card ───────────────────────────────────────────────────────────
function InfluencerCard({ inf, idx }: { inf: Influencer; idx: number }) {
  const stanceColor = inf.stance === "BULLISH" ? "text-green-400 bg-green-400/10 border-green-400/20"
    : inf.stance === "BEARISH" ? "text-red-400 bg-red-400/10 border-red-400/20"
    : "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06 }}
      className="bg-card border border-border rounded-xl p-4 space-y-2.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading font-bold text-sm">{inf.name}</p>
          <p className="text-[10px] text-muted-foreground mono">{inf.handle} · {inf.followers} followers</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{inf.coin}</span>
          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider", stanceColor)}>
            {inf.stance}
          </span>
        </div>
      </div>

      {/* Signal quote */}
      <div className="flex gap-2 p-2.5 bg-accent/20 rounded-lg border border-border/50">
        <Zap className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
        <p className="text-[11px] leading-relaxed text-foreground/85 italic">&ldquo;{inf.signal}&rdquo;</p>
      </div>

      {/* Context + score */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] text-muted-foreground leading-relaxed flex-1">{inf.context}</p>
        <div className="shrink-0 text-right">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Sentiment</p>
          <p className="mono font-bold text-sm" style={{ color: fgColor(inf.score) }}>{inf.score}</p>
        </div>
      </div>

      {/* Sentiment bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: fgColor(inf.score) }}
          initial={{ width: 0 }}
          animate={{ width: `${inf.score}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.06 + 0.3 }}
        />
      </div>
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function CoinSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-2"><div className="w-8 h-8 bg-muted rounded-lg" /><div className="space-y-1"><div className="h-3 w-20 bg-muted rounded" /><div className="h-2 w-12 bg-muted rounded" /></div></div>
      <div className="h-7 w-32 bg-muted rounded" />
      <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-border/50">{[1,2,3].map(i => <div key={i} className="h-8 bg-muted rounded" />)}</div>
      <div className="h-12 bg-muted rounded" />
    </div>
  );
}

// ── Alert snackbar ────────────────────────────────────────────────────────────
function AlertToast({ msg, onDismiss }: { msg: string; onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 3000); return () => clearTimeout(t); }, [onDismiss]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl shadow-xl text-sm font-medium"
    >
      <Bell className="w-3.5 h-3.5" />{msg}
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CryptoPage() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [news, setNews]   = useState<CryptoNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState<{ symbol: string; price: number } | null>(null);
  const [alertPrice, setAlertPrice] = useState("");
  const [alertDir, setAlertDir] = useState<"price_above" | "price_below">("price_above");

  const load = useCallback(async (spinner = false) => {
    if (spinner) setRefreshing(true);
    try {
      const [priceMap, fgScore, cryptoNews] = await Promise.all([
        fetchBinancePrices(),
        fetchCryptoFG(),
        fetchCryptoNews(process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? ""),
      ]);

      const builtCoins: CoinData[] = COINS_META.map((meta, i) => {
        const p = priceMap.get(meta.symbol);
        const price = p?.price ?? [65000, 3500, 170, 0.85][i];
        const change24h = p?.change24h ?? 0;
        const high24h = p?.high24h ?? price * 1.02;
        const low24h  = p?.low24h  ?? price * 0.98;
        const vol24h  = p?.vol24h  ?? 0;

        // Market cap approximation from price × supply
        const cap = price * meta.supply;
        const marketCap = cap > 1e12 ? `$${(cap / 1e12).toFixed(2)}T`
          : cap > 1e9  ? `$${(cap / 1e9).toFixed(1)}B`
          : `$${(cap / 1e6).toFixed(0)}M`;

        // Per-coin F&G derivation
        const fgVariance = [0, -8, 5, -12][i];          // BTC = baseline, ETH slightly lower, SOL higher beta, MATIC most volatile
        const changeFactor = Math.min(Math.max(change24h * 2, -20), 20);
        const fgScore2 = Math.max(0, Math.min(100, Math.round(fgScore + fgVariance + changeFactor)));

        return {
          symbol: meta.symbol,
          name:   meta.name,
          icon:   meta.icon,
          price, change24h, high24h, low24h,
          volume24h: vol24h,
          fgScore:   fgScore2,
          marketCap,
        };
      });

      setCoins(builtCoins);
      setNews(cryptoNews);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleAlertClick(symbol: string, price: number) {
    setAlertModal({ symbol, price });
    setAlertPrice(Math.round(price * 1.05).toString());
    setAlertDir("price_above");
  }

  function confirmAlert() {
    if (!alertModal) return;
    const val = parseFloat(alertPrice);
    if (isNaN(val) || val <= 0) return;
    addAlert({ symbol: alertModal.symbol, conditionType: alertDir, threshold: val, channel: "Email", active: true });
    setAlertModal(null);
    setToast(`Alert set: ${alertModal.symbol} ${alertDir === "price_above" ? "above" : "below"} $${val.toLocaleString()}`);
  }

  const totalMktCap = coins.length ? (() => {
    const t = COINS_META.reduce((s, m, i) => s + (coins[i]?.price ?? 0) * m.supply, 0);
    return t > 1e12 ? `$${(t / 1e12).toFixed(2)}T` : `$${(t / 1e9).toFixed(0)}B`;
  })() : null;

  return (
    <div className="p-4 space-y-5 h-full overflow-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold">Crypto Markets</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Live via Binance · F&amp;G via Alternative.me · News via Finnhub</p>
        </div>
        <div className="flex items-center gap-3">
          {totalMktCap && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Mkt Cap</p>
              <p className="mono font-bold text-base text-foreground">{totalMktCap}</p>
            </div>
          )}
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground mono">
              {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-accent/50 transition-colors text-xs text-muted-foreground disabled:opacity-40"
          >
            <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Coin cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? [1,2,3,4].map(i => <CoinSkeleton key={i} />)
          : coins.map((c, i) => <CoinCard key={c.symbol} coin={c} idx={i} onAlert={handleAlertClick} />)
        }
      </div>

      {/* Inline alert modal */}
      <AnimatePresence>
        {alertModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setAlertModal(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
              className="bg-card border border-border rounded-2xl p-5 w-full max-w-xs shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-heading font-bold text-sm">Set Alert — <span className="mono text-primary">{alertModal.symbol}</span></p>
                <button onClick={() => setAlertModal(null)} className="text-muted-foreground hover:text-foreground"><span className="text-xs">✕</span></button>
              </div>
              <p className="text-xs text-muted-foreground">Current price: <span className="mono text-foreground font-semibold">${alertModal.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span></p>
              <div className="grid grid-cols-2 gap-2">
                {(["price_above", "price_below"] as const).map(d => (
                  <button key={d} onClick={() => setAlertDir(d)}
                    className={cn("py-1.5 text-xs rounded-lg border font-medium transition-colors",
                      alertDir === d ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground")}
                  >{d === "price_above" ? "Price Above" : "Price Below"}</button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm mono">$</span>
                <input
                  value={alertPrice}
                  onChange={e => setAlertPrice(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && confirmAlert()}
                  type="number"
                  className="w-full bg-muted/50 border border-border rounded-lg py-2.5 pl-7 pr-3 text-sm mono font-medium focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <button onClick={confirmAlert}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
                <Bell className="w-3.5 h-3.5" />Create Alert
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom grid: news + influencers */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Crypto news */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">Crypto News</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-muted-foreground">Finnhub live</span>
            </div>
          </div>
          <div className="divide-y divide-border/40 max-h-[520px] overflow-y-auto scrollbar-hide">
            {(loading ? FALLBACK_NEWS : news).map((n, i) => (
              <NewsRow key={i} n={n} idx={i} />
            ))}
          </div>
        </motion.div>

        {/* Influencer signals */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Influencer Signal Feed</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Public stances from top crypto analysts — factored into AlphaBot signals</p>
            </div>
          </div>
          <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1 scrollbar-hide">
            {INFLUENCERS.map((inf, i) => (
              <InfluencerCard key={inf.handle} inf={inf} idx={i} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <AlertToast msg={toast} onDismiss={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
