"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ShieldAlert, TrendingDown, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip,
} from "recharts";

const RISK_INDEX = 38;

const RADAR_DATA = [
  { dimension: "VIX Level",     value: 52, fullMark: 100 },
  { dimension: "Correlation",   value: 61, fullMark: 100 },
  { dimension: "Sector Weight", value: 42, fullMark: 100 },
  { dimension: "Leverage",      value: 0,  fullMark: 100 },
  { dimension: "Geo Risk",      value: 31, fullMark: 100 },
  { dimension: "Sentiment",     value: 28, fullMark: 100 },
];

const RISK_TABLE = [
  { rank: 1,  ticker: "RELIANCE", market: "INDIA", exchange: "NSE", score: 62, reason: "RSI 74 overbought + promoter sell flag",           action: "EXIT",  currency: "₹" },
  { rank: 2,  ticker: "TSLA",     market: "US",    exchange: "NASDAQ", score: 58, reason: "Below EMA50 + China market share loss",          action: "SELL",  currency: "$" },
  { rank: 3,  ticker: "AAPL",     market: "US",    exchange: "NASDAQ", score: 38, reason: "WWDC uncertainty, tight range",                  action: "HOLD",  currency: "$" },
  { rank: 4,  ticker: "HDFCBANK", market: "INDIA", exchange: "NSE", score: 41, reason: "Rate sensitivity, FII flow dependent",              action: "WATCH", currency: "₹" },
  { rank: 5,  ticker: "FAB",      market: "UAE",   exchange: "ADX", score: 34, reason: "Oil price correlated, moderate geo exposure",       action: "WATCH", currency: "د.إ" },
  { rank: 6,  ticker: "EMAAR",    market: "UAE",   exchange: "DFM", score: 31, reason: "Real estate cycle risk, geo premium",               action: "WATCH", currency: "د.إ" },
  { rank: 7,  ticker: "ADNOCGAS", market: "UAE",   exchange: "ADX", score: 27, reason: "Commodity price risk, sovereign backing",           action: "OK",    currency: "د.إ" },
  { rank: 8,  ticker: "NVDA",     market: "US",    exchange: "NASDAQ", score: 28, reason: "High valuation multiple, AI demand solid",       action: "OK",    currency: "$" },
  { rank: 9,  ticker: "MSFT",     market: "US",    exchange: "NASDAQ", score: 24, reason: "Defensive, diversified revenue, low correlation",action: "OK",    currency: "$" },
  { rank: 10, ticker: "TCS",      market: "INDIA", exchange: "NSE", score: 29, reason: "IT sector risk, strong fundamentals offset",         action: "OK",    currency: "₹" },
];

const MARKET_CLR: Record<string, string> = { US: "text-blue-400", UAE: "text-purple-400", INDIA: "text-green-400" };

function RiskMeter({ value }: { value: number }) {
  const angle = -135 + (value / 100) * 270;
  const color = value >= 70 ? "#FF3060" : value >= 40 ? "#F59E0B" : "#00FF88";
  const label = value >= 70 ? "HIGH" : value >= 40 ? "MODERATE" : "LOW";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={200} height={120} viewBox="0 0 200 120">
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#00FF88" />
            <stop offset="50%"  stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FF3060" />
          </linearGradient>
        </defs>
        {/* Background arc */}
        <path d="M 20 110 A 80 80 0 1 1 180 110" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
        {/* Colored arc */}
        <path d="M 20 110 A 80 80 0 1 1 180 110" fill="none" stroke="url(#arcGrad)" strokeWidth="12" strokeLinecap="round" strokeOpacity="0.9" />
        {/* Needle */}
        <motion.line
          x1="100" y1="110"
          x2={100 + 60 * Math.cos(((angle - 90) * Math.PI) / 180)}
          y2={110 + 60 * Math.sin(((angle - 90) * Math.PI) / 180)}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ rotate: -135, originX: "100px", originY: "110px" }}
          animate={{ rotate: angle, originX: "100px", originY: "110px" }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
        <circle cx="100" cy="110" r="5" fill={color} />
        <circle cx="100" cy="110" r="3" fill="var(--card)" />
        {/* Labels */}
        <text x="14" y="118" fontSize="8" fill="rgba(255,255,255,0.35)" fontFamily="monospace">0</text>
        <text x="178" y="118" fontSize="8" fill="rgba(255,255,255,0.35)" fontFamily="monospace">100</text>
        <text x="94" y="20" fontSize="8" fill="rgba(255,255,255,0.35)" fontFamily="monospace">50</text>
      </svg>
      <div className="text-center -mt-2">
        <motion.p
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="font-heading text-5xl font-bold mono"
          style={{ color }}
        >
          {value}
        </motion.p>
        <p className="text-sm font-semibold mt-1" style={{ color }}>{label} RISK</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Composite score 0–100</p>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { dimension: string; value: number } }[] }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs">
        <p className="font-medium">{d.dimension}</p>
        <p className="text-primary font-bold mono">{d.value}/100</p>
      </div>
    );
  }
  return null;
};

export default function RiskPage() {
  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="font-heading text-xl font-bold">Risk Index</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Portfolio composite risk · Updated 08:04 UAE · 6-dimension analysis</p>
      </motion.div>

      {/* Top section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Meter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center gap-4"
        >
          <div className="flex items-center gap-2 self-start w-full">
            <ShieldAlert className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold font-heading">Portfolio Risk Meter</h2>
          </div>
          <RiskMeter value={RISK_INDEX} />
          <div className="grid grid-cols-3 gap-3 w-full mt-2">
            {[
              { label: "Open Positions", value: "10", color: "text-foreground" },
              { label: "Max Drawdown", value: "−4.2%", color: "loss" },
              { label: "Sharpe Ratio", value: "1.84", color: "gain" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-2 bg-muted/40 rounded-lg">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className={cn("mono font-bold text-lg mt-0.5", color)}>{value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Radar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold font-heading">6-Dimension Risk Radar</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="rgba(255,255,255,0.07)" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              />
              <Radar
                name="Risk"
                dataKey="value"
                stroke="#00FF88"
                fill="#00FF88"
                fillOpacity={0.12}
                strokeWidth={1.5}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {RADAR_DATA.map((d) => (
              <div key={d.dimension} className="flex items-center gap-2">
                <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${d.value}%`,
                      background: d.value >= 60 ? "#FF3060" : d.value >= 40 ? "#F59E0B" : "#00FF88",
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{d.dimension}</span>
                <span className="text-[10px] mono font-medium ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Risk table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
          <h2 className="text-sm font-semibold font-heading">All Positions — Ranked by Risk</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {["#", "TICKER", "MARKET", "RISK SCORE", "REASON", "ACTION"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RISK_TABLE.map((row, i) => {
                const score = row.score;
                const scoreColor = score >= 60 ? "loss" : score >= 40 ? "text-yellow-400" : "gain";
                const actionColor = row.action === "EXIT" || row.action === "SELL" ? "text-destructive" : row.action === "HOLD" || row.action === "WATCH" ? "text-yellow-400" : "gain";
                const ActionIcon = row.action === "EXIT" ? TrendingDown : row.action === "SELL" ? TrendingDown : row.action === "OK" ? CheckCircle2 : AlertTriangle;
                return (
                  <motion.tr
                    key={row.rank}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    className="border-b border-border/40 hover:bg-accent/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground mono text-xs">{row.rank}</td>
                    <td className="px-4 py-3">
                      <span className="mono font-bold">{row.ticker}</span>
                      <span className="text-[10px] text-muted-foreground ml-1.5">{row.exchange}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-medium", MARKET_CLR[row.market])}>{row.market}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 0.7, delay: i * 0.04 + 0.3 }}
                            className="h-full rounded-full"
                            style={{ background: score >= 60 ? "#FF3060" : score >= 40 ? "#F59E0B" : "#00FF88" }}
                          />
                        </div>
                        <span className={cn("mono font-bold text-sm", scoreColor)}>{score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">{row.reason}</td>
                    <td className="px-4 py-3">
                      <span className={cn("flex items-center gap-1 text-xs font-semibold", actionColor)}>
                        <ActionIcon className="w-3 h-3" />
                        {row.action}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
