"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Plus, CheckCircle2, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAlerts, addAlert, toggleAlert, deleteAlert, conditionLabel,
  consumePendingAlert,
  type Alert, type AlertCondition, type AlertChannel,
} from "@/lib/alerts";

const CONDITION_OPTIONS: { value: AlertCondition; label: string; placeholder: string; prefix: string }[] = [
  { value: "price_above",    label: "Price above",  placeholder: "e.g. 110000", prefix: "$" },
  { value: "price_below",    label: "Price below",  placeholder: "e.g. 850",    prefix: "$" },
  { value: "rsi_above",      label: "RSI >",        placeholder: "e.g. 70",     prefix: ""  },
  { value: "drawdown_above", label: "Drawdown >",   placeholder: "e.g. 5",      prefix: ""  },
];

const CHANNEL_OPTIONS: AlertChannel[] = ["Telegram", "Email"];

const COMMON_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "NVDA", "AAPL", "MSFT", "SPY", "TSLA", "HDFCBANK", "EMAAR", "FAB"];

function NewAlertModal({
  onClose,
  prefill,
}: {
  onClose: (added?: Alert) => void;
  prefill?: Partial<Alert>;
}) {
  const [symbol, setSymbol] = useState(prefill?.symbol ?? "");
  const [conditionType, setConditionType] = useState<AlertCondition>(prefill?.conditionType ?? "price_above");
  const [threshold, setThreshold] = useState(prefill?.threshold?.toString() ?? "");
  const [channel, setChannel] = useState<AlertChannel>(prefill?.channel ?? "Email");
  const [error, setError] = useState("");

  const condOpt = CONDITION_OPTIONS.find((c) => c.value === conditionType)!;

  function submit() {
    if (!symbol.trim()) { setError("Symbol is required"); return; }
    const val = parseFloat(threshold);
    if (isNaN(val) || val <= 0) { setError("Enter a valid threshold number"); return; }
    const alert = addAlert({ symbol: symbol.toUpperCase().trim(), conditionType, threshold: val, channel, active: true });
    onClose(alert);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-heading font-bold text-base">New Price Alert</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Get notified when conditions are met</p>
          </div>
          <button onClick={() => onClose()} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Symbol */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Symbol</label>
            <input
              value={symbol}
              onChange={(e) => { setSymbol(e.target.value.toUpperCase()); setError(""); }}
              placeholder="BTCUSDT, NVDA, AAPL…"
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm mono font-medium focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground placeholder:font-sans"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_SYMBOLS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSymbol(s); setError(""); }}
                  className={cn(
                    "px-2 py-0.5 rounded-md border text-[10px] mono transition-colors",
                    symbol === s
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                  )}
                >{s}</button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Condition</label>
            <div className="grid grid-cols-2 gap-1.5">
              {CONDITION_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setConditionType(c.value)}
                  className={cn(
                    "py-2 px-3 rounded-lg border text-xs font-medium transition-colors text-left",
                    conditionType === c.value
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >{c.label}</button>
              ))}
            </div>
          </div>

          {/* Threshold */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Threshold{condOpt.prefix && <span className="text-muted-foreground/60 ml-1 normal-case">(in {condOpt.prefix === "$" ? "USD" : conditionType === "rsi_above" ? "0-100" : "%"})</span>}
            </label>
            <div className="relative">
              {condOpt.prefix && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm mono">{condOpt.prefix}</span>
              )}
              <input
                value={threshold}
                onChange={(e) => { setThreshold(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder={condOpt.placeholder}
                type="number"
                className={cn(
                  "w-full bg-muted/50 border border-border rounded-lg py-2.5 text-sm mono font-medium focus:outline-none focus:ring-1 focus:ring-primary/50",
                  condOpt.prefix ? "pl-7 pr-3" : "px-3"
                )}
              />
            </div>
          </div>

          {/* Channel */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Notification Channel</label>
            <div className="grid grid-cols-2 gap-1.5">
              {CHANNEL_OPTIONS.map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannel(ch)}
                  className={cn(
                    "py-2 px-3 rounded-lg border text-xs font-medium transition-colors flex items-center gap-2",
                    channel === ch
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Bell className="w-3 h-3" />{ch}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
              {error}
            </motion.p>
          )}

          <motion.button
            onClick={submit}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold flex items-center justify-center gap-2 mt-1"
          >
            <Bell className="w-3.5 h-3.5" />
            Create Alert
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const rowVariant = { hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0, transition: { duration: 0.28 } } };
const container  = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [prefill, setPrefill] = useState<Partial<Alert> | undefined>();

  useEffect(() => {
    setAlerts(getAlerts());
    // Check if AlphaBot sent a pending alert request
    const pending = consumePendingAlert();
    if (pending) {
      setPrefill(pending);
      setShowModal(true);
    }
  }, []);

  function handleToggle(id: string) {
    setAlerts(toggleAlert(id));
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setAlerts(deleteAlert(id));
  }

  function handleModalClose(added?: Alert) {
    setShowModal(false);
    setPrefill(undefined);
    if (added) setAlerts(getAlerts());
  }

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold">Alerts</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{alerts.filter(a => a.active).length} active · click row to toggle · AlphaBot can auto-create alerts</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { setPrefill(undefined); setShowModal(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New Alert
        </motion.button>
      </motion.div>

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
          <div className="py-12 text-center text-sm text-muted-foreground">
            No alerts yet. Click <strong>+ New Alert</strong> or ask AlphaBot to create one.
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border">
            <AnimatePresence>
              {alerts.map((a) => {
                const lbl = conditionLabel(a);
                return (
                  <motion.div
                    key={a.id}
                    variants={rowVariant}
                    exit={{ opacity: 0, x: 14, transition: { duration: 0.2 } }}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.025)" }}
                    className="grid grid-cols-12 gap-2 px-4 py-3.5 items-center text-sm cursor-pointer transition-colors"
                    onClick={() => handleToggle(a.id)}
                  >
                    <span className="col-span-3 mono font-semibold text-xs">{a.symbol}</span>
                    <span className="col-span-4 text-muted-foreground text-xs">
                      {lbl.main} <span className="text-foreground mono font-medium">{lbl.bold}</span>
                    </span>
                    <span className="col-span-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Bell className="w-3 h-3 shrink-0" />{a.channel}
                    </span>
                    <div className="col-span-2 flex justify-end">
                      <motion.span
                        layout
                        className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold",
                          a.active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}
                      >
                        {a.active ? "Active" : "Off"}
                      </motion.span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={(e) => handleDelete(e, a.id)}
                        className="p-1 rounded text-muted-foreground/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
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
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl">
        <Bell className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="text-foreground font-medium">Tip:</span> Go to <strong>AI Agent</strong> and ask <em>"Set a price alert for NVDA above $960"</em> — AlphaBot will create it automatically.
        </p>
      </motion.div>

      {/* Channels */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold">Notification Channels</h3>
        {[
          { name: "Telegram Bot",   desc: "Instant push alerts · 0ms latency",  connected: false, icon: "📲" },
          { name: "Email (Resend)", desc: "Daily digest + critical alerts",      connected: true,  icon: "📧" },
        ].map((ch, i) => (
          <motion.div key={ch.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5">
              <span className="text-base">{ch.icon}</span>
              <div>
                <div className="text-sm">{ch.name}</div>
                <div className="text-xs text-muted-foreground">{ch.desc}</div>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className={cn("flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium",
                ch.connected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground hover:bg-accent")}>
              {ch.connected && <CheckCircle2 className="w-3 h-3" />}
              {ch.connected ? "Connected" : "Setup"}
            </motion.button>
          </motion.div>
        ))}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <NewAlertModal onClose={handleModalClose} prefill={prefill} />
        )}
      </AnimatePresence>
    </div>
  );
}
