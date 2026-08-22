/**
 * GET /api/signals
 * Returns ACTIVE signals from Supabase signals_generated.
 * Falls back to empty array (UI uses hardcoded SIGNALS as fallback).
 */
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    if (!supabase) return NextResponse.json({ signals: [], source: "no-db" });

    const { data, error } = await supabase
      .from("signals_generated")
      .select("*")
      .eq("status", "ACTIVE")
      .order("generated_at", { ascending: false })
      .limit(20);

    if (error || !data?.length) {
      return NextResponse.json({ signals: [], source: "empty" });
    }

    return NextResponse.json({ signals: data, source: "supabase", count: data.length });
  } catch (e) {
    return NextResponse.json({ signals: [], error: String(e) }, { status: 500 });
  }
}
