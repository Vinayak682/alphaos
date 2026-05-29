"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Plus, CheckCircle2, Trash2, X, Copy, ExternalLink, Shield, Lock, AlertCircle, Loader2, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAlerts, addAlert, toggleAlert, deleteAlert, conditionLabel,
  consumePendingAlert,
  type Alert, type AlertCondition, type AlertChannel,
} from "@/lib/alerts";
import {
  loadConfig, saveConfig, clearConfig, sendTestTelegram, sendTestWhatsApp,
  type NotificationConfig,
} from "@/lib/notifications";
import { MessageSquare, PhoneCall } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────
const CONDITION_OPTIONS: { value: AlertCondition; label: string; placeholder: string; prefix: string }[] = [
  { value: "price_above",    label: "Price above",  placeholder: "e.g. 110000", prefix: "$" },
  { value: "price_below",    label: "Price below",  placeholder: "e.g. 850",    prefix: "$" },
  { value: "rsi_above",      label: "RSI >",        placeholder: "e.g. 70",     prefix: ""  },
  { value: "drawdown_above", label: "Drawdown >",   placeholder: "e.g. 5",      prefix: ""  },
];
const COMMON_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "NVDA", "AAPL", "MSFT", "SPY", "TSLA", "HDFCBANK", "EMAAR", "FAB"];

// ── New Alert Modal ───────────────────────────────────────────────────────
function NewAlertModal({ onClose, prefill }: { onClose: (added?: Alert) => void; prefill?: Partial<Alert> }) {
  const [symbol, setSymbol]         = useState(prefill?.symbol ?? "");
  const [conditionType, setCond]    = useState<AlertCondition>(prefill?.conditionType ?? "price_above");
  const [threshold, setThreshold]   = useState(prefill?.threshold?.toString() ?? "");
  const [channel, setChannel]       = useState<AlertChannel>("Email");
  const [error, setError]           = useState("");
  const condOpt = CONDITION_OPTIONS.find(c => c.value === conditionType)!;

  function submit() {
    if (!symbol.trim())           { setError("Symbol is required"); return; }
    const val = parseFloat(threshold);
    if (isNaN(val) || val <= 0)   { setError("Enter a valid threshold number"); return; }
    const alert = addAlert({ symbol: symbol.toUpperCase().trim(), conditionType, threshold: val, channel, active: true });
    onClose(alert);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div><h2 className="font-heading font-bold text-base">New Price Alert</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Triggers when condition is met</p></div>
          <button onClick={() => onClose()} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Symbol</label>
            <input value={symbol} onChange={e => { setSymbol(e.target.value.toUpperCase()); setError(""); }}
              placeholder="BTCUSDT, NVDA, AAPL…"
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm mono font-medium focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:font-sans placeholder:text-muted-foreground" />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_SYMBOLS.map(s => (
                <button key={s} onClick={() => { setSymbol(s); setError(""); }}
                  className={cn("px-2 py-0.5 rounded-md border text-[10px] mono transition-colors",
                    symbol === s ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Condition</label>
            <div className="grid grid-cols-2 gap-1.5">
              {CONDITION_OPTIONS.map(c => (
                <button key={c.value} onClick={() => setCond(c.value)}
                  className={cn("py-2 px-3 rounded-lg border text-xs font-medium transition-colors text-left",
                    conditionType === c.value ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Threshold</label>
            <div className="relative">
              {condOpt.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm mono">{condOpt.prefix}</span>}
              <input value={threshold} onChange={e => { setThreshold(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && submit()} type="number" placeholder={condOpt.placeholder}
                className={cn("w-full bg-muted/50 border border-border rounded-lg py-2.5 text-sm mono font-medium focus:outline-none focus:ring-1 focus:ring-primary/50",
                  condOpt.prefix ? "pl-7 pr-3" : "px-3")} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Channel</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["Email", "Telegram"] as AlertChannel[]).map(ch => (
                <button key={ch} onClick={() => setChannel(ch)}
                  className={cn("py-2 px-3 rounded-lg border text-xs font-medium transition-colors flex items-center gap-2",
                    channel === ch ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                  <Bell className="w-3 h-3" />{ch}
                </button>
              ))}
            </div>
          </div>
          {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</motion.p>}
          <motion.button onClick={submit} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold flex items-center justify-center gap-2 mt-1">
            <Bell className="w-3.5 h-3.5" />Create Alert
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Telegram Setup Wizard ─────────────────────────────────────────────────
function TelegramSetup({ onClose, onConnected }: { onClose: () => void; onConnected: () => void }) {
  const [step, setStep]       = useState(1);
  const [chatId, setChatId]   = useState("");
  const [testing, setTesting] = useState(false);
  const [testErr, setTestErr] = useState("");
  const [copied, setCopied]   = useState(false);

  async function handleTest() {
    if (!chatId.trim()) { setTestErr("Enter your Chat ID first"); return; }
    setTesting(true); setTestErr("");
    const res = await sendTestTelegram(chatId.trim());
    setTesting(false);
    if (res.success) {
      const cfg = await loadConfig();
      await saveConfig({ ...cfg, telegram: { chatId: chatId.trim(), verifiedAt: new Date().toISOString() } });
      setStep(4);
    } else {
      setTestErr(res.error ?? "Delivery failed — check your Chat ID and try again");
    }
  }

  function copyBotName() {
    navigator.clipboard.writeText("@AlphaOSAlerts_bot");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const steps = ["Find Bot", "Start Bot", "Get Chat ID", "Verify"];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-[#229ED9]/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#229ED9]/20 flex items-center justify-center text-lg">✈️</div>
            <div><p className="font-heading font-bold text-sm">Connect Telegram</p>
              <p className="text-[10px] text-muted-foreground">Instant alerts · 0ms latency</p></div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-6 pt-4 pb-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors",
                i + 1 < step  ? "bg-primary text-primary-foreground" :
                i + 1 === step ? "bg-primary/20 text-primary border border-primary/50" :
                "bg-muted text-muted-foreground")}>
                {i + 1 < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <p className={cn("text-[9px] ml-1 hidden sm:block transition-colors",
                i + 1 <= step ? "text-foreground font-medium" : "text-muted-foreground")}>{s}</p>
              {i < steps.length - 1 && <div className={cn("flex-1 h-px mx-2 transition-colors", i + 1 < step ? "bg-primary/40" : "bg-border")} />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="px-6 py-4 space-y-4 min-h-[220px]">
          <AnimatePresence>
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <p className="text-sm font-semibold">Step 1 — Find the AlphaOS Bot</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Search for our official alert bot on Telegram. All notifications are sent through this bot — your Telegram credentials never leave your device.
                </p>
                <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl border border-border/60">
                  <span className="mono text-sm font-bold text-[#229ED9]">@AlphaOSAlerts_bot</span>
                  <button onClick={copyBotName} className="ml-auto p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <a href="https://t.me/AlphaOSAlerts_bot" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#229ED9]/15 border border-[#229ED9]/30 text-[#229ED9] text-sm font-medium hover:bg-[#229ED9]/20 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />Open in Telegram
                </a>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <p className="text-sm font-semibold">Step 2 — Start the Bot</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  In the Telegram chat with <span className="mono text-[#229ED9]">@AlphaOSAlerts_bot</span>, tap the <strong>Start</strong> button or send the command:
                </p>
                <div className="p-3 bg-muted/40 rounded-xl border border-border/60 mono text-sm text-primary">/start</div>
                <p className="text-xs text-muted-foreground">The bot will reply with a welcome message and your Chat ID.</p>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <p className="text-sm font-semibold">Step 3 — Enter Your Chat ID</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The bot replied with your Chat ID — a number like <span className="mono">123456789</span>. Enter it below.
                </p>
                <div>
                  <input value={chatId} onChange={e => { setChatId(e.target.value); setTestErr(""); }}
                    onKeyDown={e => e.key === "Enter" && handleTest()}
                    placeholder="e.g. 123456789"
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm mono font-medium focus:outline-none focus:ring-1 focus:ring-[#229ED9]/50 placeholder:font-sans placeholder:text-muted-foreground" />
                </div>
                {testErr && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2 p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400">{testErr}</p>
                  </motion.div>
                )}
                <button onClick={handleTest} disabled={testing || !chatId.trim()}
                  className="w-full py-2.5 rounded-xl bg-[#229ED9]/15 border border-[#229ED9]/30 text-[#229ED9] text-sm font-medium hover:bg-[#229ED9]/20 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                  {testing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending test message…</> : <><Bell className="w-3.5 h-3.5" />Send test &amp; verify</>}
                </button>
              </motion.div>
            )}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center gap-3 py-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-green-400/15 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </motion.div>
                <p className="font-heading font-bold text-base">Telegram Connected!</p>
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  A test message was sent to your Telegram. All price alerts will now appear there instantly.
                </p>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <Lock className="w-3 h-3 text-primary" />
                  <span className="text-[10px] text-primary">Chat ID encrypted with AES-256 on this device</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          {step < 4 ? (
            <>
              <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                {step === 1 ? "Cancel" : "Back"}
              </button>
              {step < 3 ? (
                <button onClick={() => setStep(s => s + 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#229ED9]/15 border border-[#229ED9]/30 text-[#229ED9] text-sm font-medium hover:bg-[#229ED9]/20 transition-colors">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </>
          ) : (
            <button onClick={onConnected}
              className="ml-auto px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
              Done
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── WhatsApp Setup Wizard ─────────────────────────────────────────────────
// 6-step: Add Contact → Send Activation → Get API Key → Enter Details → Check Phone → Done
function WhatsAppSetup({ onClose, onConnected }: { onClose: () => void; onConnected: () => void }) {
  const [step, setStep]         = useState(1);
  const [phone, setPhone]       = useState("");
  const [apiKey, setApiKey]     = useState("");
  const [testing, setTesting]   = useState(false);
  const [testErr, setTestErr]   = useState("");
  const [copied, setCopied]     = useState(false);
  const [copyWhat, setCopyWhat] = useState<"number" | "text" | null>(null);

  function copy(text: string, which: "number" | "text") {
    navigator.clipboard.writeText(text);
    setCopyWhat(which);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSendTest() {
    if (!phone.trim() || !apiKey.trim()) { setTestErr("Enter phone number and API key"); return; }
    setTesting(true); setTestErr("");
    try {
      const res = await sendTestWhatsApp(phone.trim(), apiKey.trim());
      setTesting(false);
      if (!res.fired) {
        setTestErr("Network error — check your internet connection and try again.");
        return;
      }
      // Message fired (may be CORS-opaque) → move to manual confirmation step
      setStep(5);
    } catch (err) {
      setTesting(false);
      setTestErr(err instanceof Error ? err.message : "Failed to send — check your details.");
    }
  }

  async function confirmReceived() {
    const cleanPhone = phone.replace(/\D/g, "");
    const cfg = await loadConfig();
    await saveConfig({ ...cfg, whatsapp: { phone: cleanPhone, apiKey: apiKey.trim(), verifiedAt: new Date().toISOString() } });
    setStep(6);
  }

  const steps = ["Add Contact", "Activate", "Get Key", "Details", "Confirm", "Done"];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-[#25D366]/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#25D366]/20 flex items-center justify-center text-lg">💬</div>
            <div>
              <p className="font-heading font-bold text-sm">Connect WhatsApp</p>
              <p className="text-[10px] text-muted-foreground">Via CallMeBot · Free · No approval needed</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* Step dots */}
        <div className="flex items-center px-6 pt-4 pb-2 gap-0">
          {steps.map((_, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-all",
                i + 1 < step  ? "bg-[#25D366] text-black" :
                i + 1 === step ? "bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/50 scale-110" :
                "bg-muted text-muted-foreground")}>
                {i + 1 < step ? <Check className="w-2.5 h-2.5" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={cn("flex-1 h-px mx-1 transition-colors", i + 1 < step ? "bg-[#25D366]/50" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        <div className="px-6 py-4 space-y-3 min-h-[260px]">
          <AnimatePresence>

            {/* Step 1: Add contact */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <p className="text-sm font-semibold">Step 1 — Save CallMeBot as a Contact</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Save this number in your phone as <strong>"CallMeBot"</strong>. WhatsApp requires you to have a contact before messaging.
                </p>
                <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl border border-border/60">
                  <PhoneCall className="w-4 h-4 text-[#25D366] shrink-0" />
                  <span className="mono text-base font-bold text-[#25D366] flex-1">+34 644 59 81 98</span>
                  <button onClick={() => copy("+34 644 59 81 98", "number")}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0">
                    {copied && copyWhat === "number" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/15 rounded-lg">
                  <Shield className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    CallMeBot only <em>sends</em> messages to you — it cannot read your chats or access your contacts list.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 2: Send activation */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <p className="text-sm font-semibold">Step 2 — Send the Activation Message</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Open WhatsApp and send this <strong>exact</strong> message to +34 644 59 81 98:
                </p>
                <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl border border-border/60">
                  <MessageSquare className="w-4 h-4 text-[#25D366] shrink-0" />
                  <span className="text-xs font-medium text-foreground flex-1">I allow callmebot to send me messages</span>
                  <button onClick={() => copy("I allow callmebot to send me messages", "text")}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0">
                    {copied && copyWhat === "text" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-yellow-400/8 border border-yellow-400/20">
                  <AlertCircle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-yellow-400/90">Copy exactly — typos or extra spaces will prevent activation.</p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Get API key */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <p className="text-sm font-semibold">Step 3 — Get Your API Key</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  CallMeBot will reply on WhatsApp with your personal API key within 1–2 minutes.
                </p>
                <div className="p-3 bg-muted/40 rounded-xl border border-border/60 space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Example reply:</p>
                  <p className="text-xs text-foreground italic leading-relaxed">
                    &ldquo;API Granted for +971XXXXXXXX. Your APIKEY is <span className="mono font-bold text-[#25D366]">1234567</span>&rdquo;
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">Copy the number (e.g. <span className="mono">1234567</span>) — you&apos;ll enter it in the next step.</p>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-yellow-400/8 border border-yellow-400/20">
                  <AlertCircle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-yellow-400/90">No reply after 3 minutes? Ensure you sent the exact message and the number is saved as a contact.</p>
                </div>
              </motion.div>
            )}

            {/* Step 4: Enter details + send test */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <p className="text-sm font-semibold">Step 4 — Enter Your Details &amp; Send Test</p>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">
                    Phone Number <span className="normal-case text-muted-foreground/60">(with country code, no +)</span>
                  </label>
                  <input value={phone} onChange={e => { setPhone(e.target.value); setTestErr(""); }}
                    placeholder="e.g. 971501234567  or  447911123456"
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm mono font-medium focus:outline-none focus:ring-1 focus:ring-[#25D366]/50 placeholder:font-sans placeholder:text-muted-foreground placeholder:text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">
                    CallMeBot API Key
                  </label>
                  <input value={apiKey} onChange={e => { setApiKey(e.target.value); setTestErr(""); }}
                    placeholder="e.g. 1234567"
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm mono font-medium focus:outline-none focus:ring-1 focus:ring-[#25D366]/50 placeholder:font-sans placeholder:text-muted-foreground" />
                </div>
                {testErr && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-start gap-2 p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400">{testErr}</p>
                  </motion.div>
                )}
                <button onClick={handleSendTest} disabled={testing || !phone.trim() || !apiKey.trim()}
                  className="w-full py-2.5 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] text-sm font-semibold hover:bg-[#25D366]/20 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                  {testing
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending…</>
                    : <><Bell className="w-3.5 h-3.5" />Send Test Message</>}
                </button>
                <div className="flex items-center gap-1.5 p-2.5 bg-primary/5 border border-primary/15 rounded-lg">
                  <Lock className="w-3 h-3 text-primary shrink-0" />
                  <p className="text-[10px] text-muted-foreground">Encrypted AES-256-GCM on device. Your API key never leaves unencrypted.</p>
                </div>
              </motion.div>
            )}

            {/* Step 5: Manual confirmation */}
            {step === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center gap-2">
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-2xl">📱</motion.div>
                  <p className="text-sm font-semibold">Check Your WhatsApp</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We sent a test message to <span className="mono text-foreground font-medium">+{phone.replace(/\D/g, "")}</span> from <span className="mono">+34 644 59 81 98</span>.
                  Open WhatsApp — did you receive it?
                </p>
                <div className="p-3 bg-muted/40 rounded-xl border border-border/60 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Expected message:</p>
                  <p className="text-xs text-foreground">✅ AlphaOS Alert Test — WhatsApp connected! You&apos;ll receive price alerts here.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button onClick={confirmReceived}
                    className="py-2.5 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] text-sm font-semibold hover:bg-[#25D366]/20 transition-colors flex items-center justify-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />Yes, received!
                  </button>
                  <button onClick={() => { setStep(4); setTestErr(""); }}
                    className="py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5">
                    <X className="w-3.5 h-3.5" />No, retry
                  </button>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                  <AlertCircle className="w-3 h-3 text-muted-foreground/60 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Not received after 2 minutes? Tap <strong>No, retry</strong> and double-check your phone number and API key. Messages may take up to 60 seconds.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 6: Success */}
            {step === 6 && (
              <motion.div key="s6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center gap-3 py-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-[#25D366]/15 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-[#25D366]" />
                </motion.div>
                <p className="font-heading font-bold text-base">WhatsApp Connected!</p>
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  All price alerts will now appear on your WhatsApp instantly.
                </p>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <Lock className="w-3 h-3 text-primary" />
                  <span className="text-[10px] text-primary">Phone + API key encrypted AES-256-GCM — this device only</span>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          {step < 6 && step !== 5 ? (
            <>
              <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                {step === 1 ? "Cancel" : "Back"}
              </button>
              {step < 4 && (
                <button onClick={() => setStep(s => s + 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] text-sm font-medium hover:bg-[#25D366]/20 transition-colors">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          ) : step === 6 ? (
            <button onClick={onConnected}
              className="ml-auto px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
              Done
            </button>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
const rowVariant  = { hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0, transition: { duration: 0.28 } } };
const containerV  = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

export default function AlertsPage() {
  const [alerts, setAlerts]          = useState<Alert[]>([]);
  const [notifConfig, setNotifConfig]= useState<NotificationConfig>({});
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [prefill, setPrefill]        = useState<Partial<Alert> | undefined>();
  const [showTelegram, setShowTelegram]    = useState(false);
  const [showWhatsApp, setShowWhatsApp]    = useState(false);

  const refreshConfig = useCallback(async () => {
    const cfg = await loadConfig();
    setNotifConfig(cfg);
  }, []);

  useEffect(() => {
    setAlerts(getAlerts());
    refreshConfig();
    const pending = consumePendingAlert();
    if (pending) { setPrefill(pending); setShowAlertModal(true); }
  }, [refreshConfig]);

  async function disconnectChannel(ch: keyof NotificationConfig) {
    await clearConfig(ch);
    await refreshConfig();
  }

  function handleToggle(id: string)  { setAlerts(toggleAlert(id)); }
  function handleDelete(e: React.MouseEvent, id: string) { e.stopPropagation(); setAlerts(deleteAlert(id)); }
  function handleAlertClose(added?: Alert) { setShowAlertModal(false); setPrefill(undefined); if (added) setAlerts(getAlerts()); }

  const channels = [
    {
      key:       "telegram" as const,
      name:      "Telegram",
      desc:      "Instant push alerts · 0ms latency",
      icon:      "✈️",
      color:     "#229ED9",
      connected: !!notifConfig.telegram,
      verifiedAt: notifConfig.telegram?.verifiedAt,
      onSetup:   () => setShowTelegram(true),
    },
    {
      key:       "whatsapp" as const,
      name:      "WhatsApp",
      desc:      "Via CallMeBot · Free · No server approval",
      icon:      "💬",
      color:     "#25D366",
      connected: !!notifConfig.whatsapp,
      verifiedAt: notifConfig.whatsapp?.verifiedAt,
      onSetup:   () => setShowWhatsApp(true),
    },
    {
      key:       null,
      name:      "Email",
      desc:      "Daily digest + critical alerts",
      icon:      "📧",
      color:     "#a855f7",
      connected: true,
      verifiedAt: undefined,
      onSetup:   () => {},
    },
  ];

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold">Alerts</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {alerts.filter(a => a.active).length} active · click row to toggle · AlphaBot can auto-create alerts
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={() => { setPrefill(undefined); setShowAlertModal(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" />New Alert
        </motion.button>
      </motion.div>

      {/* Alert table */}
      <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border text-xs text-muted-foreground font-medium">
          <span className="col-span-3">Symbol</span>
          <span className="col-span-4">Condition</span>
          <span className="col-span-2">Channel</span>
          <span className="col-span-2 text-right">Status</span>
          <span className="col-span-1" />
        </div>
        {alerts.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No alerts yet. Click <strong>+ New Alert</strong> or ask AlphaBot to create one.</div>
        ) : (
          <motion.div variants={containerV} initial="hidden" animate="show" className="divide-y divide-border">
            <AnimatePresence>
              {alerts.map(a => {
                const lbl = conditionLabel(a);
                return (
                  <motion.div key={a.id} variants={rowVariant} exit={{ opacity: 0, x: 14, transition: { duration: 0.2 } }}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.025)" }}
                    className="grid grid-cols-12 gap-2 px-4 py-3.5 items-center text-sm cursor-pointer transition-colors"
                    onClick={() => handleToggle(a.id)}>
                    <span className="col-span-3 mono font-semibold text-xs">{a.symbol}</span>
                    <span className="col-span-4 text-muted-foreground text-xs">
                      {lbl.main} <span className="text-foreground mono font-medium">{lbl.bold}</span>
                    </span>
                    <span className="col-span-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Bell className="w-3 h-3 shrink-0" />{a.channel}
                    </span>
                    <div className="col-span-2 flex justify-end">
                      <motion.span layout className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold",
                        a.active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                        {a.active ? "Active" : "Off"}
                      </motion.span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button onClick={e => handleDelete(e, a.id)}
                        className="p-1 rounded text-muted-foreground/40 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      {/* AlphaBot tip */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl">
        <Bell className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="text-foreground font-medium">Tip:</span> Go to <strong>AI Agent</strong> and ask <em>&ldquo;Set a price alert for NVDA above $960&rdquo;</em> — AlphaBot creates it automatically.
        </p>
      </motion.div>

      {/* Notification Channels */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}
        className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Notification Channels</h3>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-muted-foreground">Credentials encrypted AES-256-GCM on device</span>
          </div>
        </div>
        <div className="divide-y divide-border">
          {channels.map((ch, i) => (
            <motion.div key={ch.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.07 }}
              className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: `${ch.color}18` }}>
                  {ch.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{ch.name}</p>
                  <p className="text-[11px] text-muted-foreground">{ch.desc}</p>
                  {ch.connected && ch.verifiedAt && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 mono">
                      verified {new Date(ch.verifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {ch.connected ? (
                  <>
                    <motion.div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-400/10 border border-green-400/20">
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                      <span className="text-[11px] text-green-400 font-medium">Connected</span>
                    </motion.div>
                    {ch.key && (
                      <button onClick={() => disconnectChannel(ch.key!)}
                        className="px-2 py-1 rounded-lg text-[10px] text-muted-foreground/50 hover:text-red-400 hover:bg-red-400/10 transition-colors border border-transparent hover:border-red-400/20">
                        Disconnect
                      </button>
                    )}
                  </>
                ) : (
                  <motion.button onClick={ch.onSetup} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                    style={{ borderColor: `${ch.color}40`, color: ch.color, background: `${ch.color}10` }}>
                    Setup <ChevronRight className="w-3 h-3" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showAlertModal  && <NewAlertModal  onClose={handleAlertClose} prefill={prefill} />}
        {showTelegram    && <TelegramSetup  onClose={() => setShowTelegram(false)} onConnected={async () => { setShowTelegram(false); await refreshConfig(); }} />}
        {showWhatsApp    && <WhatsAppSetup  onClose={() => setShowWhatsApp(false)} onConnected={async () => { setShowWhatsApp(false); await refreshConfig(); }} />}
      </AnimatePresence>
    </div>
  );
}
