"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Users, TrendingUp, Award, BarChart2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const TRADERS: Record<string, {
  rank: number; name: string; firm: string; style: string;
  winRate: number; monthlyReturn: number; aum: string;
  topHoldings: string[]; performanceScore: number;
}[]> = {
  US: [
    { rank: 1, name: "Citadel",           firm: "Citadel LLC",          style: "QUANT",    winRate: 74, monthlyReturn: 8.2,  aum: "$62B",  topHoldings: ["NVDA","MSFT","AAPL"],     performanceScore: 96 },
    { rank: 2, name: "D.E. Shaw",          firm: "D.E. Shaw Group",      style: "QUANT",    winRate: 71, monthlyReturn: 7.1,  aum: "$60B",  topHoldings: ["AMZN","GOOGL","META"],     performanceScore: 94 },
    { rank: 3, name: "Two Sigma",          firm: "Two Sigma Inv.",       style: "QUANT",    winRate: 69, monthlyReturn: 6.8,  aum: "$58B",  topHoldings: ["SPY","QQQ","MSFT"],        performanceScore: 91 },
    { rank: 4, name: "Renaissance",        firm: "Renaissance Tech.",    style: "QUANT",    winRate: 82, monthlyReturn: 12.4, aum: "$130B", topHoldings: ["Undisclosed"],             performanceScore: 99 },
    { rank: 5, name: "Bridgewater",        firm: "Bridgewater Assoc.",   style: "MACRO",    winRate: 63, monthlyReturn: 5.2,  aum: "$150B", topHoldings: ["SPY","GLD","EEM"],         performanceScore: 87 },
    { rank: 6, name: "Millennium Mgmt",    firm: "Millennium Mgmt.",     style: "MULTI",    winRate: 68, monthlyReturn: 6.1,  aum: "$68B",  topHoldings: ["AAPL","TSLA","NVDA"],      performanceScore: 89 },
    { rank: 7, name: "Pershing Square",    firm: "Pershing Square",      style: "ACTIVIST", winRate: 66, monthlyReturn: 7.4,  aum: "$16B",  topHoldings: ["HLT","CP","GOOG"],         performanceScore: 88 },
    { rank: 8, name: "Tiger Global",       firm: "Tiger Global Mgmt.",   style: "GROWTH",   winRate: 61, monthlyReturn: 5.8,  aum: "$18B",  topHoldings: ["NVDA","META","AMZN"],      performanceScore: 82 },
  ],
  UAE: [
    { rank: 1, name: "ADIA",               firm: "Abu Dhabi Inv. Auth.", style: "MACRO",    winRate: 71, monthlyReturn: 5.9,  aum: "$1T+",  topHoldings: ["EMAAR","FAB","ADNOCGAS"],  performanceScore: 95 },
    { rank: 2, name: "Mubadala",           firm: "Mubadala Inv.",        style: "MACRO",    winRate: 68, monthlyReturn: 5.1,  aum: "$302B", topHoldings: ["ADNOC","FAB","DIB"],       performanceScore: 92 },
    { rank: 3, name: "ADQ",                firm: "ADQ Holding",          style: "VALUE",    winRate: 64, monthlyReturn: 4.8,  aum: "$110B", topHoldings: ["ADCB","DEWA","ETISALAT"],  performanceScore: 88 },
    { rank: 4, name: "Waha Capital",       firm: "Waha Capital PJSC",    style: "MULTI",    winRate: 61, monthlyReturn: 4.2,  aum: "$3.8B", topHoldings: ["AerCap","ADCB","Methanex"],performanceScore: 84 },
    { rank: 5, name: "Emirates NBD AM",    firm: "Emirates NBD AM",      style: "VALUE",    winRate: 58, monthlyReturn: 3.9,  aum: "$8B",   topHoldings: ["EMIRATESNBD","FAB","DEWA"], performanceScore: 79 },
  ],
  INDIA: [
    { rank: 1, name: "Rakesh Jhunjhunwala",firm: "Rare Enterprises",     style: "VALUE",    winRate: 76, monthlyReturn: 9.8,  aum: "₹52,241Cr", topHoldings: ["TITAN","STARBUCK","TATA"],performanceScore: 97 },
    { rank: 2, name: "Ashish Kacholia",    firm: "Lucky Sec.",           style: "GROWTH",   winRate: 72, monthlyReturn: 8.4,  aum: "₹4,200Cr",  topHoldings: ["SULA","EPIGRAL","FAZE"],  performanceScore: 93 },
    { rank: 3, name: "Dolly Khanna",       firm: "Dolly Khanna Inv.",    style: "VALUE",    winRate: 69, monthlyReturn: 7.2,  aum: "₹1,800Cr",  topHoldings: ["RAIN","NRB","ANTGRAPHIC"],performanceScore: 89 },
    { rank: 4, name: "Mohnish Pabrai",     firm: "Pabrai Inv. Fund",     style: "VALUE",    winRate: 67, monthlyReturn: 6.8,  aum: "₹800Cr",    topHoldings: ["SUNTV","MUTHOOTFIN","COAL"],performanceScore: 86 },
    { rank: 5, name: "Rekha Jhunjhunwala", firm: "RARE Enterprises",     style: "VALUE",    winRate: 65, monthlyReturn: 6.1,  aum: "₹14,200Cr", topHoldings: ["TITAN","ESCORTS","CRISIL"],performanceScore: 83 },
    { rank: 6, name: "Sunil Singhania",    firm: "Abakkus Asset Mgmt.",  style: "GROWTH",   winRate: 63, monthlyReturn: 5.9,  aum: "₹2,800Cr",  topHoldings: ["INOX","WELCORP","PCBL"],   performanceScore: 81 },
  ],
};

const CONSENSUS = [
  { ticker: "NVDA",  count: 89, market: "US"    },
  { ticker: "MSFT",  count: 84, market: "US"    },
  { ticker: "AAPL",  count: 81, market: "US"    },
  { ticker: "EMAAR", count: 72, market: "UAE"   },
  { ticker: "FAB",   count: 68, market: "UAE"   },
  { ticker: "TITAN", count: 64, market: "INDIA" },
  { ticker: "AMZN",  count: 61, market: "US"    },
  { ticker: "HDFC",  count: 58, market: "INDIA" },
  { ticker: "ADNOC", count: 54, market: "UAE"   },
  { ticker: "TCS",   count: 51, market: "INDIA" },
];

const MARKET_CLR: Record<string, string> = { US: "#60a5fa", UAE: "#a855f7", INDIA: "#4ade80" };
const STYLE_CLR: Record<string, string> = {
  QUANT: "text-purple-400 bg-purple-400/10",
  MACRO: "text-blue-400 bg-blue-400/10",
  VALUE: "text-yellow-400 bg-yellow-400/10",
  GROWTH: "text-green-400 bg-green-400/10",
  MULTI: "text-orange-400 bg-orange-400/10",
  ACTIVIST: "text-red-400 bg-red-400/10",
};

export default function TradersPage() {
  const [tab, setTab] = useState<"US" | "UAE" | "INDIA">("US");
  const traders = TRADERS[tab];

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="font-heading text-xl font-bold">Top Traders</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Smart money intelligence · US 13F filings Q1 2026 · NSE bulk deals · DFM transactions</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1 self-start w-fit">
        {(["US", "UAE", "INDIA"] as const).map((m) => (
          <motion.button
            key={m}
            onClick={() => setTab(m)}
            className={cn(
              "px-4 py-1.5 rounded-md text-xs font-medium transition-colors relative",
              tab === m ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === m && (
              <motion.div
                layoutId="trader-tab"
                className="absolute inset-0 bg-card rounded-md shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">
              {m === "US" ? "🇺🇸 US" : m === "UAE" ? "🇦🇪 UAE" : "🇮🇳 India"}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Trader table */}
        <div className="xl:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Users className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-sm font-semibold font-heading">{tab === "US" ? "🇺🇸 US" : tab === "UAE" ? "🇦🇪 UAE" : "🇮🇳 India"} — Top Tracked Traders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {["#", "FUND", "STYLE", "WIN RATE", "MONTHLY RTN", "AUM", "TOP HOLDINGS", "SCORE"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold tracking-widest text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {traders.map((t, i) => (
                  <motion.tr
                    key={t.rank}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    className="border-b border-border/40 hover:bg-accent/20 transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <span className={cn("mono font-bold text-sm", t.rank === 1 ? "text-yellow-400" : t.rank === 2 ? "text-muted-foreground" : "text-muted-foreground/60")}>
                        {t.rank === 1 ? "🥇" : t.rank === 2 ? "🥈" : t.rank === 3 ? "🥉" : `#${t.rank}`}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.firm}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", STYLE_CLR[t.style] ?? "text-muted-foreground bg-muted")}>
                        {t.style}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 mono font-semibold text-sm gain">{t.winRate}%</td>
                    <td className="px-3 py-2.5 mono font-semibold text-sm gain">+{t.monthlyReturn}%</td>
                    <td className="px-3 py-2.5 mono text-xs text-muted-foreground">{t.aum}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1 flex-wrap">
                        {t.topHoldings.slice(0, 3).map((h) => (
                          <span key={h} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{h}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${t.performanceScore}%` }}
                            transition={{ duration: 0.7, delay: i * 0.05 + 0.3 }}
                            className="h-full rounded-full bg-primary"
                          />
                        </div>
                        <span className="mono text-xs font-bold gain">{t.performanceScore}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Consensus chart */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-yellow-400" />
            <h2 className="text-sm font-semibold font-heading">Top-100 Consensus Holdings</h2>
          </div>
          <p className="text-[11px] text-muted-foreground">Most held tickers across all tracked traders</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={CONSENSUS} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontFamily: "var(--font-mono)" }} />
              <YAxis type="category" dataKey="ticker" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10, fontFamily: "var(--font-mono)" }} width={44} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: 11 }}
                formatter={(v, _n, props) => [`${v}/100 traders`, (props as { payload: { ticker: string } }).payload.ticker]}
                labelFormatter={() => ""}
              />
              <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                {CONSENSUS.map((entry, i) => (
                  <Cell key={i} fill={MARKET_CLR[entry.market]} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-3 text-[10px]">
            {(["US", "UAE", "INDIA"] as const).map((m) => (
              <div key={m} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: MARKET_CLR[m] }} />
                <span className="text-muted-foreground">{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
