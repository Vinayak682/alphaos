"use client";

/**
 * Finnhub WebSocket client for real-time US stock trades.
 * Free tier: up to 50 symbols, real-time trade data.
 * Works client-side (no API route needed) — compatible with GitHub Pages.
 */

export interface FinnhubTrade {
  symbol: string;
  price:  number;
  volume: number;
  time:   number;
}

type PriceListener = (prices: Map<string, FinnhubTrade>) => void;

const WS_URL = "wss://ws.finnhub.io";

let ws: WebSocket | null = null;
let subscribedSymbols = new Set<string>();
let latestPrices = new Map<string, FinnhubTrade>();
let listeners = new Set<PriceListener>();
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 1000;

function getKey(): string {
  return typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "")
    : "";
}

function notify() {
  for (const fn of listeners) fn(latestPrices);
}

function connect() {
  const key = getKey();
  if (!key || typeof window === "undefined") return;
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  ws = new WebSocket(`${WS_URL}?token=${key}`);

  ws.onopen = () => {
    reconnectDelay = 1000;
    for (const sym of subscribedSymbols) {
      ws!.send(JSON.stringify({ type: "subscribe", symbol: sym }));
    }
  };

  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      if (msg.type === "trade" && Array.isArray(msg.data)) {
        for (const t of msg.data) {
          latestPrices.set(t.s, {
            symbol: t.s,
            price:  t.p,
            volume: t.v,
            time:   t.t,
          });
        }
        notify();
      }
    } catch { /* ignore parse errors */ }
  };

  ws.onclose = () => {
    ws = null;
    if (subscribedSymbols.size > 0 && listeners.size > 0) {
      reconnectTimer = setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
        connect();
      }, reconnectDelay);
    }
  };

  ws.onerror = () => {
    ws?.close();
  };
}

export function subscribeSymbols(symbols: string[]) {
  let changed = false;
  for (const sym of symbols) {
    if (!subscribedSymbols.has(sym)) {
      subscribedSymbols.add(sym);
      changed = true;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "subscribe", symbol: sym }));
      }
    }
  }
  if (changed && !ws) connect();
}

export function unsubscribeSymbols(symbols: string[]) {
  for (const sym of symbols) {
    subscribedSymbols.delete(sym);
    latestPrices.delete(sym);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "unsubscribe", symbol: sym }));
    }
  }
  if (subscribedSymbols.size === 0) {
    ws?.close();
    ws = null;
    if (reconnectTimer) clearTimeout(reconnectTimer);
  }
}

export function addPriceListener(fn: PriceListener) {
  listeners.add(fn);
  if (subscribedSymbols.size > 0) connect();
}

export function removePriceListener(fn: PriceListener) {
  listeners.delete(fn);
  if (listeners.size === 0 && subscribedSymbols.size === 0) {
    ws?.close();
    ws = null;
    if (reconnectTimer) clearTimeout(reconnectTimer);
  }
}

export function getLatestPrices(): Map<string, FinnhubTrade> {
  return latestPrices;
}

/**
 * Finnhub REST quote fallback — for initial load before WS delivers first trade.
 * Free tier: 60 calls/min.
 */
export async function fetchFinnhubQuote(
  symbol: string,
): Promise<{ price: number; change: number; changePct: number; high: number; low: number; open: number; prevClose: number } | null> {
  const key = getKey();
  if (!key) return null;
  try {
    const r = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${key}`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!r.ok) return null;
    const d = await r.json();
    if (!d.c || d.c === 0) return null;
    return {
      price:     d.c,
      change:    d.d  ?? 0,
      changePct: d.dp ?? 0,
      high:      d.h  ?? d.c,
      low:       d.l  ?? d.c,
      open:      d.o  ?? d.c,
      prevClose: d.pc ?? d.c,
    };
  } catch {
    return null;
  }
}

export async function fetchFinnhubBatchQuotes(
  symbols: string[],
): Promise<Map<string, { price: number; change: number; changePct: number; high: number; low: number; open: number; prevClose: number }>> {
  const results = await Promise.allSettled(symbols.map(fetchFinnhubQuote));
  const map = new Map();
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value) {
      map.set(symbols[i], r.value);
    }
  });
  return map;
}
