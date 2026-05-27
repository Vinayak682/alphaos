"use client";
import { create } from "zustand";
import type { Market } from "@/lib/constants";

interface Signal {
  id: string;
  symbol: string;
  action: "BUY" | "SELL" | "CLOSE";
  price: number;
  strategy: string;
  confidence: number;
  market: Market;
  ts: string;
}

interface AppState {
  activeMarket: Market;
  setActiveMarket: (m: Market) => void;
  selectedSymbol: string;
  setSelectedSymbol: (s: string) => void;
  signals: Signal[];
  addSignal: (s: Signal) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useStore = create<AppState>((set) => ({
  activeMarket: "US",
  setActiveMarket: (m) => set({ activeMarket: m }),
  selectedSymbol: "AAPL",
  setSelectedSymbol: (s) => set({ selectedSymbol: s }),
  signals: [],
  addSignal: (s) =>
    set((state) => ({ signals: [s, ...state.signals].slice(0, 50) })),
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
