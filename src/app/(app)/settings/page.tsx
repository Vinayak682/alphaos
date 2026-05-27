"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { RISK_LEVELS, RISK_COLORS } from "@/lib/constants";
import { useState } from "react";
import { CheckCircle2, Link, Unlink } from "lucide-react";

const BROKERS = [
  { name: "Alpaca Markets",      market: "🇺🇸 US",     status: "connected",     mode: "Paper" },
  { name: "Zerodha Kite",        market: "🇮🇳 India",  status: "not_connected", mode: "—"     },
  { name: "Dhan",                market: "🇮🇳 India",  status: "not_connected", mode: "—"     },
  { name: "Interactive Brokers", market: "🇦🇪 UAE",    status: "not_connected", mode: "—"     },
  { name: "Binance",             market: "₿ Crypto",  status: "not_connected", mode: "—"     },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } } };

export default function SettingsPage() {
  const [risk, setRisk] = useState<string>("MEDIUM");

  return (
    <div className="p-4 space-y-5 h-full overflow-auto max-w-2xl">
      <motion.h2 initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="text-base font-semibold">Settings
      </motion.h2>

      {/* Risk profile */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
        className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold">Risk Appetite</h3>
        <div className="grid grid-cols-4 gap-2">
          {RISK_LEVELS.map((level) => (
            <motion.button key={level} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => setRisk(level)}
              className={cn(
                "py-2 rounded-lg border text-xs font-semibold transition-all duration-200",
                risk === level
                  ? "border-primary bg-primary/15 " + RISK_COLORS[level] + " shadow-[0_0_15px_-4px_rgba(0,220,130,0.4)]"
                  : "border-border text-muted-foreground hover:border-foreground/20"
              )}>
              {level}
            </motion.button>
          ))}
        </div>
        <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
          {[["Max Drawdown Limit","10%"],["Max Position Size","$5,000"],["Position Sizing","Kelly Criterion"]].map(([k,v]) => (
            <div key={k} className="flex justify-between">
              <span>{k}</span><span className="text-foreground mono">{v}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Brokers */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
        className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Broker Connections</h3>
        </div>
        <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border">
          {BROKERS.map((b) => (
            <motion.div key={b.name} variants={item}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
              className="flex items-center gap-3 px-4 py-3 text-sm transition-colors">
              <motion.div
                className={cn("w-2 h-2 rounded-full shrink-0", b.status === "connected" ? "bg-primary" : "bg-muted-foreground")}
                animate={b.status === "connected" ? { scale: [1,1.4,1], opacity:[1,0.5,1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="flex-1">
                <div className="font-medium">{b.name}</div>
                <div className="text-xs text-muted-foreground">{b.market} · {b.mode}</div>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                className={cn("flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  b.status === "connected"
                    ? "bg-muted text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                    : "bg-primary/15 text-primary hover:bg-primary/25")}>
                {b.status === "connected" ? <><Unlink className="w-3 h-3" />Disconnect</> : <><Link className="w-3 h-3" />Connect</>}
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Notifications */}
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}
        className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold">Notifications</h3>
        {[
          { label:"Telegram Bot",  desc:"Instant trade alerts",          connected: false, emoji:"📲" },
          { label:"Email (Resend)",desc:"Daily summary + critical alerts",connected: true,  emoji:"📧" },
        ].map((n) => (
          <div key={n.label} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5">
              <span className="text-base">{n.emoji}</span>
              <div>
                <div className="text-sm">{n.label}</div>
                <div className="text-xs text-muted-foreground">{n.desc}</div>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className={cn("flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium",
                n.connected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground hover:bg-accent")}>
              {n.connected && <CheckCircle2 className="w-3 h-3" />}
              {n.connected ? "Connected" : "Setup"}
            </motion.button>
          </div>
        ))}
      </motion.section>
    </div>
  );
}
