// POST /api/webhook/tradingview
// TradingView alert → market_signals table
//
// TradingView alert message format (JSON body):
// { "ticker": "AAPL", "action": "buy", "price": 189.50,
//   "strategy_id": "golden-cross", "timeframe": "1D",
//   "entry_price": 189.50, "stop_loss": 181.00,
//   "target_1": 198.00, "target_2": 210.00, "confidence": 82 }
//
// Security: Set WEBHOOK_SECRET in .env.local and in TradingView alert URL:
//   POST https://your-domain.com/api/webhook/tradingview?secret=YOUR_SECRET
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MARKET_MAP: Record<string, string> = {
  AAPL: "US", NVDA: "US", MSFT: "US", TSLA: "US", AMZN: "US",
  GOOGL: "US", META: "US", SPY: "US", QQQ: "US",
  RELIANCE: "INDIA", HDFCBANK: "INDIA", TCS: "INDIA", INFY: "INDIA",
  SBIN: "INDIA", ICICIBANK: "INDIA", WIPRO: "INDIA",
  EMAAR: "UAE", FAB: "UAE", ADNOCGAS: "UAE", DEWA: "UAE", EMIRATESNBD: "UAE",
  BTCUSDT: "CRYPTO", ETHUSDT: "CRYPTO", SOLUSDT: "CRYPTO",
};

function detectMarket(ticker: string): string {
  const upper = ticker.toUpperCase().replace(/\.(NS|BO|DFM|ADX)$/, "");
  return MARKET_MAP[upper] ?? (ticker.endsWith(".NS") || ticker.endsWith(".BO") ? "INDIA"
    : ticker.endsWith(".DFM") || ticker.endsWith(".ADX") ? "UAE" : "US");
}

export async function POST(req: NextRequest) {
  // Validate webhook secret
  const secret = req.nextUrl.searchParams.get("secret") ?? req.headers.get("x-webhook-secret");
  const expected = process.env.WEBHOOK_SECRET;
  if (expected && secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse payload
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ticker     = String(body.ticker ?? "").toUpperCase().trim();
  const rawAction  = String(body.action ?? "").toUpperCase().trim();
  const price      = body.price != null ? Number(body.price) : null;
  const strategyId = body.strategy_id ? String(body.strategy_id) : null;
  const notes      = body.notes ? String(body.notes) : null;

  if (!ticker || !rawAction) {
    return NextResponse.json({ error: "ticker and action are required" }, { status: 400 });
  }

  // Normalise action to schema enum
  const ACTION_MAP: Record<string, string> = {
    BUY: "BUY", LONG: "BUY", SELL: "SELL", SHORT: "SELL",
    EXIT: "CLOSE", CLOSE: "CLOSE", WATCH: "WATCH",
  };
  const action = ACTION_MAP[rawAction] ?? "WATCH";
  const market = detectMarket(ticker);

  // Write to Supabase with service role key (bypasses RLS)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("market_signals")
    .insert({
      symbol:       ticker,
      market,
      action,
      price,
      strategy_id:  strategyId,
      confidence:   body.confidence != null ? Number(body.confidence) : null,
      entry_price:  body.entry_price != null ? Number(body.entry_price) : price,
      stop_loss:    body.stop_loss   != null ? Number(body.stop_loss)   : null,
      target_1:     body.target_1    != null ? Number(body.target_1)    : null,
      target_2:     body.target_2    != null ? Number(body.target_2)    : null,
      notes,
      active:       true,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id, ticker, action, market });
}
