"use client";
import TradingViewWidget from "@/components/charts/TradingViewWidget";
import { useStore } from "@/store/useStore";

const SYMBOL_MAP: Record<string, string> = {
  AAPL:        "NASDAQ:AAPL",
  NVDA:        "NASDAQ:NVDA",
  TSLA:        "NASDAQ:TSLA",
  BTCUSDT:     "BINANCE:BTCUSDT",
  ETHUSDT:     "BINANCE:ETHUSDT",
  "RELIANCE.NS": "NSE:RELIANCE",
  "TCS.NS":    "NSE:TCS",
  SPY:         "AMEX:SPY",
};

export default function ChartsPage() {
  const { selectedSymbol, setSelectedSymbol } = useStore();
  const tv = SYMBOL_MAP[selectedSymbol] ?? `NASDAQ:${selectedSymbol}`;

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      {/* Symbol quick picks */}
      <div className="flex items-center gap-2 flex-wrap">
        {Object.keys(SYMBOL_MAP).map((sym) => (
          <button
            key={sym}
            onClick={() => setSelectedSymbol(sym)}
            className={`px-3 py-1 rounded-md text-xs mono transition-colors border ${
              selectedSymbol === sym
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
          >
            {sym}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-border">
        <TradingViewWidget symbol={tv} height="100%" />
      </div>
    </div>
  );
}
