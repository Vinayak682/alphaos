"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, BarChart, Bar, Cell,
} from "recharts";
import {
  RefreshCw, Loader2, Fuel, Gem, Globe2, TrendingUp, TrendingDown,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Minus, Info,
} from "lucide-react";
import { cn, formatPct } from "@/lib/utils";
import { useCommodities } from "@/hooks/useCommodities";
import { usePaperPortfolio } from "@/hooks/usePaperPortfolio";
import TradeModal from "@/components/ui/TradeModal";
import {
  downsample, regimeLabel,
  OIL_BENCHMARKS, TOP_OIL_PRODUCERS, OIL_RESERVES, TOP_OIL_IMPORTERS, OPEC_PLUS_NOTE,
  TOP_GOLD_PRODUCERS, CENTRAL_BANK_GOLD, GOLD_DEMAND,
  OIL_DRIVERS, GOLD_DRIVERS, PRICE_SHOCKS, COMMODITY_PROXIES,
  type SeriesStats, type HistoryPoint, type CountryStat, type DriverNote,
} from "@/lib/commodities";

const TABS = [
  { id: "overview",  label: "Overview",  icon: Globe2 },
  { id: "oil",       label: "Oil",       icon: Fuel   },
  { id: "gold",      label: "Gold",      icon: Gem    },
  { id: "equities",  label: "Equities",  icon: TrendingUp },
  { id: "world",     label: "World Data",icon: Globe2 },
] as const;
type TabId = typeof TABS[number]["id"];

const GOLD_HEX  = "#F5B301";
const OIL_HEX   = "#4FA3FF";
const BRENT_HEX = "#00FF88";

// ── Small presentational helpers ──────────────────────────────────────────────

function Stat({ label, value, sub, tone, mono = true }: {
  label: string; value: string; sub?: string;
  tone?: "gain" | "loss" | "neutral"; mono?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <p className={cn("font-heading text-lg font-bold mt-0.5", mono && "mono",
        tone === "gain" && "gain", tone === "loss" && "loss")}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Panel({ title, subtitle, icon: Icon, children, className }: {
  title: string; subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-4", className)}>
      <div className="flex items-baseline gap-2 mb-3">
        {Icon && <Icon className="w-3.5 h-3.5 text-primary shrink-0" />}
        <h3 className="font-heading text-sm font-semibold">{title}</h3>
        {subtitle && <span className="text-[11px] text-muted-foreground">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function StatsGrid({ stats, unit }: { stats: SeriesStats; unit: string }) {
  const regime = regimeLabel(stats);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="Latest" value={`$${stats.latest.toFixed(2)}`} sub={unit} />
        {/* "Series", not "all-time" — these are computed over the loaded window only. */}
        <Stat label="Series high" value={`$${stats.max.value.toFixed(2)}`} sub={stats.max.date} />
        <Stat label="Series low"  value={`$${stats.min.value.toFixed(2)}`} sub={stats.min.date} />
        <Stat label="Mean" value={`$${stats.mean.toFixed(2)}`} sub={`median $${stats.median.toFixed(2)}`} />
        <Stat label="Volatility" value={`${stats.volatilityPct.toFixed(1)}%`} sub="stdev ÷ mean" />
        <Stat label="Max drawdown" value={`−${stats.maxDrawdownPct.toFixed(1)}%`} tone="loss" sub="peak to trough" />
        <Stat label="From peak" value={`−${stats.currentDrawdownPct.toFixed(1)}%`}
          tone={stats.currentDrawdownPct > 20 ? "loss" : undefined} sub="today vs high" />
        <Stat label="CAGR" value={stats.cagrPct != null ? formatPct(stats.cagrPct) : "—"}
          tone={stats.cagrPct != null && stats.cagrPct >= 0 ? "gain" : "loss"}
          sub={`over ${stats.spanYears.toFixed(0)}y`} />
      </div>
      <div className={cn("rounded-lg border px-3 py-2 flex items-start gap-2",
        regime.tone === "bull"  && "bg-primary/10 border-primary/25",
        regime.tone === "bear"  && "bg-destructive/10 border-destructive/25",
        regime.tone === "neutral" && "bg-yellow-500/10 border-yellow-500/25")}>
        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5",
          regime.tone === "bull" && "bg-primary/20 text-primary",
          regime.tone === "bear" && "bg-destructive/20 text-destructive",
          regime.tone === "neutral" && "bg-yellow-500/20 text-yellow-400")}>{regime.label}</span>
        <p className="text-xs text-muted-foreground">{regime.detail}</p>
      </div>
    </div>
  );
}

function CountryBars({ data, unit, color }: { data: CountryStat[]; unit: string; color: string }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="space-y-1.5">
      {data.map((d, i) => (
        <motion.div key={d.country} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, delay: i * 0.03 }} className="group">
          <div className="flex items-center gap-2">
            <span className="w-6 text-sm shrink-0">{d.flag}</span>
            <span className="text-xs w-32 shrink-0 truncate">{d.country}</span>
            <div className="flex-1 h-4 bg-muted/40 rounded overflow-hidden">
              <motion.div className="h-full rounded" style={{ backgroundColor: color }}
                initial={{ width: 0 }} animate={{ width: `${(d.value / max) * 100}%` }}
                transition={{ duration: 0.5, delay: i * 0.03 }} />
            </div>
            <span className="text-xs mono w-20 text-right shrink-0">
              {d.value.toLocaleString()} <span className="text-muted-foreground text-[10px]">{unit}</span>
            </span>
          </div>
          {d.note && (
            <p className="text-[10px] text-muted-foreground ml-8 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {d.note}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function DriverList({ drivers }: { drivers: DriverNote[] }) {
  const ICON = { up: ArrowUpRight, down: ArrowDownRight, mixed: Minus };
  const CLS  = { up: "text-primary", down: "text-destructive", mixed: "text-yellow-400" };
  return (
    <div className="space-y-2">
      {drivers.map((d) => {
        const Icon = ICON[d.direction];
        return (
          <div key={d.driver} className="flex items-start gap-2">
            <Icon className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", CLS[d.direction])} />
            <div>
              <p className="text-xs font-medium">{d.driver}</p>
              <p className="text-[11px] text-muted-foreground">{d.effect}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function chartData(points: HistoryPoint[], max = 240) {
  return downsample(points, max).map((p) => ({ date: p.date, value: p.value }));
}

const AXIS = { fill: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "var(--font-mono)" };
const TOOLTIP_STYLE = {
  background: "#0d1117", border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8, fontSize: 11, fontFamily: "var(--font-mono)",
};

// Recharts passes `ValueType | undefined`, so formatters must accept the wide type.
type RcValue = string | number | readonly (string | number)[] | undefined;
type RcName = string | number | undefined;

const toNum = (v: RcValue): number => (typeof v === "number" ? v : Number(v));

/** `$1,234.56/bbl` style tooltip formatter with a fixed series label. */
const moneyFmt = (suffix: string, label: string) =>
  (v: RcValue): [string, string] => {
    const n = toNum(v);
    return [Number.isFinite(n) ? `$${n.toFixed(2)}${suffix}` : "—", label];
  };

/** Same, but takes the series name from the datum (multi-line charts). */
const moneyFmtNamed = (suffix: string) =>
  (v: RcValue, n: RcName): [string, string] => {
    const num = toNum(v);
    return [
      Number.isFinite(num) ? `$${num.toFixed(2)}${suffix}` : "—",
      String(n ?? "").toUpperCase(),
    ];
  };

const pctFmt = (label: string) =>
  (v: RcValue): [string, string] => {
    const n = toNum(v);
    return [Number.isFinite(n) ? `${n}%` : "—", label];
  };

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CommoditiesPage() {
  const [tab, setTab] = useState<TabId>("overview");
  const c = useCommodities();
  const { stats: portfolioStats, openTrade } = usePaperPortfolio();
  const [tradeFor, setTradeFor] = useState<{ symbol: string; price: number } | null>(null);

  const brentChart = useMemo(() => (c.brent ? chartData(c.brent.points) : []), [c.brent]);
  const wtiChart   = useMemo(() => (c.wti   ? chartData(c.wti.points)   : []), [c.wti]);
  const goldChart  = useMemo(() => chartData(c.goldHistory, 200), [c.goldHistory]);

  // Merge WTI + Brent on date for the comparison chart
  const oilCompare = useMemo(() => {
    if (!c.brent || !c.wti) return [];
    const wtiMap = new Map(c.wti.points.map((p) => [p.date, p.value]));
    return downsample(c.brent.points, 240).map((p) => ({
      date: p.date, brent: p.value, wti: wtiMap.get(p.date) ?? null,
    }));
  }, [c.brent, c.wti]);

  const liveCount = (c.gold ? 1 : 0) + c.proxies.size;

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="font-heading text-xl font-bold flex items-center gap-2">
              🛢️ Commodities
              <span className="text-[11px] font-normal text-muted-foreground font-sans">
                Oil · Gold · Global benchmarks
              </span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gold via Twelve Data · $/barrel via Alpha Vantage/EIA · Equities via Finnhub
              {c.lastUpdated && <span> · Updated {c.lastUpdated.toLocaleTimeString()}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={c.refresh} disabled={c.refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/70 border border-border text-xs font-medium transition-colors disabled:opacity-50">
              <RefreshCw className={cn("w-3 h-3", c.refreshing && "animate-spin")} />
              Refresh
            </button>
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border",
              liveCount > 0 ? "bg-primary/15 border-primary/30" : "bg-muted border-border")}>
              <motion.div className={cn("w-1.5 h-1.5 rounded-full", liveCount > 0 ? "bg-primary" : "bg-muted-foreground")}
                animate={liveCount > 0 ? { opacity: [1, 0.3, 1] } : {}} transition={{ duration: 1.5, repeat: Infinity }} />
              <span className={cn("text-xs font-medium", liveCount > 0 ? "text-primary" : "text-muted-foreground")}>
                {liveCount > 0 ? `${liveCount} LIVE` : "OFFLINE"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hero strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Brent" tone={undefined}
          value={c.brentStats ? `$${c.brentStats.latest.toFixed(2)}` : c.loading ? "…" : "—"}
          sub={c.brent ? `per barrel · ${c.brent.points.at(-1)?.date ?? ""}` : "per barrel"} />
        <Stat label="WTI"
          value={c.wtiStats ? `$${c.wtiStats.latest.toFixed(2)}` : c.loading ? "…" : "—"}
          sub={c.wti ? `per barrel · ${c.wti.points.at(-1)?.date ?? ""}` : "per barrel"} />
        <Stat label="Brent–WTI spread"
          value={c.brentWtiSpread != null ? `$${c.brentWtiSpread.toFixed(2)}` : "—"}
          tone={c.brentWtiSpread != null && c.brentWtiSpread >= 0 ? "gain" : "loss"}
          sub="quality + freight" />
        <Stat label="Gold spot"
          value={c.gold ? `$${c.gold.price.toFixed(2)}` : c.loading ? "…" : "—"}
          tone={c.gold ? (c.gold.changePct >= 0 ? "gain" : "loss") : undefined}
          sub={c.gold ? `${formatPct(c.gold.changePct)} · per oz` : "per troy ounce"} />
        <Stat label="Gold ÷ Brent"
          value={c.goldOilRatio != null ? c.goldOilRatio.toFixed(1) : "—"}
          sub="barrels per ounce" />
      </div>

      {/* Degradation notices */}
      {c.errors.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-yellow-400">Some series are unavailable right now</p>
            <ul className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
              {c.errors.map((e) => <li key={e}>· {e}</li>)}
            </ul>
            <p className="text-[11px] text-muted-foreground mt-1">
              Alpha Vantage allows 25 requests/day on the free tier. Series are cached for 12 hours;
              set <code className="mono">NEXT_PUBLIC_ALPHAVANTAGE_API_KEY</code> for a dedicated quota.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
              <Icon className="w-3.5 h-3.5" />{t.label}
            </button>
          );
        })}
      </div>

      {c.loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading commodity data…</span>
        </div>
      )}

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      {!c.loading && tab === "overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {oilCompare.length > 0 && (
            <Panel title="Crude oil — real price per barrel" subtitle={`${c.brent?.interval} · since ${c.brent?.points[0]?.date.slice(0, 4)}`} icon={Fuel}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={oilCompare}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" tick={AXIS} minTickGap={50} tickFormatter={(d: string) => d.slice(0, 4)} />
                  <YAxis tick={AXIS} width={45} tickFormatter={(v: number) => `$${v}`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={moneyFmtNamed("/bbl")} />
                  <Line type="monotone" dataKey="brent" stroke={BRENT_HEX} dot={false} strokeWidth={1.5} name="brent" />
                  <Line type="monotone" dataKey="wti"   stroke={OIL_HEX}   dot={false} strokeWidth={1.5} name="wti" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="w-2.5 h-0.5 rounded" style={{ background: BRENT_HEX }} />Brent (global)
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="w-2.5 h-0.5 rounded" style={{ background: OIL_HEX }} />WTI (US)
                </span>
              </div>
            </Panel>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Panel title="What moves oil" icon={Fuel}><DriverList drivers={OIL_DRIVERS} /></Panel>
            <Panel title="What moves gold" icon={Gem}><DriverList drivers={GOLD_DRIVERS} /></Panel>
          </div>

          <Panel title="Historic price shocks" subtitle="the moves that reset the market" icon={AlertTriangle}>
            <div className="space-y-2">
              {PRICE_SHOCKS.map((s) => (
                <div key={s.year} className="flex items-start gap-3">
                  <span className="mono text-xs text-primary w-10 shrink-0">{s.year}</span>
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5",
                    s.asset === "OIL" ? "bg-blue-500/20 text-blue-400"
                    : s.asset === "GOLD" ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-purple-500/20 text-purple-400")}>{s.asset}</span>
                  <div>
                    <p className="text-xs font-medium">{s.event}</p>
                    <p className="text-[11px] text-muted-foreground">{s.move}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </motion.div>
      )}

      {/* ── OIL ──────────────────────────────────────────────────────────── */}
      {!c.loading && tab === "oil" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {c.brentStats && (
            <Panel title="Brent crude — statistics" subtitle={c.brent?.unit} icon={Fuel}>
              <StatsGrid stats={c.brentStats} unit="per barrel" />
            </Panel>
          )}

          {brentChart.length > 0 && (
            <Panel title="Brent — full price history" subtitle={`${c.brent?.points.length} observations · ${c.brent?.source}`}>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={brentChart}>
                  <defs>
                    <linearGradient id="brentFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BRENT_HEX} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={BRENT_HEX} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" tick={AXIS} minTickGap={50} tickFormatter={(d: string) => d.slice(0, 4)} />
                  <YAxis tick={AXIS} width={45} tickFormatter={(v: number) => `$${v}`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={moneyFmt("/bbl", "Brent")} />
                  <Area type="monotone" dataKey="value" stroke={BRENT_HEX} fill="url(#brentFill)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>
          )}

          {c.wtiStats && (
            <Panel title="WTI crude — statistics" subtitle={c.wti?.unit} icon={Fuel}>
              <StatsGrid stats={c.wtiStats} unit="per barrel" />
            </Panel>
          )}

          {wtiChart.length > 0 && (
            <Panel title="WTI — full price history" subtitle={`${c.wti?.points.length} observations`}>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={wtiChart}>
                  <defs>
                    <linearGradient id="wtiFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={OIL_HEX} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={OIL_HEX} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" tick={AXIS} minTickGap={50} tickFormatter={(d: string) => d.slice(0, 4)} />
                  <YAxis tick={AXIS} width={45} tickFormatter={(v: number) => `$${v}`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={moneyFmt("/bbl", "WTI")} />
                  <Area type="monotone" dataKey="value" stroke={OIL_HEX} fill="url(#wtiFill)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Panel title="Brent vs WTI" subtitle="relationship">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Stat label="Spread" value={c.brentWtiSpread != null ? `$${c.brentWtiSpread.toFixed(2)}` : "—"}
                    tone={c.brentWtiSpread != null && c.brentWtiSpread >= 0 ? "gain" : "loss"} sub="Brent − WTI" />
                  <Stat label="Correlation" value={c.wtiBrentCorrelation != null ? c.wtiBrentCorrelation.toFixed(3) : "—"} sub="full history" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Brent usually trades above WTI. WTI is delivered inland at Cushing, Oklahoma, so it
                  carries the cost of moving barrels to the coast; Brent is waterborne and prices the
                  seaborne market directly. A widening spread typically signals US pipeline
                  bottlenecks or a rising global risk premium.
                </p>
              </div>
            </Panel>
            <Panel title="What moves oil" icon={Fuel}><DriverList drivers={OIL_DRIVERS} /></Panel>
          </div>

          <Panel title="Global crude benchmarks" subtitle="how the world prices oil" icon={Globe2}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] text-muted-foreground uppercase tracking-wide border-b border-border">
                    <th className="text-left font-medium py-2">Benchmark</th>
                    <th className="text-left font-medium">Region</th>
                    <th className="text-left font-medium">Grade</th>
                    <th className="text-left font-medium">Priced on</th>
                    <th className="text-left font-medium">Role</th>
                    <th className="text-right font-medium">In AlphaOS</th>
                  </tr>
                </thead>
                <tbody>
                  {OIL_BENCHMARKS.map((b) => (
                    <tr key={b.code} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 font-medium mono">{b.code}<div className="text-[10px] text-muted-foreground font-sans font-normal">{b.name}</div></td>
                      <td className="text-muted-foreground">{b.region}</td>
                      <td className="text-muted-foreground">{b.grade}</td>
                      <td className="text-muted-foreground">{b.priced}</td>
                      <td className="text-muted-foreground max-w-[220px]">{b.role}</td>
                      <td className="text-right">
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded",
                          b.tracked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                          {b.tracked ? "TRACKED" : "NO FREE FEED"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </motion.div>
      )}

      {/* ── GOLD ─────────────────────────────────────────────────────────── */}
      {!c.loading && tab === "gold" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {c.gold && (
            <Panel title="Gold spot (XAU/USD)" subtitle={`${c.gold.source} · ${c.gold.asOf}`} icon={Gem}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Stat label="Spot" value={`$${c.gold.price.toFixed(2)}`}
                  tone={c.gold.changePct >= 0 ? "gain" : "loss"} sub="per troy ounce" />
                <Stat label="Day change" value={formatPct(c.gold.changePct)}
                  tone={c.gold.changePct >= 0 ? "gain" : "loss"} sub={`$${c.gold.change.toFixed(2)}`} />
                <Stat label="Day range"
                  value={c.gold.low && c.gold.high ? `${c.gold.low.toFixed(0)}–${c.gold.high.toFixed(0)}` : "—"} sub="low – high" />
                <Stat label="52-week range"
                  value={c.gold.week52Low && c.gold.week52High ? `${c.gold.week52Low.toFixed(0)}–${c.gold.week52High.toFixed(0)}` : "—"}
                  sub="low – high" />
              </div>
            </Panel>
          )}

          {goldChart.length > 0 && (
            <Panel title="Gold — daily price history" subtitle={`${c.goldHistory.length} sessions`}>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={goldChart}>
                  <defs>
                    <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GOLD_HEX} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={GOLD_HEX} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" tick={AXIS} minTickGap={40} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={AXIS} width={50} domain={["auto", "auto"]} tickFormatter={(v: number) => `$${v}`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={moneyFmt("/oz", "Gold")} />
                  <Area type="monotone" dataKey="value" stroke={GOLD_HEX} fill="url(#goldFill)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>
          )}

          {c.goldStats && (
            <Panel title="Gold — statistics" subtitle="over the loaded window">
              <StatsGrid stats={c.goldStats} unit="per troy ounce" />
            </Panel>
          )}

          {c.goldIndicators && (
            <Panel title="Gold — technical read" subtitle="same engine as Morning Brain" icon={TrendingUp}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Stat label="Trend" value={c.goldIndicators.trend}
                  tone={c.goldIndicators.trend === "BULLISH" ? "gain" : c.goldIndicators.trend === "BEARISH" ? "loss" : undefined} />
                <Stat label="RSI (14)" value={c.goldIndicators.rsi?.toFixed(1) ?? "—"}
                  tone={c.goldIndicators.rsi != null ? (c.goldIndicators.rsi > 70 ? "loss" : c.goldIndicators.rsi < 30 ? "gain" : undefined) : undefined}
                  sub={c.goldIndicators.rsi != null ? (c.goldIndicators.rsi > 70 ? "overbought" : c.goldIndicators.rsi < 30 ? "oversold" : "neutral") : undefined} />
                <Stat label="MACD hist" value={c.goldIndicators.macdHist?.toFixed(2) ?? "—"}
                  tone={c.goldIndicators.macdHist != null && c.goldIndicators.macdHist >= 0 ? "gain" : "loss"} />
                <Stat label="ATR (14)" value={c.goldIndicators.atr?.toFixed(2) ?? "—"} sub="daily range" />
                <Stat label="EMA 9"   value={c.goldIndicators.ema9?.toFixed(2) ?? "—"} />
                <Stat label="EMA 21"  value={c.goldIndicators.ema21?.toFixed(2) ?? "—"} />
                <Stat label="EMA 50"  value={c.goldIndicators.ema50?.toFixed(2) ?? "—"}
                  sub={c.goldIndicators.aboveEma50 ? "price above" : "price below"} />
                <Stat label="EMA 200" value={c.goldIndicators.ema200?.toFixed(2) ?? "—"}
                  sub={c.goldIndicators.aboveEma200 ? "price above" : "price below"} />
              </div>
            </Panel>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Panel title="What moves gold" icon={Gem}><DriverList drivers={GOLD_DRIVERS} /></Panel>
            <Panel title="Where gold demand comes from" subtitle="approx. share, 2024">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={GOLD_DEMAND} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" tick={AXIS} tickFormatter={(v: number) => `${v}%`} />
                  <YAxis type="category" dataKey="label" tick={AXIS} width={90} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={pctFmt("share")} />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                    {GOLD_DEMAND.map((_, i) => <Cell key={i} fill={GOLD_HEX} fillOpacity={1 - i * 0.15} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {GOLD_DEMAND.map((d) => (
                  <p key={d.label} className="text-[11px] text-muted-foreground">
                    <span className="text-foreground font-medium">{d.label}</span> — {d.note}
                  </p>
                ))}
              </div>
            </Panel>
          </div>
        </motion.div>
      )}

      {/* ── EQUITIES ─────────────────────────────────────────────────────── */}
      {!c.loading && tab === "equities" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {(["OIL_PROXY", "GOLD_PROXY", "OIL_MAJOR", "SERVICES", "GOLD_MINER"] as const).map((group) => {
            const metas = COMMODITY_PROXIES.filter((m) => m.group === group);
            if (!metas.length) return null;
            const TITLE = {
              OIL_PROXY: "Oil trackers & sector ETFs",
              GOLD_PROXY: "Gold trackers",
              OIL_MAJOR: "Integrated majors & E&P",
              SERVICES: "Oilfield services",
              GOLD_MINER: "Gold miners",
            }[group];
            return (
              <Panel key={group} title={TITLE} subtitle="live · Finnhub">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] text-muted-foreground uppercase tracking-wide border-b border-border">
                        <th className="text-left font-medium py-2">Symbol</th>
                        <th className="text-left font-medium">Name</th>
                        <th className="text-right font-medium">Price</th>
                        <th className="text-right font-medium">Day</th>
                        <th className="text-right font-medium">Range</th>
                        <th className="text-left font-medium pl-4">Note</th>
                        <th className="text-right font-medium">Trade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metas.map((m) => {
                        const q = c.proxies.get(m.symbol);
                        return (
                          <tr key={m.symbol} className="border-b border-border/50 hover:bg-muted/30 group">
                            <td className="py-2 font-medium mono">{m.symbol}</td>
                            <td className="text-muted-foreground">{m.name}</td>
                            <td className="text-right mono">{q ? `$${q.price.toFixed(2)}` : "—"}</td>
                            <td className={cn("text-right mono", q && (q.changePct >= 0 ? "gain" : "loss"))}>
                              {q ? formatPct(q.changePct) : "—"}
                            </td>
                            <td className="text-right mono text-muted-foreground text-[11px]">
                              {q?.low && q?.high ? `${q.low.toFixed(1)}–${q.high.toFixed(1)}` : "—"}
                            </td>
                            <td className="text-muted-foreground pl-4 max-w-[220px]">{m.note}</td>
                            <td className="text-right">
                              {q && (
                                <button onClick={() => setTradeFor({ symbol: m.symbol, price: q.price })}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded bg-primary/15 text-primary border border-primary/30 text-[10px] font-semibold hover:bg-primary/25">
                                  Trade
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Panel>
            );
          })}
          <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            These are US-listed instruments whose prices are driven by oil and gold. Free data tiers
            do not carry crude or bullion futures directly, so ETFs such as USO, BNO and GLD stand in
            for live intraday exposure while the $/barrel series above carries the real benchmark price.
          </p>
        </motion.div>
      )}

      {/* ── WORLD DATA ───────────────────────────────────────────────────── */}
      {!c.loading && tab === "world" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-3 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              Reference figures below are curated static data for orientation, not a live feed — no
              free API publishes production, reserves or official gold holdings. Treat them as
              approximate round numbers with the vintage shown, not settlement values.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Panel title="Top oil producers" subtitle="million barrels/day · 2024–25" icon={Fuel}>
              <CountryBars data={TOP_OIL_PRODUCERS} unit="mb/d" color={OIL_HEX} />
            </Panel>
            <Panel title="Proven oil reserves" subtitle="billion barrels · 2024" icon={Fuel}>
              <CountryBars data={OIL_RESERVES} unit="bn bbl" color={BRENT_HEX} />
            </Panel>
            <Panel title="Largest crude importers" subtitle="million barrels/day · 2024" icon={Globe2}>
              <CountryBars data={TOP_OIL_IMPORTERS} unit="mb/d" color="#a855f7" />
            </Panel>
            <Panel title="Top gold producers" subtitle="tonnes/year · 2024" icon={Gem}>
              <CountryBars data={TOP_GOLD_PRODUCERS} unit="t" color={GOLD_HEX} />
            </Panel>
          </div>

          <Panel title="Central bank gold reserves" subtitle="tonnes · 2024–25" icon={Gem}>
            <CountryBars data={CENTRAL_BANK_GOLD} unit="t" color={GOLD_HEX} />
          </Panel>

          <Panel title="OPEC+" subtitle="why quota headlines move Brent" icon={Globe2}>
            <p className="text-xs text-muted-foreground">{OPEC_PLUS_NOTE}</p>
          </Panel>
        </motion.div>
      )}

      {/* Copy-trade modal */}
      <TradeModal
        open={tradeFor !== null}
        onClose={() => setTradeFor(null)}
        onTrade={openTrade}
        cashBalance={portfolioStats.cashBalance}
        prefillSymbol={tradeFor?.symbol}
        prefillMarket="US"
        prefillPrice={tradeFor?.price}
        prefillSide="LONG"
      />
    </div>
  );
}
