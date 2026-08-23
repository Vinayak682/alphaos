"use client";

/**
 * Institutional reference data, Supabase-first.
 *
 * src/lib/db.ts has always implemented the Supabase-first / static-fallback
 * logic, but nothing imported it — it was dead code, so the pages rendered
 * src/lib/institutions.ts regardless of what the database held. That was
 * invisible because the tables were seeded from that same file, so the numbers
 * agreed. This hook is the missing consumer.
 *
 * Each fetch* in db.ts already returns the static array on error, on an empty
 * result, or when Supabase is not configured, so this cannot render worse than
 * before. State is seeded with the static data so there is no loading flash.
 */

import { useState, useEffect } from "react";
import {
  fetchUSInstitutions, fetchIndiaInvestors, fetchUAEStocks,
  fetchStrategyParams, fetchWahaFunds, fetchSovereignFunds,
} from "@/lib/db";
import {
  US_INSTITUTIONS, INDIA_SUPERINVESTORS, UAE_DIVIDEND_STOCKS,
  STRATEGY_EXACT_PARAMS, WAHA_FUNDS, UAE_SOVEREIGN_FUNDS,
} from "@/lib/institutions";

export interface InstitutionData {
  us: typeof US_INSTITUTIONS;
  india: typeof INDIA_SUPERINVESTORS;
  uaeStocks: typeof UAE_DIVIDEND_STOCKS;
  strategyParams: typeof STRATEGY_EXACT_PARAMS;
  waha: typeof WAHA_FUNDS;
  sovereign: typeof UAE_SOVEREIGN_FUNDS;
  /** "db" once any table came back from Supabase; "static" otherwise. */
  source: "static" | "db";
  loading: boolean;
}

export function useInstitutionData(): InstitutionData {
  const [data, setData] = useState<Omit<InstitutionData, "loading">>({
    us: US_INSTITUTIONS,
    india: INDIA_SUPERINVESTORS,
    uaeStocks: UAE_DIVIDEND_STOCKS,
    strategyParams: STRATEGY_EXACT_PARAMS,
    waha: WAHA_FUNDS,
    sovereign: UAE_SOVEREIGN_FUNDS,
    source: "static",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [us, india, uaeStocks, strategyParams, waha, sovereign] =
        await Promise.all([
          fetchUSInstitutions(), fetchIndiaInvestors(), fetchUAEStocks(),
          fetchStrategyParams(), fetchWahaFunds(), fetchSovereignFunds(),
        ]);
      if (cancelled) return;

      // db.ts returns the static array by reference when it falls back, so an
      // identity check tells us whether anything actually came from Supabase.
      const fromDb =
        us !== US_INSTITUTIONS ||
        india !== INDIA_SUPERINVESTORS ||
        uaeStocks !== UAE_DIVIDEND_STOCKS ||
        strategyParams !== STRATEGY_EXACT_PARAMS;

      setData({
        // db.ts maps snake_case columns to the same camelCase shape the static
        // data uses; the cast keeps the page's existing types intact.
        us: us as typeof US_INSTITUTIONS,
        india: india as typeof INDIA_SUPERINVESTORS,
        uaeStocks: uaeStocks as typeof UAE_DIVIDEND_STOCKS,
        strategyParams: strategyParams as typeof STRATEGY_EXACT_PARAMS,
        waha: waha as typeof WAHA_FUNDS,
        sovereign: sovereign as typeof UAE_SOVEREIGN_FUNDS,
        source: fromDb ? "db" : "static",
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { ...data, loading };
}
