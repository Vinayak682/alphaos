export type AlertCondition = "price_above" | "price_below" | "rsi_above" | "drawdown_above";
export type AlertChannel = "Telegram" | "Email";

export interface Alert {
  id: string;
  symbol: string;
  conditionType: AlertCondition;
  threshold: number;
  channel: AlertChannel;
  active: boolean;
  createdAt: string;
}

const KEY = "alphaos_alerts";
const PENDING_KEY = "alphaos_pending_alert";

const DEFAULTS: Alert[] = [
  { id: "1", symbol: "BTCUSDT",  conditionType: "price_above",    threshold: 110000, channel: "Telegram", active: true,  createdAt: "2026-05-01" },
  { id: "2", symbol: "NVDA",     conditionType: "price_below",    threshold: 850,    channel: "Email",    active: true,  createdAt: "2026-05-10" },
  { id: "3", symbol: "AAPL",     conditionType: "rsi_above",      threshold: 70,     channel: "Telegram", active: false, createdAt: "2026-05-15" },
  { id: "4", symbol: "SPY",      conditionType: "drawdown_above", threshold: 5,      channel: "Email",    active: true,  createdAt: "2026-05-20" },
];

export function getAlerts(): Alert[] {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const stored = localStorage.getItem(KEY);
    return stored ? JSON.parse(stored) : DEFAULTS;
  } catch { return DEFAULTS; }
}

function saveAlerts(alerts: Alert[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(alerts));
}

export function addAlert(data: Omit<Alert, "id" | "createdAt">): Alert {
  const existing = getAlerts();
  const alert: Alert = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString().split("T")[0],
  };
  saveAlerts([...existing, alert]);
  return alert;
}

export function toggleAlert(id: string): Alert[] {
  const updated = getAlerts().map((a) => (a.id === id ? { ...a, active: !a.active } : a));
  saveAlerts(updated);
  return updated;
}

export function deleteAlert(id: string): Alert[] {
  const updated = getAlerts().filter((a) => a.id !== id);
  saveAlerts(updated);
  return updated;
}

export function conditionLabel(a: Alert): { main: string; bold: string } {
  switch (a.conditionType) {
    case "price_above":    return { main: "Price above",  bold: `$${a.threshold.toLocaleString()}` };
    case "price_below":    return { main: "Price below",  bold: `$${a.threshold.toLocaleString()}` };
    case "rsi_above":      return { main: "RSI >",        bold: `${a.threshold}` };
    case "drawdown_above": return { main: "Drawdown >",   bold: `${a.threshold}%` };
  }
}

// Agent page → alerts page handoff
export function setPendingAlert(symbol: string, conditionType: AlertCondition, threshold: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_KEY, JSON.stringify({ symbol, conditionType, threshold }));
}

export function consumePendingAlert(): Partial<Alert> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    localStorage.removeItem(PENDING_KEY);
    return JSON.parse(raw);
  } catch { return null; }
}
