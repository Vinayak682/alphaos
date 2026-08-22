/**
 * /api/paper-trades
 * GET  — fetch open positions (refreshes prices first) + portfolio summary
 * POST — open a new paper position (deducts cost from cash)
 * PATCH — close a position OR bulk-refresh prices (positionId omitted)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const DEMO_USER    = "00000000-0000-0000-0000-000000000001";
const FINNHUB_KEY  = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";

function svc() {
  const c = getServiceClient();
  if (!c) throw new Error("Supabase service client not available");
  return c;
}

// ─── Price fetching per market ────────────────────────────────────────────────
async function fetchLivePrice(symbol: string, market: string): Promise<number | null> {
  try {
    if (market === "CRYPTO") {
      const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, { next: { revalidate: 0 } });
      if (!r.ok) return null;
      const d = await r.json();
      return parseFloat(d.price);
    }
    if (market === "US") {
      const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`, { next: { revalidate: 0 } });
      if (!r.ok) return null;
      const d = await r.json();
      return d.c > 0 ? d.c : null;
    }
    // INDIA / UAE — Yahoo Finance
    const ticker = market === "INDIA" ? `${symbol}.NS` : `${symbol}.AE`;
    const r = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`, { next: { revalidate: 0 } });
    if (!r.ok) return null;
    const d = await r.json();
    return d?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null;
  } catch { return null; }
}

async function refreshPositionPrices(positions: { id: string; symbol: string; market: string }[]) {
  if (!positions.length) return;
  const db = svc();
  await Promise.allSettled(
    positions.map(async (pos) => {
      const price = await fetchLivePrice(pos.symbol, pos.market);
      if (price && price > 0) {
        await db.from("paper_positions").update({ current_price: price }).eq("id", pos.id);
      }
    })
  );
}

// ─── GET /api/paper-trades ──────────────────────────────────────────────────
export async function GET() {
  try {
    const db = svc();

    const [portRes, posRes] = await Promise.all([
      db.from("paper_portfolios").select("*").eq("user_id", DEMO_USER).single(),
      db.from("paper_positions")
        .select("*")
        .eq("user_id", DEMO_USER)
        .eq("status", "OPEN")
        .order("opened_at", { ascending: false }),
    ]);

    const positions = posRes.data ?? [];

    // Refresh live prices in the background (non-blocking — best effort)
    if (positions.length > 0) {
      refreshPositionPrices(positions.map((p) => ({ id: p.id, symbol: p.symbol, market: p.market })))
        .catch(() => null);
    }

    // Re-fetch after refresh so caller gets fresh prices
    const { data: freshPositions } = await db
      .from("paper_positions")
      .select("*")
      .eq("user_id", DEMO_USER)
      .eq("status", "OPEN")
      .order("opened_at", { ascending: false });

    return NextResponse.json({
      portfolio: portRes.data ?? null,
      positions: freshPositions ?? positions,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// ─── POST /api/paper-trades ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, name, market, side, quantity, entryPrice, stopLoss, takeProfit, currency } = body;

    if (!symbol || !side || !quantity || !entryPrice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = svc();
    const cost = side === "LONG" ? quantity * entryPrice : 0; // SHORT doesn't deduct full cost

    // Get portfolio cash
    const { data: port, error: portErr } = await db
      .from("paper_portfolios")
      .select("cash_balance")
      .eq("user_id", DEMO_USER)
      .single();

    if (portErr || !port) {
      return NextResponse.json({ error: "Portfolio not found — run migration 004" }, { status: 404 });
    }

    if (side === "LONG" && port.cash_balance < cost) {
      return NextResponse.json({ error: "Insufficient cash balance" }, { status: 400 });
    }

    // Insert position
    const { data: pos, error: posErr } = await db.from("paper_positions").insert({
      user_id: DEMO_USER,
      symbol: symbol.toUpperCase(),
      name: name ?? symbol.toUpperCase(),
      market: market ?? "US",
      side,
      quantity,
      entry_price: entryPrice,
      current_price: entryPrice,
      stop_loss: stopLoss ?? null,
      take_profit: takeProfit ?? null,
      currency: currency ?? "$",
      status: "OPEN",
    }).select().single();

    if (posErr) return NextResponse.json({ error: posErr.message }, { status: 500 });

    // Deduct cash
    const newCash = side === "LONG" ? port.cash_balance - cost : port.cash_balance;
    await db.from("paper_portfolios").update({ cash_balance: newCash }).eq("user_id", DEMO_USER);

    // Log trade
    await db.from("paper_trade_log").insert({
      user_id: DEMO_USER,
      position_id: pos.id,
      action: "OPEN",
      symbol: symbol.toUpperCase(),
      market: market ?? "US",
      side,
      quantity,
      price: entryPrice,
      cash_before: port.cash_balance,
      cash_after: newCash,
    });

    return NextResponse.json({ position: pos, cashBalance: newCash });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// ─── PATCH /api/paper-trades ─────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const { positionId, closePrice } = await req.json();
    if (!positionId || !closePrice) {
      return NextResponse.json({ error: "positionId and closePrice required" }, { status: 400 });
    }

    const db = svc();

    const { data: pos } = await db
      .from("paper_positions")
      .select("*")
      .eq("id", positionId)
      .eq("user_id", DEMO_USER)
      .single();

    if (!pos) return NextResponse.json({ error: "Position not found" }, { status: 404 });

    const pnl =
      pos.side === "LONG"
        ? (closePrice - pos.entry_price) * pos.quantity
        : (pos.entry_price - closePrice) * pos.quantity;
    const pnlPct =
      pos.side === "LONG"
        ? ((closePrice - pos.entry_price) / pos.entry_price) * 100
        : ((pos.entry_price - closePrice) / pos.entry_price) * 100;

    // Close position
    await db.from("paper_positions").update({
      status: "CLOSED",
      close_price: closePrice,
      current_price: closePrice,
      pnl,
      pnl_pct: pnlPct,
      closed_at: new Date().toISOString(),
    }).eq("id", positionId);

    // Return proceeds to cash
    const { data: port } = await db
      .from("paper_portfolios")
      .select("cash_balance")
      .eq("user_id", DEMO_USER)
      .single();

    const returnAmt = pos.side === "LONG" ? closePrice * pos.quantity : pos.quantity * pos.entry_price;
    const newCash = (port?.cash_balance ?? 0) + returnAmt;
    await db.from("paper_portfolios").update({ cash_balance: newCash }).eq("user_id", DEMO_USER);

    // Log
    await db.from("paper_trade_log").insert({
      user_id: DEMO_USER,
      position_id: positionId,
      action: "CLOSE",
      symbol: pos.symbol,
      market: pos.market,
      side: pos.side,
      quantity: pos.quantity,
      price: closePrice,
      cash_before: port?.cash_balance,
      cash_after: newCash,
    });

    return NextResponse.json({ pnl, pnlPct, cashBalance: newCash });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
