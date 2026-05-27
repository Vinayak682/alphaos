/**
 * GET /api/candles?symbol=AAPL&timespan=day&from=2024-01-01&to=2024-12-31&multiplier=1
 */
import { NextRequest, NextResponse } from "next/server";
import { getCandles } from "@/lib/polygon";

export async function GET(req: NextRequest) {
  const p         = req.nextUrl.searchParams;
  const symbol    = p.get("symbol") ?? "";
  const timespan  = (p.get("timespan") ?? "day") as "minute" | "hour" | "day" | "week";
  const multiplier = Number(p.get("multiplier") ?? "1");

  // Default: last 90 days
  const to   = p.get("to")   ?? new Date().toISOString().slice(0, 10);
  const from = p.get("from") ?? new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  try {
    const candles = await getCandles(symbol.toUpperCase(), timespan, from, to, multiplier);
    return NextResponse.json(
      { symbol: symbol.toUpperCase(), candles },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, candles: [] }, { status: 500 });
  }
}
