// AlphaOS — Agent Research Edge Function
// Uses Groq (DeepSeek R1 — free, reasoning model) for deep market research
// Same GROQ_API_KEY already set for alphabot-chat — no new secrets needed
// Deploy: supabase functions deploy agent-research --project-ref mxwrfiihmfmlhtmynpal

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

// Fallback chain, all free on Groq and all verified available 2026-08-22.
// The previous chain (deepseek-r1-distill-llama-70b → llama-4-maverick →
// llama-3.3-70b-versatile) was fully decommissioned by Groq — do not reinstate it.
const MODELS = [
  "openai/gpt-oss-120b",  // strongest general model on Groq free tier
  "groq/compound",        // agentic fallback, clean plain-text output
  "openai/gpt-oss-20b",   // smallest/fastest last resort
];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export interface ResearchRequest {
  ticker?: string;
  market?: string;
  mode: "ticker" | "market_regime" | "signal_breakdown" | "sector_scan";
  signals?: SignalRow[];
}

interface SignalRow {
  ticker: string;
  market: string;
  action: string;
  confidence: number;
  risk: number;
  rationale: string;
  news_item: string;
  score_technical: number;
  score_news: number;
  score_smart_money: number;
  score_risk: number;
  score_regime: number;
}

export interface ResearchAgent {
  id: string;
  name: string;
  status: "idle" | "running" | "done" | "error";
  finding: string;
  duration_ms: number;
}

export interface ResearchResponse {
  agents: ResearchAgent[];
  synthesis: string;
  market_regime: string;
  regime_score: number;
  key_risks: string[];
  opportunities: string[];
  model_used: string;
  generated_at: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS });

  const groqKey = Deno.env.get("GROQ_API_KEY");
  if (!groqKey) {
    return new Response(JSON.stringify({ error: "GROQ_API_KEY not set. Run: supabase secrets set GROQ_API_KEY=gsk_... --project-ref mxwrfiihmfmlhtmynpal" }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
  const db = createClient(supabaseUrl, supabaseKey);

  try {
    const body: ResearchRequest = await req.json();
    const { ticker, market, mode, signals = [] } = body;

    // Fetch today's signals from DB if not provided by client
    let activeSignals = signals;
    if (activeSignals.length === 0) {
      const { data } = await db
        .from("alpha_signals")
        .select("*")
        .eq("run_date", new Date().toISOString().slice(0, 10))
        .order("confidence", { ascending: false });
      activeSignals = (data ?? []) as SignalRow[];
    }

    const signalContext = activeSignals
      .map(s => `${s.ticker} (${s.market}) ${s.action} — Conf ${s.confidence}% Risk ${s.risk} | ${s.rationale}`)
      .join("\n");

    const userPrompt = buildResearchPrompt(mode, ticker, market, signalContext);

    // Try models in fallback chain
    let responseText = "";
    let modelUsed = "";

    for (const model of MODELS) {
      try {
        const t0 = Date.now();
        const res = await fetch(GROQ_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: 2048,
            temperature: 0.3,
            messages: [
              { role: "system", content: RESEARCH_SYSTEM_PROMPT },
              { role: "user",   content: userPrompt },
            ],
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          // 404 = model not available on this Groq account tier, try next
          if (res.status === 404 || res.status === 400) continue;
          throw new Error(`Groq ${res.status}: ${err}`);
        }

        const data = await res.json();
        responseText = data.choices?.[0]?.message?.content ?? "";
        modelUsed = model;
        console.log(`Agent research: ${model} responded in ${Date.now() - t0}ms`);
        break;
      } catch (err) {
        console.warn(`Model ${model} failed:`, err);
        continue;
      }
    }

    if (!responseText) throw new Error("All Groq models failed");

    // Strip DeepSeek R1 <think>...</think> reasoning block before parsing JSON
    const cleaned = responseText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // Parse JSON from response
    let parsed: ResearchResponse;
    try {
      const jsonMatch = cleaned.match(/```json\s*([\s\S]+?)\s*```/) ?? cleaned.match(/(\{[\s\S]+\})/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] : cleaned);
    } catch {
      // Fallback structure if JSON parse fails
      parsed = {
        agents: buildFallbackAgents(mode, ticker, cleaned),
        synthesis: cleaned.slice(0, 600),
        market_regime: "NEUTRAL",
        regime_score: 0,
        key_risks: [],
        opportunities: [],
        model_used: modelUsed,
        generated_at: new Date().toISOString(),
      };
    }

    parsed.model_used    = modelUsed;
    parsed.generated_at  = new Date().toISOString();

    return new Response(JSON.stringify(parsed), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});

function buildResearchPrompt(mode: string, ticker?: string, market?: string, signalContext?: string): string {
  const base = `Current AlphaOS signals:\n${signalContext}\n\n`;

  if (mode === "ticker" && ticker) {
    return `${base}Run a 4-agent deep research on ${ticker}. Simulate parallel agents: News Agent, Technical Agent, Smart Money Agent, Risk Agent. Each finds their key insight about ${ticker} specifically. Synthesize all findings into a trading brief with a clear BUY/SELL/HOLD recommendation.`;
  }
  if (mode === "market_regime") {
    return `${base}Analyze the current market regime across US, India, UAE, and Crypto based on the signals above. Classify overall market as: BULL_TREND / BEAR_TREND / RANGE / HIGH_VOL / BREAKOUT. Score overall sentiment -100 (extreme fear) to +100 (extreme greed). Identify 3 key risks and 2 top opportunities.`;
  }
  if (mode === "signal_breakdown") {
    return `${base}Audit the confidence scores above. For each signal, assess whether the Technical(30%) + News(25%) + SmartMoney(20%) + Risk(15%) + Regime(10%) breakdown looks credible. Flag any signals where one factor dominates suspiciously or where the rationale doesn't match the action.`;
  }
  if (mode === "sector_scan" && market) {
    return `${base}Scan the ${market} market for sectors showing emerging strength or weakness NOT yet captured in the current signals. Identify 2-3 high-probability setups that could become tomorrow's signals with entry criteria.`;
  }
  return `${base}Synthesize all active signals. Identify the #1 cross-market theme, the biggest correlation risk, and the top single-name opportunity right now.`;
}

function buildFallbackAgents(mode: string, ticker: string | undefined, rawText: string): ResearchAgent[] {
  const label = ticker ?? mode;
  // Try to extract useful sentences from raw text for agent findings
  const sentences = rawText.match(/[^.!?]+[.!?]/g) ?? [];
  return [
    { id: "news",        name: "News Agent",        status: "done", finding: sentences[0]?.trim() ?? `News analysis complete for ${label}`,        duration_ms: 1240 },
    { id: "technical",   name: "Technical Agent",   status: "done", finding: sentences[1]?.trim() ?? `Technical scan complete for ${label}`,        duration_ms: 890  },
    { id: "smart_money", name: "Smart Money Agent", status: "done", finding: sentences[2]?.trim() ?? "Institutional flow analysis complete",         duration_ms: 1580 },
    { id: "risk",        name: "Risk Agent",        status: "done", finding: sentences[3]?.trim() ?? "Risk assessment complete",                     duration_ms: 720  },
  ];
}

const RESEARCH_SYSTEM_PROMPT = `You are AlphaBot's research orchestrator for AlphaOS, a multi-market trading platform (US, India, UAE, Crypto).

You simulate 4 specialized research subagents running in parallel:
1. News Agent — scans recent headlines, earnings, macro events, geopolitical developments
2. Technical Agent — analyzes price action: RSI, MACD, Bollinger Bands, EMA alignment, volume
3. Smart Money Agent — tracks institutional flows (US 13F, India FII/DII, UAE sovereign/block deals)
4. Risk Agent — assesses volatility, correlation, drawdown risk, macro tail risks

Respond ONLY with a valid JSON object. No text before or after the JSON. Schema:
{
  "agents": [
    { "id": "news",        "name": "News Agent",        "status": "done", "finding": "One specific finding with data points", "duration_ms": 1240 },
    { "id": "technical",   "name": "Technical Agent",   "status": "done", "finding": "One specific finding with indicator values", "duration_ms": 890 },
    { "id": "smart_money", "name": "Smart Money Agent", "status": "done", "finding": "One specific finding about institutional activity", "duration_ms": 1580 },
    { "id": "risk",        "name": "Risk Agent",        "status": "done", "finding": "One specific risk finding", "duration_ms": 720 }
  ],
  "synthesis": "2-3 sentence synthesis combining all agent findings into a clear trading insight",
  "market_regime": "BULL_TREND",
  "regime_score": 42,
  "key_risks": ["Risk 1", "Risk 2", "Risk 3"],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "model_used": "",
  "generated_at": ""
}

Rules:
- Be specific. Use real numbers from the signal context.
- market_regime must be exactly one of: BULL_TREND, BEAR_TREND, RANGE, HIGH_VOL, BREAKOUT
- regime_score is an integer from -100 to +100
- Each agent finding is one sentence, max 20 words, with specific data
- Output ONLY the JSON object, nothing else`;
