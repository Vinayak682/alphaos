"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Line, ComposedChart,
} from "recharts";
import { Play, Loader2, AlertTriangle, Info, Layers, Briefcase } from "lucide-react";
import { cn, formatPct } from "@/lib/utils";
import { useBacktest } from "@/hooks/useBacktest";
import { RULE_SPECS, DEFAULT_CONFIG } from "@/lib/backtest";

// Deliberately mixed: mega-cap tech, an index, a bank, energy, a defensive, and
// crypto. A universe of only 2019-2026 US tech would flatter buy & hold and
// tell you nothing about the rules.
const SYMBOLS = [
  "AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMZN", "TSLA",
  "SPY", "QQQ", "JPM", "XOM", "KO",
  "BTCUSDT", "ETHUSDT", "SOLUSDT",
];

const AXIS = { fill: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "var(--font-mono)" };
const TOOLTIP = {
  background: "#0d1117", border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8, fontSize: 11, fontFamily: "var(--font-mono)",
};

type RcValue = string | number | readonly (string | number)[] | undefined;
const money = (v: RcValue, n: RcValue): [string, string] => {
  const x = typeof v === "number" ? v : Number(v);
  return [Number.isFinite(x) ? `$${x.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—",
          String(n) === "bench" ? "Buy & hold" : "Strategy"];
};

function Metric({ label, value, tone, sub }: {
  label: string; value: string; tone?: "gain" | "loss"; sub?: string;
}) {
  return (
    <div className="bg-muted/30 rounded-lg px-3 py-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn("mono font-bold text-sm mt-0.5", tone === "gain" && "gain", tone === "loss" && "loss")}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

const PERIODS = [
  { id: "recent", label: "2019–2026 (bull run)",  window: undefined as { from?: string; to?: string } | undefined },
  { id: "gfc",    label: "2006–2010 (GFC)",       window: { from: "2006-01-01", to: "2010-12-31" } },
  { id: "all",    label: "Longest available",     window: { from: "2006-01-01" } },
];

export default function BacktestPanel() {
  const [specId, setSpecId] = useState(RULE_SPECS[0].id);
  const [symbol, setSymbol] = useState("AAPL");
  const [periodId, setPeriodId] = useState("recent");
  const period = PERIODS.find((p) => p.id === periodId)!;
  const { result, sweep, sweepSkipped, sweepProgress, portfolio, running, error, run, runSweep, runPortfolio } = useBacktest();
  const spec = RULE_SPECS.find((s) => s.id === specId)!;

  // Normalise buy & hold onto the same starting equity so the two lines compare.
  const chartData = result
    ? (() => {
        const c0 = result.equity[0]?.value ?? DEFAULT_CONFIG.startEquity;
        const firstClose = result.equity.length ? null : null;
        void firstClose;
        return result.equity.map((p, i) => {
          const frac = i / Math.max(1, result.equity.length - 1);
          const bench = c0 * (1 + (result.metrics.buyHoldReturnPct / 100) * frac);
          return { date: p.date, equity: p.value, bench };
        });
      })()
    : [];

  const m = result?.metrics;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Play className="w-3.5 h-3.5 text-primary" />
        <h2 className="text-sm font-semibold font-heading">Backtest Engine</h2>
        <span className="text-[10px] text-muted-foreground">
          real OHLCV · costs included · runs in your browser
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Strategy</label>
            <select value={specId} onChange={(e) => setSpecId(e.target.value)}
              className="bg-muted border border-border rounded-lg px-3 py-1.5 text-xs min-w-[200px]">
              {RULE_SPECS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Symbol</label>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)}
              className="bg-muted border border-border rounded-lg px-3 py-1.5 text-xs">
              {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Period</label>
            <select value={periodId} onChange={(e) => setPeriodId(e.target.value)}
              className="bg-muted border border-border rounded-lg px-3 py-1.5 text-xs">
              {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <button onClick={() => run(specId, symbol, period.window)} disabled={running}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-black text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            {running ? "Running…" : "Run Backtest"}
          </button>
          <button onClick={() => runSweep(specId, SYMBOLS, period.window)} disabled={running}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-muted border border-border text-xs font-semibold hover:bg-muted/70 disabled:opacity-50 transition-colors">
            <Layers className="w-3 h-3" />
            {running && sweepProgress ? `${sweepProgress.done}/${sweepProgress.total}…` : `Sweep all ${SYMBOLS.length}`}
          </button>
          <button onClick={() => runPortfolio(specId, SYMBOLS, period.window)} disabled={running}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold hover:bg-blue-500/25 disabled:opacity-50 transition-colors">
            <Briefcase className="w-3 h-3" />
            Portfolio mode
          </button>
        </div>

        {period.id !== "recent" && (
          <p className="text-[10px] text-yellow-400/90 -mt-1">
            Crypto did not exist before 2017 — BTCUSDT/ETHUSDT/SOLUSDT will be skipped
            and listed as such rather than silently dropped.
          </p>
        )}
        <p className="text-[10px] text-muted-foreground -mt-1">
          A cold sweep is paced at ~8s per uncached equity symbol to stay inside
          Twelve Data&apos;s 8 requests/minute limit — roughly 90s the first time,
          then instant for 12h from cache.
        </p>

        {/* What this spec does and does not model */}
        <div className="bg-blue-500/10 border border-blue-500/25 rounded-lg p-3">
          <p className="text-xs">{spec.summary}</p>
          <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">
            Approximation — the published rules also require, and this does NOT model:
          </p>
          <ul className="text-[10px] text-muted-foreground mt-0.5 space-y-0.5">
            {spec.notModelled.map((x) => <li key={x}>· {x}</li>)}
          </ul>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/25 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {portfolio && (() => {
          const pm = portfolio.metrics;
          const benchMap = new Map(portfolio.benchmark.map((b) => [b.date, b.value]));
          const data = portfolio.equity.map((e) => ({ date: e.date, equity: e.value, bench: benchMap.get(e.date) ?? null }));
          const ddSaved = pm.benchmarkMaxDdPct - pm.maxDrawdownPct;
          return (
            <div className="space-y-3">
              <div className="bg-blue-500/10 border border-blue-500/25 rounded-lg px-3 py-2">
                <p className="text-xs font-medium text-blue-400">
                  Equal-weight basket of {portfolio.symbols.length}, each sleeve gated by its own signal
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {portfolio.from} → {portfolio.to} · benchmark is equal-weight buy &amp; hold of the
                  identical basket over the identical window · {pm.rebalances} rebalances, costs applied to each
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Metric label="Portfolio return" value={formatPct(pm.totalReturnPct)}
                  tone={pm.totalReturnPct >= 0 ? "gain" : "loss"}
                  sub={`CAGR ${pm.cagrPct != null ? formatPct(pm.cagrPct) : "—"} over ${pm.years.toFixed(1)}y`} />
                <Metric label="Basket buy & hold" value={formatPct(pm.benchmarkReturnPct)}
                  tone={pm.benchmarkReturnPct >= 0 ? "gain" : "loss"}
                  sub={pm.totalReturnPct >= pm.benchmarkReturnPct ? "portfolio ahead" : "portfolio behind"} />
                <Metric label="Max drawdown" value={`−${pm.maxDrawdownPct.toFixed(1)}%`}
                  tone={pm.maxDrawdownPct < pm.benchmarkMaxDdPct ? "gain" : "loss"}
                  sub={`basket −${pm.benchmarkMaxDdPct.toFixed(1)}% · ${ddSaved >= 0 ? "saved" : "worse by"} ${Math.abs(ddSaved).toFixed(1)}pp`} />
                <Metric label="Sharpe" value={pm.sharpe != null ? pm.sharpe.toFixed(2) : "—"}
                  sub={`avg exposure ${pm.avgExposurePct.toFixed(0)}%`} />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={data}>
                  <defs>
                    <linearGradient id="pfFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4FA3FF" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#4FA3FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" tick={AXIS} minTickGap={60} tickFormatter={(d: string) => d.slice(0, 7)} />
                  <YAxis tick={AXIS} width={55} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TOOLTIP} formatter={money} />
                  <Area type="monotone" dataKey="equity" stroke="#4FA3FF" fill="url(#pfFill)" strokeWidth={1.5} name="equity" />
                  <Line type="monotone" dataKey="bench" stroke="rgba(255,255,255,0.35)" dot={false} strokeWidth={1} strokeDasharray="4 3" name="bench" />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="w-2.5 h-0.5 rounded" style={{ background: "#4FA3FF" }} />Trend-gated portfolio
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="w-2.5 h-0.5 rounded bg-white/35" />Equal-weight buy &amp; hold
                </span>
              </div>
              <div className="overflow-x-auto max-h-56 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="text-[10px] text-muted-foreground uppercase tracking-wide border-b border-border">
                      <th className="text-left font-medium py-1.5">Sleeve</th>
                      <th className="text-right font-medium">Net P&amp;L (share)</th>
                      <th className="text-right font-medium">Time invested</th>
                      <th className="text-right font-medium">Rebalances</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...portfolio.sleeves].sort((a, b) => b.contributionPct - a.contributionPct).map((s) => (
                      <tr key={s.symbol} className="border-b border-border/40 hover:bg-muted/30">
                        <td className="py-1.5 mono font-medium">{s.symbol}</td>
                        <td className={cn("text-right mono", s.pnl >= 0 ? "gain" : "loss")}>
                          {s.pnl >= 0 ? "+" : "−"}${Math.abs(s.pnl).toFixed(0)}
                          <span className="text-muted-foreground ml-1">({s.contributionPct >= 0 ? "+" : ""}{s.contributionPct.toFixed(0)}%)</span>
                        </td>
                        <td className="text-right mono text-muted-foreground">{s.exposurePct.toFixed(0)}%</td>
                        <td className="text-right mono text-muted-foreground">{s.rebalances}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {sweep && sweep.length > 0 && (() => {
          const real = sweep.filter((r) => !r.degenerate);
          const beats = real.filter((r) => r.beat);
          const genuine = beats.filter((r) => r.buyHoldPct > 0);
          const med = (a: number[]) => {
            const s = [...a].sort((x, y) => x - y);
            return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0;
          };
          return (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Metric label="Beat buy & hold" value={`${beats.length}/${real.length}`}
                  tone={beats.length > real.length / 2 ? "gain" : "loss"}
                  sub={sweepSkipped.length
                    ? `of ${SYMBOLS.length} attempted · ${sweepSkipped.length} skipped`
                    : `all ${SYMBOLS.length} symbols tested`} />
                <Metric label="In a rising market" value={String(genuine.length)}
                  sub="the only meaningful wins" />
                <Metric label="Median return" value={formatPct(med(real.map((r) => r.returnPct)))}
                  tone={med(real.map((r) => r.returnPct)) >= 0 ? "gain" : "loss"} sub="strategy" />
                <Metric label="Median buy & hold" value={formatPct(med(real.map((r) => r.buyHoldPct)))}
                  sub="same windows" />
              </div>
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="text-[10px] text-muted-foreground uppercase tracking-wide border-b border-border">
                      <th className="text-left font-medium py-1.5">Symbol</th>
                      <th className="text-right font-medium">Strategy</th>
                      <th className="text-right font-medium">Buy &amp; hold</th>
                      <th className="text-right font-medium">Trades</th>
                      <th className="text-right font-medium">Win%</th>
                      <th className="text-right font-medium">Max DD</th>
                      <th className="text-left font-medium pl-3">Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...sweep].sort((a, b) => b.returnPct - a.returnPct).map((r) => (
                      <tr key={r.symbol} className="border-b border-border/40 hover:bg-muted/30">
                        <td className="py-1.5 mono font-medium">{r.symbol}</td>
                        <td className={cn("text-right mono", r.returnPct >= 0 ? "gain" : "loss")}>{formatPct(r.returnPct)}</td>
                        <td className={cn("text-right mono", r.buyHoldPct >= 0 ? "gain" : "loss")}>{formatPct(r.buyHoldPct)}</td>
                        <td className="text-right mono text-muted-foreground">{r.trades}</td>
                        <td className="text-right mono text-muted-foreground">{r.winRate.toFixed(0)}</td>
                        <td className="text-right mono loss">−{r.maxDdPct.toFixed(0)}%</td>
                        <td className="pl-3 text-[11px]">
                          {r.degenerate
                            ? <span className="text-muted-foreground">never traded</span>
                            : r.beat
                              ? (r.buyHoldPct > 0
                                  ? <span className="gain font-medium">beat</span>
                                  : <span className="text-yellow-400">avoided a decline</span>)
                              : <span className="text-muted-foreground">behind</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sweepSkipped.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-lg p-2.5">
                  <p className="text-[11px] text-yellow-400 font-medium">
                    {sweepSkipped.length} symbol{sweepSkipped.length === 1 ? "" : "s"} not tested —
                    the aggregate above covers {real.length}, not all {SYMBOLS.length}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {sweepSkipped.map((s) => `${s.symbol} (${s.reason})`).join(" · ")}
                  </p>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                Two verdicts are not edges. &quot;Never traded&quot; means the rules never fired and cash
                simply outperformed a falling asset. &quot;Avoided a decline&quot; means buy &amp; hold was
                negative, so staying out won by default. Only wins in a rising market suggest the
                rules add anything.
              </p>
            </div>
          );
        })()}

        <AnimatePresence>
          {result && m && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Headline */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Metric label="Total return" value={formatPct(m.totalReturnPct)}
                  tone={m.totalReturnPct >= 0 ? "gain" : "loss"}
                  sub={`$${m.startEquity.toLocaleString()} → $${Math.round(m.endEquity).toLocaleString()}`} />
                <Metric label="Buy & hold" value={formatPct(m.buyHoldReturnPct)}
                  tone={m.buyHoldReturnPct >= 0 ? "gain" : "loss"}
                  sub={m.totalReturnPct >= m.buyHoldReturnPct ? "strategy ahead" : "strategy behind"} />
                <Metric label="CAGR" value={m.cagrPct != null ? formatPct(m.cagrPct) : "—"}
                  tone={m.cagrPct != null && m.cagrPct >= 0 ? "gain" : "loss"}
                  sub={`over ${m.years.toFixed(1)}y`} />
                <Metric label="Max drawdown" value={`−${m.maxDrawdownPct.toFixed(1)}%`}
                  tone={m.maxDrawdownPct < m.buyHoldMaxDdPct ? "gain" : "loss"}
                  sub={`buy & hold −${m.buyHoldMaxDdPct.toFixed(1)}%`} />
                <Metric label="Win rate" value={`${m.winRate.toFixed(1)}%`}
                  sub={`${m.tradeCount} trades`} />
                <Metric label="Profit factor" value={m.profitFactor != null ? m.profitFactor.toFixed(2) : "—"}
                  tone={m.profitFactor != null && m.profitFactor >= 1 ? "gain" : "loss"}
                  sub="gross win ÷ gross loss" />
                <Metric label="Sharpe" value={m.sharpe != null ? m.sharpe.toFixed(2) : "—"}
                  sub="annualised, rf=0" />
                <Metric label="Exposure" value={`${m.exposurePct.toFixed(0)}%`}
                  sub={`avg ${m.avgBarsHeld.toFixed(0)} bars held`} />
              </div>

              {/* Equity curve vs benchmark */}
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">
                  {result.symbol} · {result.from} → {result.to} · marked to market daily
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient id="btFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00FF88" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#00FF88" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" tick={AXIS} minTickGap={60} tickFormatter={(d: string) => d.slice(0, 7)} />
                    <YAxis tick={AXIS} width={55} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={TOOLTIP} formatter={money} />
                    <Area type="monotone" dataKey="equity" stroke="#00FF88" fill="url(#btFill)" strokeWidth={1.5} name="equity" />
                    <Line type="monotone" dataKey="bench" stroke="rgba(255,255,255,0.35)" dot={false} strokeWidth={1} strokeDasharray="4 3" name="bench" />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="w-2.5 h-0.5 rounded bg-primary" />Strategy
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="w-2.5 h-0.5 rounded bg-white/35" />Buy &amp; hold (straight-line reference)
                  </span>
                </div>
              </div>

              {/* Trade log */}
              {result.trades.length > 0 && (
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-card">
                      <tr className="text-[10px] text-muted-foreground uppercase tracking-wide border-b border-border">
                        <th className="text-left font-medium py-1.5">Entry</th>
                        <th className="text-right font-medium">Price</th>
                        <th className="text-left font-medium pl-3">Exit</th>
                        <th className="text-right font-medium">Price</th>
                        <th className="text-right font-medium">Bars</th>
                        <th className="text-right font-medium">P&amp;L</th>
                        <th className="text-left font-medium pl-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.trades.map((t, i) => (
                        <tr key={i} className="border-b border-border/40 hover:bg-muted/30">
                          <td className="py-1.5 mono text-[11px]">{t.entryDate}</td>
                          <td className="text-right mono text-[11px]">{t.entryPrice.toFixed(2)}</td>
                          <td className="mono text-[11px] pl-3">{t.exitDate}</td>
                          <td className="text-right mono text-[11px]">{t.exitPrice.toFixed(2)}</td>
                          <td className="text-right mono text-[11px] text-muted-foreground">{t.bars}</td>
                          <td className={cn("text-right mono text-[11px] font-medium", t.pnl >= 0 ? "gain" : "loss")}>
                            {formatPct(t.pnlPct)}
                          </td>
                          <td className="pl-3 text-[11px] text-muted-foreground">{t.exitReason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                Costs applied both sides: {(DEFAULT_CONFIG.commission * 1e4).toFixed(0)}bps commission +
                {" "}{(DEFAULT_CONFIG.slippage * 1e4).toFixed(0)}bps slippage. Long-only, full equity per trade,
                no compounding across concurrent positions. Past behaviour of a simplified rule set on one
                symbol — not a prediction, and not the published strategy in full.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
