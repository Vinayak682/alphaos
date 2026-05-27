/**
 * GET /api/market-status
 * Returns whether NYSE is currently open
 */
import { NextResponse } from "next/server";
import { getMarketStatus } from "@/lib/polygon";

export async function GET() {
  try {
    const status = await getMarketStatus();
    return NextResponse.json(status, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    });
  } catch {
    return NextResponse.json({ market: "unknown", open: false });
  }
}
