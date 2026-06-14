"use client";

import { supabase, supabaseReady } from "./supabase";

export interface AlphaSignal {
  id: string;
  ticker: string;
  exchange: string;
  market: "US" | "INDIA" | "UAE" | "CRYPTO";
  action: "BUY" | "SELL" | "HOLD" | "EXIT";
  entry: number;
  sl: number | null;
  t1: number | null;
  t2: number | null;
  rr: number | null;
  confidence: number;
  risk: number;
  currency: string;
  rationale: string;
  newsItem: string;
  generatedAt: string;
  runDate: string;
  scoreBreakdown: {
    technical: number;   // out of 30
    news: number;        // out of 25
    smartMoney: number;  // out of 20
    risk: number;        // out of 15
    regime: number;      // out of 10
  };
  researchNotes?: {
    news?: string;
    technical?: string;
    smartMoney?: string;
    regime?: string;
  };
}

// Static fallback — mirrors the seed data in 005_alpha_signals.sql
const STATIC_SIGNALS: AlphaSignal[] = [
  {
    id: "1", ticker: "NVDA", exchange: "NASDAQ", market: "US", action: "BUY",
    entry: 918, sl: 898, t1: 960, t2: 1005, rr: 2.1, confidence: 88, risk: 28, currency: "$",
    rationale: "RSI breakout from 8-week consolidation zone with institutional accumulation confirmed via 13F. MACD crossover aligned with positive earnings revision momentum.",
    newsItem: "Jensen Huang confirms next-gen Blackwell Ultra chip ahead of schedule — HIGH impact",
    generatedAt: "08:04", runDate: new Date().toISOString().slice(0, 10),
    scoreBreakdown: { technical: 26.4, news: 22.0, smartMoney: 18.0, risk: 13.2, regime: 8.4 },
  },
  {
    id: "2", ticker: "MSFT", exchange: "NASDAQ", market: "US", action: "BUY",
    entry: 418, sl: 403, t1: 445, t2: 468, rr: 2.4, confidence: 85, risk: 24, currency: "$",
    rationale: "Azure AI revenue growing 35% YoY. Copilot enterprise adoption exceeding expectations. Institutional inflows from Citadel and D.E. Shaw detected in recent 13F.",
    newsItem: "Azure AI workloads up 35% — Microsoft raises full-year guidance — HIGH impact",
    generatedAt: "08:55", runDate: new Date().toISOString().slice(0, 10),
    scoreBreakdown: { technical: 25.5, news: 21.25, smartMoney: 17.0, risk: 12.75, regime: 8.5 },
  },
  {
    id: "3", ticker: "FAB", exchange: "ADX", market: "UAE", action: "BUY",
    entry: 14.60, sl: 14.00, t1: 15.80, t2: 16.50, rr: 2.5, confidence: 84, risk: 34, currency: "AED",
    rationale: "First Abu Dhabi Bank showing strong support at 14.00 with DFM major institutional buying of 8.2M shares. Oil price tailwind supports UAE banking NIM expansion.",
    newsItem: "UAE GDP grows 4.3% Q1 2026, FAB reports record net profit — HIGH impact",
    generatedAt: "08:21", runDate: new Date().toISOString().slice(0, 10),
    scoreBreakdown: { technical: 25.2, news: 21.0, smartMoney: 16.8, risk: 12.6, regime: 8.4 },
  },
  {
    id: "4", ticker: "ADNOCGAS", exchange: "ADX", market: "UAE", action: "BUY",
    entry: 4.32, sl: 4.10, t1: 4.75, t2: 5.10, rr: 2.0, confidence: 82, risk: 27, currency: "AED",
    rationale: "ADNOC Gas dividend yield at 5.8% with LNG export contract renewal driving 22% revenue growth. Sovereign fund ADIA has been accumulating over 4 weeks.",
    newsItem: "ADNOC Gas secures 10-year LNG contract with Japanese buyers — HIGH impact",
    generatedAt: "08:51", runDate: new Date().toISOString().slice(0, 10),
    scoreBreakdown: { technical: 24.6, news: 20.5, smartMoney: 16.4, risk: 12.3, regime: 8.2 },
  },
  {
    id: "5", ticker: "HDFCBANK", exchange: "NSE", market: "INDIA", action: "BUY",
    entry: 1640, sl: 1580, t1: 1750, t2: 1820, rr: 1.9, confidence: 81, risk: 41, currency: "₹",
    rationale: "HDFC Bank consolidating above key EMA50 for 3 weeks. RBI rate hold supportive of NIMs. FII net buying ₹2,400Cr in last 5 sessions with no insider selling flagged.",
    newsItem: "RBI holds repo rate at 6.25%, governor signals easing bias — MEDIUM impact",
    generatedAt: "08:29", runDate: new Date().toISOString().slice(0, 10),
    scoreBreakdown: { technical: 24.3, news: 20.25, smartMoney: 16.2, risk: 12.15, regime: 8.1 },
  },
  {
    id: "6", ticker: "EMAAR", exchange: "DFM", market: "UAE", action: "BUY",
    entry: 8.92, sl: 8.50, t1: 9.60, t2: 10.20, rr: 2.2, confidence: 79, risk: 31, currency: "AED",
    rationale: "Emaar Properties at 6-month support level with volume surge. Dubai real estate transaction volumes up 31% YoY. Geopolitical risk premium unwinding.",
    newsItem: "Dubai real estate volumes hit 5-year high, Emaar sales up 28% — HIGH impact",
    generatedAt: "08:38", runDate: new Date().toISOString().slice(0, 10),
    scoreBreakdown: { technical: 23.7, news: 19.75, smartMoney: 15.8, risk: 11.85, regime: 7.9 },
  },
  {
    id: "7", ticker: "TSLA", exchange: "NASDAQ", market: "US", action: "SELL",
    entry: 182, sl: 195, t1: 162, t2: 148, rr: 1.8, confidence: 76, risk: 58, currency: "$",
    rationale: "Tesla breaking below 50-day EMA on above-average volume. China EV market share fell to 11% from 18% YoY. Institutional de-risking detected via 13F delta analysis.",
    newsItem: "Tesla China market share hits new low as BYD dominates — HIGH impact",
    generatedAt: "08:42", runDate: new Date().toISOString().slice(0, 10),
    scoreBreakdown: { technical: 22.8, news: 19.0, smartMoney: 15.2, risk: 11.4, regime: 7.6 },
  },
  {
    id: "8", ticker: "TCS", exchange: "NSE", market: "INDIA", action: "HOLD",
    entry: 3820, sl: 3650, t1: 4050, t2: 4200, rr: 1.7, confidence: 73, risk: 29, currency: "₹",
    rationale: "TCS in healthy uptrend above EMA200. Q4 results beat consensus by 4.2%. Deal pipeline guidance remains strong. Awaiting deal win announcements before adding.",
    newsItem: "TCS wins $500M BFSI deal — management guides for strong FY27 — MEDIUM impact",
    generatedAt: "08:45", runDate: new Date().toISOString().slice(0, 10),
    scoreBreakdown: { technical: 21.9, news: 18.25, smartMoney: 14.6, risk: 10.95, regime: 7.3 },
  },
  {
    id: "9", ticker: "RELIANCE", exchange: "NSE", market: "INDIA", action: "EXIT",
    entry: 2944, sl: null, t1: null, t2: null, rr: null, confidence: 72, risk: 62, currency: "₹",
    rationale: "RSI at 74 (overbought territory). Distribution pattern forming on daily chart. SEBI insider disclosure shows promoter selling ₹340Cr worth of shares last week.",
    newsItem: "SEBI flags insider trading disclosure — promoter sold ₹340Cr — HIGH impact",
    generatedAt: "08:31", runDate: new Date().toISOString().slice(0, 10),
    scoreBreakdown: { technical: 21.6, news: 18.0, smartMoney: 14.4, risk: 10.8, regime: 7.2 },
  },
  {
    id: "10", ticker: "AAPL", exchange: "NASDAQ", market: "US", action: "HOLD",
    entry: 189, sl: 181, t1: 198, t2: 210, rr: 1.6, confidence: 70, risk: 38, currency: "$",
    rationale: "Apple trading in tight range ahead of WWDC. AI features announcement is a pending catalyst. Institutional holdings unchanged. Hold existing position, avoid adding.",
    newsItem: "WWDC 2026 scheduled for June 9 — AI model integration expected — MEDIUM impact",
    generatedAt: "08:55", runDate: new Date().toISOString().slice(0, 10),
    scoreBreakdown: { technical: 21.0, news: 17.5, smartMoney: 14.0, risk: 10.5, regime: 7.0 },
  },
];

export async function fetchTodaySignals(): Promise<AlphaSignal[]> {
  if (!supabaseReady || !supabase) return STATIC_SIGNALS;

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("alpha_signals")
    .select("*")
    .eq("run_date", today)
    .order("confidence", { ascending: false });

  if (error || !data?.length) return STATIC_SIGNALS;

  return data.map(
    (r: Record<string, unknown>): AlphaSignal => ({
      id:         String(r.id),
      ticker:     String(r.ticker),
      exchange:   String(r.exchange),
      market:     r.market as AlphaSignal["market"],
      action:     r.action as AlphaSignal["action"],
      entry:      Number(r.entry),
      sl:         r.sl != null ? Number(r.sl) : null,
      t1:         r.t1 != null ? Number(r.t1) : null,
      t2:         r.t2 != null ? Number(r.t2) : null,
      rr:         r.rr != null ? Number(r.rr) : null,
      confidence: Number(r.confidence),
      risk:       Number(r.risk),
      currency:   String(r.currency ?? "$"),
      rationale:  String(r.rationale ?? ""),
      newsItem:   String(r.news_item ?? ""),
      generatedAt: String(r.generated_at ?? "").slice(11, 16),
      runDate:    String(r.run_date),
      scoreBreakdown: {
        technical:  Number(r.score_technical  ?? 0),
        news:       Number(r.score_news       ?? 0),
        smartMoney: Number(r.score_smart_money ?? 0),
        risk:       Number(r.score_risk       ?? 0),
        regime:     Number(r.score_regime     ?? 0),
      },
      researchNotes: {
        news:       r.research_news        ? String(r.research_news)        : undefined,
        technical:  r.research_technical   ? String(r.research_technical)   : undefined,
        smartMoney: r.research_smart_money ? String(r.research_smart_money) : undefined,
        regime:     r.research_regime      ? String(r.research_regime)      : undefined,
      },
    }),
  );
}

export function buildSignalSystemPrompt(signals: AlphaSignal[]): string {
  const lines = signals.map(s => {
    const price = s.entry != null ? `Entry ${s.currency}${s.entry}` : "";
    const sl    = s.sl   != null ? `| SL ${s.currency}${s.sl}` : "";
    const t1    = s.t1   != null ? `| T1 ${s.currency}${s.t1}` : "";
    const t2    = s.t2   != null ? `| T2 ${s.currency}${s.t2}` : "";
    const rr    = s.rr   != null ? `| R:R ${s.rr}x` : "";
    return `• ${s.ticker} (${s.exchange}/${s.market}) ${s.action} — ${price} ${sl} ${t1} ${t2} ${rr} | Conf ${s.confidence}% | Risk ${s.risk}. ${s.rationale}`;
  });
  return lines.join("\n");
}

export const STATIC_SIGNALS_EXPORT = STATIC_SIGNALS;
