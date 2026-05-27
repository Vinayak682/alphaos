/**
 * GET /api/quotes?symbols=AAPL,NVDA,TSLA&market=US
 * Free-tier safe — uses daily aggregates, not snapshots.
 * Runs all symbols in parallel; missing ones return null (filtered out).
 */
import { NextRequest, NextResponse } from "next/server";
import { getBatchQuotes } from "@/lib/polygon";

export async function GET(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get("symbols") ?? "";
  const market       = (req.nextUrl.searchParams.get("market") ?? "US") as "US" | "CRYPTO";

  if (!symbolsParam) {
    return NextResponse.json({ error: "symbols param required" }, { status: 400 });
  }

  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 20); // hard cap — prevent abuse

  try {
    const quotes = await getBatchQuotes(symbols, market);

    return NextResponse.json(
      { quotes, count: quotes.length, market },
      {
        headers: {
          // Cache 60s on CDN, serve stale for another 120s while revalidating
          "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/quotes]", message);
    return NextResponse.json({ error: message, quotes: [] }, { status: 500 });
  }
}
