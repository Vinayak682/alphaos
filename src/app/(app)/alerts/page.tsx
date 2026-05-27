"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Plus, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const INITIAL_ALERTS = [
  { id: "1", symbol: "BTCUSDT", condition: "Price above", threshold: "$110,000", channel: "Telegram", active: true,  triggered: "Never"     },
  { id: "2", symbol: "NVDA",    condition: "Price below", threshold: "$850",     channel: "Email",    active: true,  triggered: "2h ago"    },
  { id: "3", symbol: "AAPL",    condition: "RSI > 70",    threshold: "70",       channel: "Telegram", active: false, triggered: "Yesterday" },
  { id: "4", symbol: "SPY",     condition: "Drawdown >",  threshold: "5%",       channel: "Email",    active: true,  triggered: "Never"     },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const row = { hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } } };

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);

  const toggle = (id: string) =>
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, active: !a.active } : a));

  return (
    <div className="p-4 space-y-4 h-full overflow-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Alerts</h2>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Alert
        </motion.button>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.05 }}
        className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-border text-xs text-muted-foreground font-medium">
          <span>Symbol</span>
          <span className="col-span-2">Condition</span>
          <span>Channel</span>
          <span className="text-right">Status</span>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border">
          <AnimatePresence>
            {alerts.map((a) => (
              <motion.div key={a.id} variants={row}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.025)" }}
                className="grid grid-cols-5 gap-4 px-4 py-3.5 items-center text-sm cursor-pointer transition-colors"
                onClick={() => toggle(a.id)}>
                <span className="mono font-medium">{a.symbol}</span>
                <span className="col-span-2 text-muted-foreground">
                  {a.condition} <span className="text-foreground mono">{a.threshold}</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Bell className="w-3 h-3" />{a.channel}
                </span>
                <div className="flex justify-end">
                  <motion.span
                    layout
                    className={cn("text-xs px-2 py-0.5 rounded-full font-medium transition-colors",
                      a.active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}
                    whileTap={{ scale: 0.92 }}>
                    {a.active ? "Active" : "Off"}
                  </motion.span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Channels */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold">Notification Channels</h3>
        {[
          { name: "Telegram Bot",  desc: "Instant push alerts · 0ms latency", connected: false, icon: "📲" },
          { name: "Email (Resend)",desc: "Daily digest + critical alerts",     connected: true,  icon: "📧" },
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
    </div>
  );
}
