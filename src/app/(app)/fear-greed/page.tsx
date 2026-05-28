"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { RefreshCw, TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import { fetchFearGreed, fgColor, type FGMarket } from "@/lib/fearGreed";

// ── SVG semicircular gauge ────────────────────────────────────────────────────
function FGGauge({ score, color, size = 160 }: { score: number; color: string; size?: number }) {
  const cx = size / 2, cy = size * 0.58;
  const r  = size * 0.40;
  const strokeW = size * 0.075;

  // Arc from -180° to 0° (left to right semicircle)
  function polarToXY(angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  function arc(from: number, to: number) {
    const s = polarToXY(from), e = polarToXY(to);
    const large = Math.abs(to - from) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  // Needle angle: score 0 → -180°, score 100 → 0°
  const needleAngle = -180 + score * 1.8;
  const needleTip = polarToXY(needleAngle);

  const zones = [
    { from: -180, to: -144, color: "#FF2020" },
    { from: -144, to: -108, color: "#FF8C00" },
    { from: -108, to:  -72, color: "#FFB800" },
    { from:  -72, to:  -36, color: "#00CC66" },
    { from:  -36, to:    0, color: "#00FF88" },
  ];

  return (
    <svg width={size} height={size * 0.68} viewBox={`0 0 ${size} ${size * 0.68}`}>
      {/* Background track */}
      <path d={arc(-180, 0)} fill="none" stroke="#1a1a1a" strokeWidth={strokeW} strokeLinecap="butt" />
      {/* Colored zones */}
      {zones.map((z) => (
        <path key={z.from} d={arc(z.from, z.to)} fill="none" stroke={z.color}
          strokeWidth={strokeW} strokeLinecap="butt" opacity={0.25} />
      ))}
      {/* Active fill up to needle */}
      <path d={arc(-180, needleAngle)} fill="none" stroke={color}
        strokeWidth={strokeW} strokeLinecap="butt" opacity={0.9} />
      {/* Needle */}
      <motion.line
        x1={cx} y1={cy}
        x2={needleTip.x} y2={needleTip.y}
        stroke="#ffffff" strokeWidth={size * 0.018} strokeLinecap="round"
        initial={{ rotate: -180, originX: cx, originY: cy }}
        animate={{ rotate: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      {/* Centre dot */}
      <circle cx={cx} cy={cy} r={size * 0.04} fill="#ffffff" />
    </svg>
  );
}

// ── Mini component bar ────────────────────────────────────────────────────────
function ComponentBar({ name, value }: { name: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-32 shrink-0">{name}</span>
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: fgColor(value) }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="mono text-[10px] font-semibold w-7 text-right" style={{ color: fgColor(value) }}>
        {value}
      </span>
    </div>
  );
}

// ── Market card ───────────────────────────────────────────────────────────────
function MarketCard({ m, idx }: { m: FGMarket; idx: number }) {
  const delta  = m.score - m.prevScore;
  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: idx * 0.08 }}
      className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{m.flag}</span>
          <span className="font-heading font-bold text-sm">{m.market}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <DeltaIcon className={cn("w-3 h-3", delta > 0 ? "text-green-400" : delta < 0 ? "text-red-400" : "text-muted-foreground")} />
          <span className={cn("mono text-[10px] font-semibold", delta > 0 ? "text-green-400" : delta < 0 ? "text-red-400" : "text-muted-foreground")}>
            {delta > 0 ? "+" : ""}{delta}
          </span>
          <span className="text-[10px] text-muted-foreground">vs yday</span>
        </div>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center gap-1">
        <FGGauge score={m.score} color={m.color} size={148} />
        <div className="text-center -mt-1">
          <p className="mono font-bold text-3xl" style={{ color: m.color }}>{m.score}</p>
          <p className="font-heading font-bold text-xs uppercase tracking-wider mt-0.5" style={{ color: m.color }}>
            {m.label}
          </p>
        </div>
      </div>

      {/* Components */}
      <div className="space-y-1.5 pt-1 border-t border-border/50">
        {m.components.map((c) => (
          <ComponentBar key={c.name} name={c.name} value={c.value} />
        ))}
      </div>

      {/* Strategy */}
      <div className="flex gap-2 p-2.5 rounded-lg bg-accent/30 border border-border/50">
        <Zap className="w-3 h-3 shrink-0 mt-0.5" style={{ color: m.color }} />
        <p className="text-[11px] leading-relaxed text-foreground/80">{m.strategy}</p>
      </div>
    </motion.div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="h-4 w-12 bg-muted rounded" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-36 h-24 bg-muted rounded" />
        <div className="h-8 w-16 bg-muted rounded" />
        <div className="h-3 w-24 bg-muted rounded" />
      </div>
      <div className="space-y-1.5 pt-2 border-t border-border/50">
        {[1,2,3].map(i => <div key={i} className="h-2 bg-muted rounded" />)}
      </div>
      <div className="h-12 bg-muted rounded" />
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function FearGreedPage() {
  const [markets, setMarkets] = useState<FGMarket[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (spinner = false) => {
    if (spinner) setRefreshing(true);
    try {
      const data = await fetchFearGreed();
      setMarkets(data);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const avg = markets.length ? Math.round(markets.reduce((s, m) => s + m.score, 0) / markets.length) : null;

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold">Fear &amp; Greed Index</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Live sentiment · Crypto: alternative.me · Equities: Finnhub · Updates on every visit
          </p>
        </div>
        <div className="flex items-center gap-3">
          {avg !== null && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Global Avg</p>
              <p className="mono font-bold text-xl" style={{ color: fgColor(avg) }}>{avg}</p>
            </div>
          )}
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground mono">
              {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => load(true)} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-accent/50 transition-colors text-xs text-muted-foreground disabled:opacity-40"
          >
            <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Scale legend */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex items-center gap-1 overflow-x-auto pb-1">
        {[
          { label: "Extreme Fear", range: "0–20",   color: "#FF2020" },
          { label: "Fear",         range: "21–40",  color: "#FF8C00" },
          { label: "Neutral",      range: "41–60",  color: "#FFB800" },
          { label: "Greed",        range: "61–80",  color: "#00CC66" },
          { label: "Extreme Greed",range: "81–100", color: "#00FF88" },
        ].map((z, i) => (
          <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 bg-card shrink-0">
            <div className="w-2 h-2 rounded-full" style={{ background: z.color }} />
            <span className="text-[10px] font-medium" style={{ color: z.color }}>{z.label}</span>
            <span className="text-[10px] text-muted-foreground mono">{z.range}</span>
          </div>
        ))}
      </motion.div>

      {/* 4 market cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? [1,2,3,4].map(i => <SkeletonCard key={i} />)
          : markets.map((m, i) => <MarketCard key={m.market} m={m} idx={i} />)
        }
      </div>

      {/* Methodology */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">How It&apos;s Calculated</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
          <div><p className="font-semibold text-foreground mb-1">🇺🇸 US</p><p>SPY news sentiment (Finnhub) 70% + Crypto macro signal 30%</p></div>
          <div><p className="font-semibold text-foreground mb-1">🇮🇳 India</p><p>INDA ETF sentiment (Finnhub) 60% + FII proxy 25% + Global macro 15%</p></div>
          <div><p className="font-semibold text-foreground mb-1">🇦🇪 UAE</p><p>Oil sentiment (US proxy) 45% + Crypto macro 30% + AED peg stability 25%</p></div>
          <div><p className="font-semibold text-foreground mb-1">₿ Crypto</p><p>Alternative.me index — direct real-time feed. BTC momentum + social sentiment</p></div>
        </div>
      </motion.div>

    </div>
  );
}
