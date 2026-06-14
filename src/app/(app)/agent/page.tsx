"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Bot, Send, Activity, Newspaper, BarChart2, CheckCircle2, Clock, Bell,
  Cpu, TrendingUp, Shield, Search, ChevronRight, RefreshCw, Zap,
  Brain, AlertTriangle, Target, ArrowRight,
} from "lucide-react";
import { setPendingAlert } from "@/lib/alerts";
import { fetchTodaySignals, buildSignalSystemPrompt, type AlphaSignal } from "@/lib/signals";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "brain" | "research" | "breakdown";

interface ResearchAgent {
  id: string;
  name: string;
  icon: typeof Bot;
  color: string;
  status: "idle" | "running" | "done" | "error";
  finding: string;
  duration_ms: number;
}

interface ResearchResult {
  agents: ResearchAgent[];
  synthesis: string;
  market_regime: string;
  regime_score: number;
  key_risks: string[];
  opportunities: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const SUPABASE_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const AGENT_DEFS: Omit<ResearchAgent, "status" | "finding" | "duration_ms">[] = [
  { id: "news",        name: "News Agent",        icon: Newspaper,  color: "text-blue-400"   },
  { id: "technical",   name: "Technical Agent",   icon: TrendingUp, color: "text-primary"    },
  { id: "smart_money", name: "Smart Money Agent", icon: Target,     color: "text-purple-400" },
  { id: "risk",        name: "Risk Agent",        icon: Shield,     color: "text-yellow-400" },
];

const SCORE_BARS = [
  { key: "technical",  label: "Technical",   max: 30, color: "bg-primary"    },
  { key: "news",       label: "News Sent.",  max: 25, color: "bg-blue-500"   },
  { key: "smartMoney", label: "Smart Money", max: 20, color: "bg-purple-500" },
  { key: "risk",       label: "Inv. Risk",   max: 15, color: "bg-yellow-500" },
  { key: "regime",     label: "Regime",      max: 10, color: "bg-orange-500" },
] as const;

const LOG_ENTRIES = [
  { time: "08:00:01", type: "info",    msg: "AlphaBot morning brain — starting" },
  { time: "08:00:03", type: "info",    msg: "Fetching US price data from Polygon.io" },
  { time: "08:00:08", type: "success", msg: "US prices loaded — 156 tickers" },
  { time: "08:00:09", type: "info",    msg: "Fetching India NSE/BSE data via Twelve Data" },
  { time: "08:00:14", type: "success", msg: "India prices loaded — 48 tickers" },
  { time: "08:00:15", type: "info",    msg: "Fetching UAE DFM/ADX data" },
  { time: "08:00:18", type: "success", msg: "UAE prices loaded — 32 tickers" },
  { time: "08:00:19", type: "info",    msg: "Computing RSI(14), MACD(12,26,9), BB(20,2), ATR(14)" },
  { time: "08:00:24", type: "success", msg: "Technical indicators computed — 236 tickers" },
  { time: "08:00:25", type: "info",    msg: "Fetching news — Marketaux + Finnhub (last 16hrs)" },
  { time: "08:01:02", type: "success", msg: "News fetched — 312 articles tagged to 89 tickers" },
  { time: "08:01:03", type: "info",    msg: "Fetching economic events — FOMC, RBI, PMI, CPI" },
  { time: "08:01:08", type: "success", msg: "3 high-impact events flagged for today" },
  { time: "08:01:09", type: "info",    msg: "Syncing smart money data (NSE bulk deals + SEC 13F)" },
  { time: "08:01:45", type: "success", msg: "Smart money sync complete — 14 block deals flagged" },
  { time: "08:01:46", type: "info",    msg: "Starting Claude AI analysis loop — 156 tickers" },
  { time: "08:02:11", type: "brain",   msg: "NVDA — RSI:62.4, MACD:+1.2, sentiment:+0.78 → Confidence 88%" },
  { time: "08:02:14", type: "brain",   msg: "FAB — RSI:58.1, DFM block buy 8.2M shares → Confidence 84%" },
  { time: "08:02:17", type: "brain",   msg: "HDFCBANK — EMA50 support, FII +₹2,400Cr → Confidence 81%" },
  { time: "08:02:21", type: "warn",    msg: "RELIANCE — RSI:74.2 overbought, promoter sell flag → EXIT" },
  { time: "08:02:24", type: "brain",   msg: "MSFT — Azure AI 35% growth, Citadel accumulating → 85%" },
  { time: "08:02:27", type: "brain",   msg: "EMAAR — 6mo support, DXB real estate +31% YoY → 79%" },
  { time: "08:02:31", type: "warn",    msg: "TSLA — below EMA50, China share loss, de-risking → SELL" },
  { time: "08:04:33", type: "success", msg: "AI analysis complete — 156 tickers scored" },
  { time: "08:04:34", type: "info",    msg: "Filtering: confidence ≥ 70% threshold" },
  { time: "08:04:34", type: "success", msg: "10 signals passed confidence filter" },
  { time: "08:04:35", type: "success", msg: "Signals written to database" },
  { time: "08:04:36", type: "success", msg: "Telegram morning report sent — 10 signals" },
  { time: "08:04:36", type: "info",    msg: "AlphaBot morning brain — COMPLETE ✓" },
];

const LOG_COLORS: Record<string, string> = {
  info:    "text-muted-foreground",
  success: "gain",
  warn:    "text-yellow-400",
  brain:   "text-blue-400",
};

const ACTION_COLOR: Record<string, string> = {
  BUY:  "text-primary",
  SELL: "text-destructive",
  HOLD: "text-yellow-400",
  EXIT: "text-orange-400",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnimCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const val = useMotionValue(0);
  useEffect(() => {
    const controls = animate(val, target, {
      duration: duration / 1000,
      ease: "easeOut",
      onUpdate: v => { if (ref.current) ref.current.textContent = Math.round(v).toLocaleString(); },
    });
    return controls.stop;
  }, [target, duration, val]);
  return <span ref={ref}>0</span>;
}

function renderMsg(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{p}</strong> : p,
  );
}

function extractTickers(text: string): string[] {
  const matches = text.match(/\*\*([A-Z]{2,8})\*\*/g) ?? [];
  const skip = new Set(["BUY", "SELL", "HOLD", "EXIT", "LONG", "SHORT", "STOP", "UAE", "NSE", "BSE", "DFM", "ADX", "ETF", "IPO"]);
  return [...new Set(matches.map(m => m.replace(/\*\*/g, "")).filter(t => !skip.has(t)))];
}

function RegimeBar({ score }: { score: number }) {
  const clamped = Math.max(-100, Math.min(100, score));
  const pct = ((clamped + 100) / 200) * 100;
  const color = clamped > 30 ? "bg-primary" : clamped < -30 ? "bg-destructive" : "bg-yellow-500";
  const textColor = clamped > 30 ? "text-primary" : clamped < -30 ? "text-destructive" : "text-yellow-400";
  const label = clamped > 50 ? "GREED" : clamped > 20 ? "BULLISH" : clamped < -50 ? "FEAR" : clamped < -20 ? "BEARISH" : "NEUTRAL";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>FEAR</span>
        <span className={cn("font-semibold", textColor)}>{label} {clamped > 0 ? "+" : ""}{clamped}</span>
        <span>GREED</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div className={cn("h-full rounded-full", color)} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
      </div>
    </div>
  );
}

function AgentCard({ agent, index }: { agent: ResearchAgent; index: number }) {
  const Icon = agent.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="bg-muted/40 border border-border rounded-xl p-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("p-1.5 rounded-lg bg-muted", agent.color)}><Icon className="w-3.5 h-3.5" /></div>
          <span className="text-xs font-semibold">{agent.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {agent.status === "running" && <motion.div className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.7, repeat: Infinity }} />}
          {agent.status === "done"    && <CheckCircle2  className="w-3.5 h-3.5 gain" />}
          {agent.status === "error"   && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
          <span className={cn("text-[10px] font-mono uppercase", agent.status === "running" ? "text-primary" : agent.status === "done" ? "gain" : "text-muted-foreground")}>{agent.status}</span>
        </div>
      </div>
      {agent.status === "running" && (
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary/60 rounded-full" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} />
        </div>
      )}
      {agent.status === "done" && agent.finding && <p className="text-[11px] text-muted-foreground leading-relaxed">{agent.finding}</p>}
      {agent.status === "done" && agent.duration_ms > 0 && <p className="text-[9px] text-muted-foreground/50 mono">{(agent.duration_ms / 1000).toFixed(1)}s</p>}
    </motion.div>
  );
}

function SignalBreakdownRow({ signal, isSelected, onSelect }: { signal: AlphaSignal; isSelected: boolean; onSelect: () => void }) {
  const bd = signal.scoreBreakdown;
  return (
    <motion.div layout onClick={onSelect} className={cn("border rounded-xl p-4 cursor-pointer transition-colors space-y-3", isSelected ? "border-primary/50 bg-primary/5" : "border-border hover:border-border/80")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="font-heading font-bold text-sm mono">{signal.ticker}</span>
          <span className={cn("text-[10px] font-semibold uppercase", ACTION_COLOR[signal.action])}>{signal.action}</span>
          <span className="text-[10px] text-muted-foreground">{signal.exchange}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold mono">{signal.confidence}%</span>
          <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", isSelected && "rotate-90")} />
        </div>
      </div>
      <div className="space-y-1.5">
        {SCORE_BARS.map(bar => {
          const val = bd[bar.key as keyof typeof bd] ?? 0;
          const pct = (val / bar.max) * 100;
          return (
            <div key={bar.key} className="flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground w-20 shrink-0">{bar.label}</span>
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div className={cn("h-full rounded-full", bar.color)} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
              </div>
              <span className="text-[9px] text-muted-foreground mono w-10 text-right">{val.toFixed(1)}/{bar.max}</span>
            </div>
          );
        })}
      </div>
      <AnimatePresence>
        {isSelected && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <p className="text-[11px] text-muted-foreground leading-relaxed pt-1 border-t border-border mt-1">{signal.rationale}</p>
            {signal.newsItem && (
              <p className="text-[10px] text-blue-400/80 mt-1.5 flex items-start gap-1">
                <Newspaper className="w-3 h-3 shrink-0 mt-0.5" />{signal.newsItem}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgentPage() {
  const router = useRouter();

  const [activeTab, setActiveTab]           = useState<Tab>("brain");
  const [signals, setSignals]               = useState<AlphaSignal[]>([]);
  const [signalsLoaded, setSignalsLoaded]   = useState(false);

  // Brain log
  const [visibleLogs, setVisibleLogs] = useState<typeof LOG_ENTRIES>([]);
  const [logIdx, setLogIdx]           = useState(0);

  // Chat
  const [chatInput, setChatInput]     = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "bot"; msg: string }[]>([
    { role: "bot", msg: "AlphaBot online. Morning brain run completed at 08:04 UAE time. 10 signals generated across US, UAE, and India markets. Ask me about any ticker, strategy, or risk." },
  ]);
  const [typing, setTyping]           = useState(false);
  const [streaming, setStreaming]     = useState(false);
  const [alertSuggestion, setAlertSuggestion] = useState<string[] | null>(null);

  // Research agents
  const [researchAgents, setResearchAgents] = useState<ResearchAgent[]>(
    AGENT_DEFS.map(a => ({ ...a, status: "idle" as const, finding: "", duration_ms: 0 })),
  );
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [researchRunning, setResearchRunning] = useState(false);
  const [researchMode, setResearchMode]     = useState<"market_regime" | "signal_breakdown" | "sector_scan">("market_regime");

  // Breakdown
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);

  const logRef  = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTodaySignals().then(s => { setSignals(s); setSignalsLoaded(true); });
  }, []);

  // Brain log animation
  useEffect(() => {
    if (logIdx >= LOG_ENTRIES.length) return;
    const delay = logIdx === 0 ? 300 : 80;
    const t = setTimeout(() => {
      setVisibleLogs(prev => [...prev, LOG_ENTRIES[logIdx]]);
      setLogIdx(i => i + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [logIdx]);

  useEffect(() => { if (logRef.current)  logRef.current.scrollTop  = logRef.current.scrollHeight;  }, [visibleLogs]);
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [chatHistory, typing]);

  const buildSystemPrompt = useCallback(() => {
    const signalBlock = signals.length > 0 ? buildSignalSystemPrompt(signals) : "(signals loading…)";
    return `You are AlphaBot, an elite AI trading analyst for AlphaOS — a multi-market AI trading platform covering US (NASDAQ/NYSE), India (NSE/BSE), UAE (DFM/ADX), and Crypto.

Your morning brain runs daily at 08:00 UAE time, analyzing 156+ tickers using RSI(14), MACD(12,26,9), Bollinger Bands, ATR(14), EMA(9/21/50/200), VWAP, news sentiment, and smart money signals (US 13F filings, India FII/DII flows, UAE DFM block deals).

Confidence formula: 0.30×Technical + 0.25×News Sentiment + 0.20×Smart Money + 0.15×Inverse Risk + 0.10×Market Regime. Threshold: ≥70% only.

TODAY'S SIGNALS (morning brain — 08:04 UAE):
${signalBlock}

PORTFOLIO RISK: 38/100 (MODERATE) — VIX 42 | Correlation 0.61 | Geo Risk 31 | Sentiment +0.42

RESPONSE RULES:
- Be direct and decisive. Traders need actionable answers.
- Bold ticker names (**NVDA**) and action labels (**BUY**).
- Always give specific numbers (entry, SL, target, R:R, confidence) when discussing a signal.
- Explain WHY in 1–2 sentences: technical + fundamental + smart money driver.
- For tickers not in today's list: say no signal today and what would change it.
- Keep responses to 3–5 sentences unless user asks for more.
- Currencies: $ for US, ₹ for India, AED for UAE.`;
  }, [signals]);

  async function sendMessage() {
    const msg = chatInput.trim();
    if (!msg || streaming) return;
    setChatInput("");
    setAlertSuggestion(null);

    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    const historySnapshot = chatHistory.slice(-10).map(h => ({
      role: h.role === "bot" ? "assistant" : "user",
      content: h.msg,
    }));

    setChatHistory(h => [...h, { role: "user", msg }]);
    setTyping(true);
    setStreaming(true);

    try {
      if (!apiKey) throw new Error("NO_KEY");
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          stream: true,
          max_tokens: 600,
          temperature: 0.35,
          messages: [
            { role: "system", content: buildSystemPrompt() },
            ...historySnapshot,
            { role: "user", content: msg },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
        throw new Error(err?.error?.message ?? `Groq ${res.status}`);
      }

      setChatHistory(h => [...h, { role: "bot", msg: "" }]);
      setTyping(false);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const text = JSON.parse(data).choices?.[0]?.delta?.content;
            if (text) setChatHistory(h => { const c = [...h]; c[c.length - 1] = { ...c[c.length - 1], msg: c[c.length - 1].msg + text }; return c; });
          } catch { /* skip malformed SSE */ }
        }
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Unknown error";
      setChatHistory(h => [...h, {
        role: "bot",
        msg: raw === "NO_KEY"
          ? "⚠ GROQ_API_KEY not configured. Add NEXT_PUBLIC_GROQ_API_KEY to .env.local and restart."
          : `⚠ ${raw}`,
      }]);
      setTyping(false);
    } finally {
      setStreaming(false);
      setChatHistory(h => {
        const last = h[h.length - 1];
        if (last?.role === "bot" && last.msg && !last.msg.startsWith("⚠")) {
          const tickers = extractTickers(last.msg);
          if (tickers.length > 0) setAlertSuggestion(tickers.slice(0, 3));
        }
        return h;
      });
    }
  }

  async function runResearch() {
    if (researchRunning || !SUPABASE_URL) return;
    setResearchRunning(true);
    setResearchResult(null);
    setResearchAgents(AGENT_DEFS.map(a => ({ ...a, status: "running" as const, finding: "", duration_ms: 0 })));

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-research`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
        },
        body: JSON.stringify({
          mode: researchMode,
          signals: signals.map(s => ({
            ticker: s.ticker, market: s.market, action: s.action,
            confidence: s.confidence, risk: s.risk,
            rationale: s.rationale, news_item: s.newsItem,
            score_technical: s.scoreBreakdown.technical,
            score_news: s.scoreBreakdown.news,
            score_smart_money: s.scoreBreakdown.smartMoney,
            score_risk: s.scoreBreakdown.risk,
            score_regime: s.scoreBreakdown.regime,
          })),
        }),
      });

      if (!res.ok) throw new Error(`Research API ${res.status}`);
      const data: ResearchResult = await res.json();

      const agentMap = new Map((data.agents ?? []).map(a => [a.id, a]));
      setResearchAgents(AGENT_DEFS.map(def => {
        const result = agentMap.get(def.id);
        return { ...def, status: "done" as const, finding: result?.finding ?? "", duration_ms: result?.duration_ms ?? 0 };
      }));
      setResearchResult(data);
    } catch {
      setResearchAgents(AGENT_DEFS.map(a => ({ ...a, status: "error" as const, finding: "Agent failed — deploy the agent-research edge function.", duration_ms: 0 })));
    } finally {
      setResearchRunning(false);
    }
  }

  function handleSetAlert(symbol: string) {
    setPendingAlert(symbol, "price_above", 0);
    router.push("/alerts");
  }

  const TABS: { id: Tab; label: string; icon: typeof Bot }[] = [
    { id: "brain",     label: "Brain Log",        icon: Brain    },
    { id: "research",  label: "Research Agents",  icon: Search   },
    { id: "breakdown", label: "Signal Breakdown",  icon: BarChart2 },
  ];

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="font-heading text-xl font-bold">AI Agent</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          AlphaBot brain activity · Last run: 08:04 UAE · Next: 08:00 tomorrow
          {signalsLoaded && <span className="ml-2 text-primary">· {signals.length} live signals loaded</span>}
        </p>
      </motion.div>

      {/* Counter strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Activity,  label: "Signals Generated", value: signals.length || 10, color: "text-primary",    delay: 0   },
          { icon: Newspaper, label: "News Processed",     value: 312,                 color: "text-blue-400",  delay: 200 },
          { icon: BarChart2, label: "Tickers Monitored",  value: 156,                 color: "text-purple-400",delay: 400 },
        ].map(({ icon: Icon, label, value, color, delay }) => (
          <motion.div key={label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: delay / 1000 }} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className={cn("p-2.5 rounded-lg bg-muted", color)}><Icon className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className={cn("font-heading text-3xl font-bold mono", color)}>
                <AnimCounter target={value} duration={delay + 1200} />
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 border border-border">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all", activeTab === tab.id ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}>
              <Icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          );
        })}
      </div>

      {/* ── BRAIN LOG + CHAT ─────────────────────────────────────────────── */}
      {activeTab === "brain" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Activity log */}
          <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col" style={{ height: 480 }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
              </div>
              <span className="text-xs text-muted-foreground font-medium mono ml-1">alphabot — morning brain log</span>
              <div className="flex-1" />
              {logIdx < LOG_ENTRIES.length
                ? <motion.div className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                : <CheckCircle2 className="w-3.5 h-3.5 gain" />}
            </div>
            <div ref={logRef} className="flex-1 overflow-y-auto p-4 space-y-0.5 scrollbar-hide">
              <AnimatePresence initial={false}>
                {visibleLogs.map((entry, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }} className="flex gap-3 font-mono text-xs">
                    <span className="text-muted-foreground/50 shrink-0 mono">{entry.time}</span>
                    <span className="text-muted-foreground/50 shrink-0">{entry.type === "success" ? "✓" : entry.type === "warn" ? "⚠" : entry.type === "brain" ? "⟡" : "→"}</span>
                    <span className={LOG_COLORS[entry.type]}>{entry.msg}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {logIdx < LOG_ENTRIES.length && <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="inline-block w-2 h-3.5 bg-primary/80 ml-1" />}
            </div>
          </div>

          {/* Chat */}
          <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col" style={{ height: 480 }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
              <div className="p-1.5 rounded-lg bg-primary/15"><Bot className="w-3.5 h-3.5 text-primary" /></div>
              <span className="text-sm font-semibold">Ask AlphaBot</span>
              <div className="flex-1" />
              <span className="text-[10px] text-muted-foreground">Groq · Llama 3.3 70B</span>
              {signalsLoaded && <span className="text-[10px] text-primary ml-1">· live signals</span>}
            </div>
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {chatHistory.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed", m.role === "user" ? "bg-primary/15 text-foreground" : "bg-muted text-foreground/90")}>
                    {m.role === "bot" ? renderMsg(m.msg) : m.msg}
                    {m.role === "bot" && streaming && m === chatHistory[chatHistory.length - 1] && (
                      <motion.span className="inline-block w-1.5 h-3 bg-primary/70 ml-0.5 align-middle" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.6, repeat: Infinity }} />
                    )}
                  </div>
                </motion.div>
              ))}
              <AnimatePresence>
                {alertSuggestion && !streaming && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="flex justify-start">
                    <div className="bg-primary/8 border border-primary/20 rounded-xl px-3.5 py-2.5 space-y-1.5">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Bell className="w-3 h-3 text-primary" />Set a price alert?</p>
                      <div className="flex flex-wrap gap-1.5">
                        {alertSuggestion.map(sym => (
                          <button key={sym} onClick={() => handleSetAlert(sym)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/15 text-primary text-[10px] font-semibold mono hover:bg-primary/25 transition-colors">
                            <Bell className="w-2.5 h-2.5" />{sym}
                          </button>
                        ))}
                        <button onClick={() => setAlertSuggestion(null)} className="px-2 py-1 rounded-lg text-muted-foreground/50 text-[10px] hover:text-muted-foreground transition-colors">dismiss</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {typing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-muted rounded-xl px-3.5 py-2.5 flex gap-1">
                    {[0, 1, 2].map(i => <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60" animate={{ y: [-2, 2, -2] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />)}
                  </div>
                </motion.div>
              )}
            </div>
            <div className="p-3 border-t border-border shrink-0">
              <div className="flex gap-2">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Ask about any ticker or strategy…" className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                <motion.button onClick={sendMessage} disabled={streaming} whileHover={streaming ? {} : { scale: 1.05 }} whileTap={streaming ? {} : { scale: 0.95 }} className={cn("px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-opacity", streaming ? "bg-primary/40 text-primary-foreground/50 cursor-not-allowed" : "bg-primary text-primary-foreground")}>
                  <Send className="w-3.5 h-3.5" />
                </motion.button>
              </div>
              <div className="flex gap-1.5 mt-2">
                {["NVDA", "RELIANCE", "risk", "strategy"].map(q => (
                  <button key={q} onClick={() => setChatInput(q)} className="px-2 py-0.5 rounded-md border border-border text-[10px] text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">{q}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RESEARCH AGENTS ───────────────────────────────────────────────── */}
      {activeTab === "research" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            {(["market_regime", "signal_breakdown", "sector_scan"] as const).map(mode => (
              <button key={mode} onClick={() => setResearchMode(mode)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border", researchMode === mode ? "bg-primary/15 border-primary/40 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                {mode === "market_regime" ? "Market Regime" : mode === "signal_breakdown" ? "Signal Audit" : "Sector Scan"}
              </button>
            ))}
            <div className="flex-1" />
            <motion.button onClick={runResearch} disabled={researchRunning || !SUPABASE_URL} whileHover={researchRunning ? {} : { scale: 1.02 }} whileTap={researchRunning ? {} : { scale: 0.98 }} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all", researchRunning ? "bg-primary/30 text-primary-foreground/50 cursor-not-allowed" : SUPABASE_URL ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground cursor-not-allowed")}>
              {researchRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {researchRunning ? "Running…" : SUPABASE_URL ? "Run Research" : "Configure Supabase"}
            </motion.button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {researchAgents.map((agent, i) => <AgentCard key={agent.id} agent={agent} index={i} />)}
          </div>

          <AnimatePresence>
            {researchResult && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Market Regime</span>
                    <span className={cn("text-xs font-bold mono px-2 py-0.5 rounded-md", researchResult.market_regime?.includes("BULL") ? "bg-primary/15 text-primary" : researchResult.market_regime?.includes("BEAR") ? "bg-destructive/15 text-destructive" : "bg-yellow-500/15 text-yellow-400")}>{researchResult.market_regime}</span>
                  </div>
                  <RegimeBar score={researchResult.regime_score ?? 0} />
                </div>
                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" />Research Synthesis</span>
                  <p className="text-sm leading-relaxed">{researchResult.synthesis}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(researchResult.key_risks?.length ?? 0) > 0 && (
                    <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                      <span className="text-xs font-semibold text-destructive uppercase tracking-wider flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />Key Risks</span>
                      <ul className="space-y-1.5">{researchResult.key_risks.map((r, i) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><ArrowRight className="w-3 h-3 shrink-0 mt-0.5 text-destructive/60" />{r}</li>)}</ul>
                    </div>
                  )}
                  {(researchResult.opportunities?.length ?? 0) > 0 && (
                    <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5"><Target className="w-3.5 h-3.5" />Opportunities</span>
                      <ul className="space-y-1.5">{researchResult.opportunities.map((o, i) => <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><ArrowRight className="w-3 h-3 shrink-0 mt-0.5 text-primary/60" />{o}</li>)}</ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!researchResult && !researchRunning && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-muted"><Cpu className="w-8 h-8 text-muted-foreground" /></div>
              <p className="text-sm font-medium">4 research agents ready</p>
              <p className="text-xs text-muted-foreground max-w-sm">Select a mode and click Run Research. Agents run in parallel via Claude Sonnet and synthesize findings into a market brief.</p>
              {!SUPABASE_URL && <p className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-2 max-w-sm">Set NEXT_PUBLIC_SUPABASE_URL in .env.local to enable the Claude research agent.</p>}
            </div>
          )}
        </div>
      )}

      {/* ── SIGNAL BREAKDOWN ──────────────────────────────────────────────── */}
      {activeTab === "breakdown" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Confidence formula: <span className="text-foreground">Technical(30%) + News(25%) + Smart Money(20%) + Inv. Risk(15%) + Regime(10%)</span></p>
          <div className="flex flex-wrap gap-3 p-3 bg-card border border-border rounded-xl">
            {SCORE_BARS.map(b => (
              <div key={b.key} className="flex items-center gap-1.5">
                <div className={cn("w-2.5 h-2.5 rounded-sm", b.color)} />
                <span className="text-[10px] text-muted-foreground">{b.label} /{b.max}</span>
              </div>
            ))}
          </div>
          {signals.length === 0
            ? <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Loading signals…</div>
            : <div className="space-y-2">{signals.map(signal => <SignalBreakdownRow key={signal.id} signal={signal} isSelected={selectedSignal === signal.id} onSelect={() => setSelectedSignal(selectedSignal === signal.id ? null : signal.id)} />)}</div>}
        </div>
      )}

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="text-muted-foreground">Next run: <span className="text-foreground font-medium">08:00 UAE tomorrow</span></span>
          <span className="text-muted-foreground">Tickers: <span className="text-foreground font-medium">156</span></span>
          <span className="text-muted-foreground">Chat: <span className="text-foreground font-medium">Groq / Llama 3.3 70B</span></span>
          <span className="text-muted-foreground">Research: <span className="text-primary font-medium">Claude Sonnet 4.6</span></span>
          <span className="text-muted-foreground">Min confidence: <span className="text-foreground font-medium">70%</span></span>
        </div>
      </motion.div>
    </div>
  );
}
