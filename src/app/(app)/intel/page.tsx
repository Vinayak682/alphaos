"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Newspaper, Calendar, AlertTriangle, TrendingUp, Minus, ExternalLink } from "lucide-react";

const NEWS = [
  { id: "1", title: "Nvidia confirms Blackwell Ultra chip production ahead of schedule", source: "Reuters", time: "2m ago",  impact: "HIGH",   market: "US",    tickers: ["NVDA"],           sentiment: 0.92 },
  { id: "2", title: "UAE Q1 GDP grows 4.3% — FAB, Emirates NBD report record profits",  source: "Gulf News",time: "8m ago",  impact: "HIGH",   market: "UAE",   tickers: ["FAB","EMIRATESNBD"],sentiment: 0.85 },
  { id: "3", title: "RBI holds repo rate at 6.25% — governor signals easing bias for H2", source: "ET Now",  time: "14m ago", impact: "HIGH",   market: "INDIA", tickers: ["HDFCBANK","SBIN"],  sentiment: 0.72 },
  { id: "4", title: "Tesla China market share falls to 11% as BYD accelerates expansion", source: "Bloomberg",time: "21m ago", impact: "HIGH",   market: "US",    tickers: ["TSLA"],           sentiment: -0.78 },
  { id: "5", title: "Microsoft Azure AI revenue grows 35% — raises FY2027 guidance",     source: "CNBC",    time: "31m ago", impact: "HIGH",   market: "US",    tickers: ["MSFT"],           sentiment: 0.88 },
  { id: "6", title: "Dubai real estate Q1 2026 transactions hit 5-year high",            source: "Zawya",   time: "42m ago", impact: "HIGH",   market: "UAE",   tickers: ["EMAAR","DEYAAR"],  sentiment: 0.81 },
  { id: "7", title: "SEBI flags Reliance promoter sale — ₹340Cr disclosed",              source: "Moneycontrol",time:"1h ago",impact: "HIGH",   market: "INDIA", tickers: ["RELIANCE"],       sentiment: -0.65 },
  { id: "8", title: "ADNOC Gas secures 10-year LNG supply contract with JERA Japan",     source: "MEED",    time: "1.2h ago",impact: "HIGH",   market: "UAE",   tickers: ["ADNOCGAS"],       sentiment: 0.90 },
  { id: "9", title: "Apple WWDC 2026 set for June 9 — on-device AI integration expected",source: "9to5Mac", time: "1.5h ago",impact: "MEDIUM", market: "US",    tickers: ["AAPL"],           sentiment: 0.58 },
  { id: "10",title: "TCS wins $500M multi-year deal from US BFSI client",                source: "ET",      time: "2h ago",  impact: "MEDIUM", market: "INDIA", tickers: ["TCS"],            sentiment: 0.74 },
  { id: "11",title: "US CPI May 2026 — Core inflation edges down to 2.8% YoY",           source: "BLS",     time: "2.4h ago",impact: "MEDIUM", market: "US",    tickers: ["SPY","QQQ"],      sentiment: 0.61 },
  { id: "12",title: "OPEC+ maintains production cuts — oil holds $82/bbl",               source: "OilPrice",time: "3h ago",  impact: "MEDIUM", market: "UAE",   tickers: ["ADNOC","FAB"],    sentiment: 0.44 },
  { id: "13",title: "Infosys guides 6-8% revenue growth for FY27 — meets expectations",  source: "BSE",     time: "4h ago",  impact: "LOW",    market: "INDIA", tickers: ["INFY"],           sentiment: 0.42 },
  { id: "14",title: "Amazon announces $5B AWS data center expansion in UAE",              source: "WAM",     time: "5h ago",  impact: "LOW",    market: "UAE",   tickers: ["AMZN"],           sentiment: 0.51 },
];

const EVENTS = [
  { date: "TODAY",       time: "14:30 UTC", name: "US PCE Deflator (Apr)",        impact: "HIGH",   market: "US",    note: "Fed's preferred inflation gauge" },
  { date: "TODAY",       time: "18:00 UTC", name: "FOMC Minutes Release",          impact: "HIGH",   market: "US",    note: "Rate path signals critical" },
  { date: "TODAY",       time: "16:30 IST", name: "NSE F&O Expiry",               impact: "MEDIUM", market: "INDIA", note: "Monthly derivatives settlement" },
  { date: "TOMORROW",    time: "09:00 GST", name: "DFM Opening — UAE Markets",     impact: "LOW",    market: "UAE",   note: "Normal trading session" },
  { date: "TOMORROW",    time: "15:00 UTC", name: "Fed Chair Powell Speech",        impact: "HIGH",   market: "US",    note: "Jackson Hole follow-up remarks" },
  { date: "THU 29 MAY",  time: "10:00 IST", name: "India GDP Q4 FY2026",           impact: "HIGH",   market: "INDIA", note: "Expected: 7.1% growth" },
  { date: "THU 29 MAY",  time: "18:00 GST", name: "ADNOCGAS AGM",                  impact: "MEDIUM", market: "UAE",   note: "Dividend announcement expected" },
  { date: "FRI 30 MAY",  time: "13:30 UTC", name: "US Non-Farm Payrolls (May)",    impact: "HIGH",   market: "US",    note: "Consensus: 165K jobs" },
  { date: "FRI 30 MAY",  time: "14:30 GST", name: "EMAAR Q1 2026 Earnings",       impact: "HIGH",   market: "UAE",   note: "Expected: د.إ2.1B revenue" },
  { date: "MON 2 JUN",   time: "10:00 IST", name: "RBI Policy Minutes",            impact: "MEDIUM", market: "INDIA", note: "Dissent votes detail" },
];

const IMPACT_CFG = {
  HIGH:   { cls: "bg-destructive/20 text-destructive border-destructive/40",    dot: "bg-destructive" },
  MEDIUM: { cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",       dot: "bg-yellow-400" },
  LOW:    { cls: "bg-muted text-muted-foreground border-border",                 dot: "bg-muted-foreground" },
};

const MARKET_CLR: Record<string, string> = { US: "text-blue-400", UAE: "text-purple-400", INDIA: "text-green-400" };

export default function IntelPage() {
  const [newsFilter, setNewsFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [marketFilter, setMarketFilter] = useState<"ALL" | "US" | "UAE" | "INDIA">("ALL");

  const filteredNews = NEWS.filter((n) => {
    if (newsFilter !== "ALL" && n.impact !== newsFilter) return false;
    if (marketFilter !== "ALL" && n.market !== marketFilter) return false;
    return true;
  });

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="font-heading text-xl font-bold">Market Intel</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Live news + economic events · Marketaux + Finnhub · 312 articles processed today</p>
      </motion.div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { impact: "HIGH"   as const, count: NEWS.filter(n => n.impact === "HIGH").length,   label: "High Impact Events" },
          { impact: "MEDIUM" as const, count: NEWS.filter(n => n.impact === "MEDIUM").length, label: "Medium Impact Events" },
          { impact: "LOW"    as const, count: NEWS.filter(n => n.impact === "LOW").length,    label: "Low Impact Events" },
        ].map(({ impact, count, label }, i) => {
          const cfg = IMPACT_CFG[impact];
          return (
            <motion.button
              key={impact}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              onClick={() => setNewsFilter(newsFilter === impact ? "ALL" : impact)}
              className={cn(
                "p-3 rounded-xl border text-left transition-all",
                newsFilter === impact ? cfg.cls : "bg-card border-border hover:border-border/80"
              )}
            >
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
              <p className="font-heading text-3xl font-bold mono mt-0.5">{count}</p>
            </motion.button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* News feed */}
        <div className="xl:col-span-2 space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Market:</span>
            {(["ALL", "US", "UAE", "INDIA"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMarketFilter(m)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
                  marketFilter === m ? "bg-primary/15 text-primary border-primary/30" : "text-muted-foreground border-transparent hover:border-border"
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Newspaper className="w-3.5 h-3.5 text-primary" />
              <h2 className="text-sm font-semibold font-heading">Live News Feed</h2>
              <div className="flex-1" />
              <motion.div className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
              <span className="text-[10px] text-muted-foreground">Live</span>
            </div>
            <div className="divide-y divide-border/50">
              {filteredNews.map((n, i) => {
                const cfg = IMPACT_CFG[n.impact as keyof typeof IMPACT_CFG];
                const sentimentColor = n.sentiment > 0.6 ? "gain" : n.sentiment > 0 ? "text-yellow-400" : "loss";
                const SentimentIcon = n.sentiment > 0 ? TrendingUp : n.sentiment < 0 ? TrendingUp : Minus;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-accent/30 transition-colors cursor-pointer group"
                  >
                    <div className={cn("mt-0.5 shrink-0 px-1.5 py-0.5 rounded border text-[10px] font-bold", cfg.cls)}>
                      {n.impact.slice(0, 3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug group-hover:text-primary/90 transition-colors">{n.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground">{n.source}</span>
                        <span className="text-[10px] text-muted-foreground">{n.time}</span>
                        <span className={cn("text-[10px] font-medium", MARKET_CLR[n.market])}>{n.market}</span>
                        <div className="flex gap-1">
                          {n.tickers.map((t) => (
                            <span key={t} className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground mono">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <SentimentIcon className={cn("w-3.5 h-3.5", sentimentColor, n.sentiment < 0 && "rotate-180")} />
                      <span className={cn("text-[10px] mono font-medium", sentimentColor)}>
                        {n.sentiment > 0 ? "+" : ""}{(n.sentiment * 100).toFixed(0)}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Events calendar */}
        <div className="bg-card border border-border rounded-xl overflow-hidden h-fit">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <h2 className="text-sm font-semibold font-heading">Economic Events</h2>
          </div>
          <div className="divide-y divide-border/40">
            {EVENTS.map((ev, i) => {
              const cfg = IMPACT_CFG[ev.impact as keyof typeof IMPACT_CFG];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className="px-4 py-3 hover:bg-accent/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
                      <span className="text-[9px] font-bold text-muted-foreground tracking-wider">{ev.date}</span>
                      <span className="text-[9px] text-muted-foreground/60">{ev.time}</span>
                    </div>
                    <span className={cn("text-[9px] font-medium", MARKET_CLR[ev.market])}>{ev.market}</span>
                  </div>
                  <p className="text-xs font-medium leading-snug">{ev.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{ev.note}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
