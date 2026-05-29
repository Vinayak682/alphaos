"use client";

export interface BinanceQuote {
  symbol:    string;
  price:     number;
  change24h: number;
  high24h:   number;
  low24h:    number;
  vol24h:    number;
}

const API = "https://api.binance.com/api/v3/ticker/24hr";

export async function fetchBinancePrices(
  symbols: string[],
): Promise<Map<string, BinanceQuote>> {
  const param = symbols.map((s) => `"${s}"`).join(",");
  const r = await fetch(`${API}?symbols=[${param}]`, {
    signal: AbortSignal.timeout(6000),
  });
  if (!r.ok) throw new Error("Binance error");

  const data: {
    symbol: string;
    lastPrice: string;
    priceChangePercent: string;
    highPrice: string;
    lowPrice: string;
    quoteVolume: string;
  }[] = await r.json();

  const map = new Map<string, BinanceQuote>();
  for (const d of data) {
    map.set(d.symbol, {
      symbol:    d.symbol,
      price:     parseFloat(d.lastPrice),
      change24h: parseFloat(d.priceChangePercent),
      high24h:   parseFloat(d.highPrice),
      low24h:    parseFloat(d.lowPrice),
      vol24h:    parseFloat(d.quoteVolume),
    });
  }
  return map;
}
