"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OpenTradeParams } from "@/hooks/usePaperPortfolio";

const MARKET_CURRENCIES: Record<string, string> = {
  US: "$",
  CRYPTO: "$",
  INDIA: "₹",
  UAE: "د.إ",
};

const DEFAULT_SYMBOLS: Record<string, string[]> = {
  US: ["AAPL", "NVDA", "MSFT", "TSLA", "META", "AMZN", "GOOGL"],
  CRYPTO: ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"],
  INDIA: ["RELIANCE", "TCS", "HDFCBANK", "INFY", "TITAN"],
  UAE: ["FAB", "EMAAR", "ADNOCGAS", "DIB", "ALDAR"],
};

interface TradeModalProps {
  open: boolean;
  onClose: () => void;
  onTrade: (params: OpenTradeParams) => Promise<{ ok: boolean; error?: string }>;
  cashBalance: number;
  prefillSymbol?: string;
  prefillMarket?: string;
  prefillPrice?: number;
  prefillSide?: "LONG" | "SHORT";
  prefillSL?: number;
  prefillTP?: number;
}

export default function TradeModal({
  open, onClose, onTrade, cashBalance, prefillSymbol, prefillMarket,
  prefillPrice, prefillSide, prefillSL, prefillTP,
}: TradeModalProps) {
  const [market, setMarket] = useState(prefillMarket ?? "US");
  const [symbol, setSymbol] = useState(prefillSymbol ?? "");
  const [side, setSide] = useState<"LONG" | "SHORT">(prefillSide ?? "LONG");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState(prefillPrice ? String(prefillPrice) : "");
  const [stopLoss, setStopLoss] = useState(prefillSL ? String(prefillSL) : "");
  const [takeProfit, setTakeProfit] = useState(prefillTP ? String(prefillTP) : "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const currency = MARKET_CURRENCIES[market] ?? "$";
  const cost = parseFloat(quantity || "0") * parseFloat(price || "0");
  const maxQty = price ? Math.floor(cashBalance / parseFloat(price)) : 0;
  const rr =
    stopLoss && takeProfit && price
      ? Math.abs(parseFloat(takeProfit) - parseFloat(price)) /
        Math.abs(parseFloat(price) - parseFloat(stopLoss))
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!symbol || !quantity || !price) return;
    setLoading(true);
    setResult(null);
    const res = await onTrade({
      symbol: symbol.toUpperCase(),
      market,
      side,
      quantity: parseFloat(quantity),
      entryPrice: parseFloat(price),
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      currency,
    });
    setLoading(false);
    if (res.ok) {
      setResult({ ok: true, msg: `${side} ${quantity} ${symbol.toUpperCase()} @ ${currency}${price}` });
      setTimeout(() => { setResult(null); onClose(); }, 1800);
    } else {
      setResult({ ok: false, msg: res.error ?? "Trade failed" });
    }
  }

  function reset() {
    setSymbol(prefillSymbol ?? ""); setQuantity(""); setPrice("");
    setStopLoss(""); setTakeProfit(""); setResult(null);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { reset(); onClose(); }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md bg-[oklch(0.11_0.01_240)] border border-border rounded-2xl overflow-hidden shadow-2xl"
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="font-heading font-bold text-base">New Paper Trade</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Cash: <span className="mono text-primary">${cashBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </p>
              </div>
              <button onClick={() => { reset(); onClose(); }} className="p-1.5 rounded-lg hover:bg-muted/40 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Market selector */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Market</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {["US", "INDIA", "UAE", "CRYPTO"].map((m) => (
                    <button key={m} type="button" onClick={() => { setMarket(m); setSymbol(""); }}
                      className={cn(
                        "py-1.5 rounded-lg text-xs font-semibold transition-all",
                        market === m ? "bg-primary text-black" : "bg-muted/40 text-muted-foreground hover:text-foreground"
                      )}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Symbol + Side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Symbol</label>
                  <input
                    list="symbols-list"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. AAPL"
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm mono font-bold uppercase focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                  <datalist id="symbols-list">
                    {(DEFAULT_SYMBOLS[market] ?? []).map((s) => <option key={s} value={s} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Side</label>
                  <div className="grid grid-cols-2 gap-1.5 h-[38px]">
                    <button type="button" onClick={() => setSide("LONG")}
                      className={cn("rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all",
                        side === "LONG" ? "bg-primary/20 text-primary border border-primary/40" : "bg-muted/30 text-muted-foreground border border-transparent hover:border-border"
                      )}>
                      <TrendingUp className="w-3 h-3" /> LONG
                    </button>
                    <button type="button" onClick={() => setSide("SHORT")}
                      className={cn("rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all",
                        side === "SHORT" ? "bg-destructive/20 text-destructive border border-destructive/40" : "bg-muted/30 text-muted-foreground border border-transparent hover:border-border"
                      )}>
                      <TrendingDown className="w-3 h-3" /> SHORT
                    </button>
                  </div>
                </div>
              </div>

              {/* Entry price + Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Entry Price ({currency})
                  </label>
                  <input type="number" step="any" value={price} onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00" required
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm mono focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Quantity {price && side === "LONG" && <span className="text-muted-foreground">(max {maxQty})</span>}
                  </label>
                  <input type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0" required
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm mono focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Stop Loss + Take Profit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Stop Loss ({currency}) <span className="text-muted-foreground/60">optional</span>
                  </label>
                  <input type="number" step="any" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm mono focus:outline-none focus:border-destructive/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Take Profit ({currency}) <span className="text-muted-foreground/60">optional</span>
                  </label>
                  <input type="number" step="any" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm mono focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              {/* Order summary strip */}
              {(cost > 0 || rr) && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-muted/20 border border-border/50 rounded-xl px-4 py-3 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    {cost > 0 && (
                      <p className="text-muted-foreground">
                        Cost: <span className="mono font-bold text-foreground">{currency}{cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </p>
                    )}
                    {rr && (
                      <p className="text-muted-foreground">
                        R:R <span className={cn("mono font-bold", rr >= 2 ? "gain" : rr >= 1 ? "text-yellow-400" : "loss")}>
                          1:{rr.toFixed(2)}
                        </span>
                      </p>
                    )}
                  </div>
                  {side === "LONG" && cost > cashBalance && (
                    <div className="flex items-center gap-1 text-destructive text-[10px]">
                      <AlertTriangle className="w-3 h-3" /> Insufficient cash
                    </div>
                  )}
                </motion.div>
              )}

              {/* Result feedback */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-3 text-sm",
                      result.ok ? "bg-primary/10 text-primary border border-primary/20" : "bg-destructive/10 text-destructive border border-destructive/20"
                    )}
                  >
                    {result.ok
                      ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                      : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    <span className="text-xs">{result.msg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !symbol || !quantity || !price || (side === "LONG" && cost > cashBalance)}
                className={cn(
                  "w-full py-3 rounded-xl font-heading font-bold text-sm transition-all",
                  side === "LONG"
                    ? "bg-primary text-black hover:bg-primary/90 disabled:opacity-40"
                    : "bg-destructive text-white hover:bg-destructive/90 disabled:opacity-40"
                )}
              >
                {loading ? "Placing…" : `${side} ${symbol || "—"} ${quantity ? `× ${quantity}` : ""}`}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
