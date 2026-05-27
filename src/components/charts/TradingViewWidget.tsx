"use client";
import { useEffect, useRef } from "react";

interface Props {
  symbol?: string;
  height?: number | string;
}

declare global {
  interface Window {
    TradingView: { widget: new (config: Record<string, unknown>) => void };
  }
}

export default function TradingViewWidget({ symbol = "NASDAQ:AAPL", height = "100%" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<unknown>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const existing = document.getElementById("tradingview-script");
    const init = () => {
      if (!container || !window.TradingView) return;
      container.innerHTML = "";
      widgetRef.current = new window.TradingView.widget({
        symbol,
        interval: "D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#0d0f14",
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: container.id,
        backgroundColor: "rgba(13, 15, 20, 1)",
        gridColor: "rgba(255, 255, 255, 0.05)",
        width: "100%",
        height: "100%",
        hide_side_toolbar: false,
        withdateranges: true,
        studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
      });
    };

    if (existing) {
      init();
    } else {
      const script = document.createElement("script");
      script.id = "tradingview-script";
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
    }
  }, [symbol]);

  return (
    <div
      id="tv-widget-container"
      ref={containerRef}
      style={{ height, width: "100%" }}
      className="rounded-xl overflow-hidden"
    />
  );
}
