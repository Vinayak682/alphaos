"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { cn } from "@/lib/utils";
import { Bot, Send, Activity, Newspaper, BarChart2, CheckCircle2, Clock } from "lucide-react";

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


function AnimCounter({ target, duration = 1500, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const val = useMotionValue(0);
  useEffect(() => {
    const controls = animate(val, target, {
      duration: duration / 1000,
      ease: "easeOut",
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v).toLocaleString() + suffix;
      },
    });
    return controls.stop;
  }, [target, duration, suffix, val]);
  return <span ref={ref}>0{suffix}</span>;
}

function renderMsg(text: string) {
  // Render **bold** markdown inline
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{p}</strong> : p
  );
}

export default function AgentPage() {
  const [visibleLogs, setVisibleLogs] = useState<typeof LOG_ENTRIES>([]);
  const [logIdx, setLogIdx] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "bot"; msg: string }[]>([
    { role: "bot", msg: "AlphaBot online. Morning brain run completed at 08:04 UAE time. 10 signals generated across US, UAE, and India markets. Ask me about any ticker, strategy, or risk." },
  ]);
  const [typing, setTyping] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logIdx >= LOG_ENTRIES.length) return;
    const delay = logIdx === 0 ? 300 : 80;
    const t = setTimeout(() => {
      setVisibleLogs((prev) => [...prev, LOG_ENTRIES[logIdx]]);
      setLogIdx((i) => i + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [logIdx]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [visibleLogs]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatHistory, typing]);

  async function sendMessage() {
    const msg = chatInput.trim();
    if (!msg || streaming) return;
    setChatInput("");

    const historySnapshot = chatHistory.slice(-8).map((h) => ({
      role: h.role,
      content: h.msg,
    }));

    setChatHistory((h) => [...h, { role: "user", msg }]);
    setTyping(true);
    setStreaming(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: historySnapshot }),
      });

      if (!res.ok) throw new Error(await res.text());

      // Add empty bot bubble, then fill it as chunks stream in
      setChatHistory((h) => [...h, { role: "bot", msg: "" }]);
      setTyping(false);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setChatHistory((h) => {
          const copy = [...h];
          copy[copy.length - 1] = { ...copy[copy.length - 1], msg: copy[copy.length - 1].msg + chunk };
          return copy;
        });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      setChatHistory((h) => [...h, {
        role: "bot",
        msg: errMsg.includes("GROQ_API_KEY")
          ? "⚠ GROQ_API_KEY not set. Add it to .env.local and restart the dev server."
          : `⚠ ${errMsg}`,
      }]);
      setTyping(false);
    } finally {
      setStreaming(false);
    }
  }

  const LOG_COLORS: Record<string, string> = {
    info:    "text-muted-foreground",
    success: "gain",
    warn:    "text-yellow-400",
    brain:   "text-blue-400",
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="font-heading text-xl font-bold">AI Agent</h1>
        <p className="text-xs text-muted-foreground mt-0.5">AlphaBot brain activity · Last run: 08:04 UAE · Next: 08:00 tomorrow</p>
      </motion.div>

      {/* Counter strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Activity,   label: "Signals Generated",  value: 10,  suffix: "",   color: "text-primary",    delay: 0    },
          { icon: Newspaper,  label: "News Processed",      value: 312, suffix: "",   color: "text-blue-400",   delay: 200  },
          { icon: BarChart2,  label: "Tickers Monitored",   value: 156, suffix: "",   color: "text-purple-400", delay: 400  },
        ].map(({ icon: Icon, label, value, suffix, color, delay }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: delay / 1000 }}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
          >
            <div className={cn("p-2.5 rounded-lg bg-muted", color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className={cn("font-heading text-3xl font-bold mono", color)}>
                <AnimCounter target={value} duration={delay + 1200} suffix={suffix} />
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main panel: log + chat */}
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
            {logIdx < LOG_ENTRIES.length && (
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
            {logIdx >= LOG_ENTRIES.length && <CheckCircle2 className="w-3.5 h-3.5 gain" />}
          </div>
          <div ref={logRef} className="flex-1 overflow-y-auto p-4 space-y-0.5 scrollbar-hide">
            <AnimatePresence initial={false}>
              {visibleLogs.map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex gap-3 font-mono text-xs"
                >
                  <span className="text-muted-foreground/50 shrink-0 mono">{entry.time}</span>
                  <span className="text-muted-foreground/50 shrink-0">
                    {entry.type === "success" ? "✓" : entry.type === "warn" ? "⚠" : entry.type === "brain" ? "⟡" : "→"}
                  </span>
                  <span className={LOG_COLORS[entry.type]}>{entry.msg}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {logIdx < LOG_ENTRIES.length && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-2 h-3.5 bg-primary/80 ml-1"
              />
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col" style={{ height: 480 }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
            <div className="p-1.5 rounded-lg bg-primary/15">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold">Ask AlphaBot</span>
            <div className="flex-1" />
            <span className="text-[10px] text-muted-foreground">Powered by Groq · Llama 3.3 70B</span>
          </div>
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {chatHistory.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div className={cn(
                  "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-primary/15 text-foreground"
                    : "bg-muted text-foreground/90"
                )}>
                  {m.role === "bot" ? renderMsg(m.msg) : m.msg}
                  {m.role === "bot" && streaming && m === chatHistory[chatHistory.length - 1] && (
                    <motion.span
                      className="inline-block w-1.5 h-3 bg-primary/70 ml-0.5 align-middle"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    />
                  )}
                </div>
              </motion.div>
            ))}
            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-muted rounded-xl px-3.5 py-2.5 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary/60"
                      animate={{ y: [-2, 2, -2] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
          <div className="p-3 border-t border-border shrink-0">
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about any ticker or strategy…"
                className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <motion.button
                onClick={sendMessage}
                disabled={streaming}
                whileHover={streaming ? {} : { scale: 1.05 }}
                whileTap={streaming ? {} : { scale: 0.95 }}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-opacity",
                  streaming
                    ? "bg-primary/40 text-primary-foreground/50 cursor-not-allowed"
                    : "bg-primary text-primary-foreground"
                )}
              >
                <Send className="w-3.5 h-3.5" />
              </motion.button>
            </div>
            <div className="flex gap-1.5 mt-2">
              {["NVDA", "RELIANCE", "risk", "strategy"].map((q) => (
                <button
                  key={q}
                  onClick={() => { setChatInput(q); }}
                  className="px-2 py-0.5 rounded-md border border-border text-[10px] text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Run schedule info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
      >
        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex gap-6 text-xs">
          <span className="text-muted-foreground">Next run: <span className="text-foreground font-medium">08:00 UAE tomorrow (28 May)</span></span>
          <span className="text-muted-foreground">Tickers monitored: <span className="text-foreground font-medium">156</span></span>
          <span className="text-muted-foreground">Model: <span className="text-foreground font-medium">Groq / Llama 3.3 70B</span></span>
          <span className="text-muted-foreground">Min confidence: <span className="text-foreground font-medium">70%</span></span>
        </div>
      </motion.div>
    </div>
  );
}
