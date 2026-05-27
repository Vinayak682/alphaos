/**
 * GET /api/ticker?symbol=AAPL
 * Returns company name, exchange, description, logo
 */
import { NextRequest, NextResponse } from "next/server";
import { getTickerDetail } from "@/lib/polygon";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? "";
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  try {
    const detail = await getTickerDetail(symbol.toUpperCase());
    if (!detail) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(
      { detail },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
