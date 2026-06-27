/**
 * LLM seam for the generated listing narrative.
 *
 * The app ships with a deterministic, key-free generator (`buildInsight` in
 * lib/insight.ts) so it works out of the box. To use a real model (the spec
 * suggests GPT; Claude works equally well), implement `LlmInsightProvider`
 * and call it from the analysis pipeline. The model receives the same
 * structured facts the rules engine uses and must return the `HomeInsight`
 * shape — so the rest of the app is unaffected by the swap.
 *
 * Example (pseudo-code, server-side only — never expose keys to the client):
 *
 *   const res = await fetch("https://api.anthropic.com/v1/messages", {
 *     method: "POST",
 *     headers: {
 *       "x-api-key": process.env.ANTHROPIC_API_KEY!,
 *       "anthropic-version": "2023-06-01",
 *       "content-type": "application/json",
 *     },
 *     body: JSON.stringify({
 *       model: "claude-opus-4-8",
 *       max_tokens: 700,
 *       system: SYSTEM_PROMPT,
 *       messages: [{ role: "user", content: JSON.stringify(facts) }],
 *     }),
 *   });
 *   // parse the JSON the model returns into HomeInsight
 */

import type { AnalyzedHome, HomeInsight } from "../types";

export interface LlmInsightProvider {
  readonly name: string;
  summarize(home: AnalyzedHome): Promise<HomeInsight>;
}

export const SYSTEM_PROMPT = `You are a Charleston, SC real-estate analyst advising a family relocating
from Greenville. Given a home's structured data and computed analysis, return STRICT JSON matching:
{ "summary": string, "pros": string[], "cons": string[], "risks": string[],
  "negotiation": string, "offerRecommendation": string }.
Be objective and specific. Prioritize: budget fit ($3,100–3,300/mo), schools, a short CHS-airport
commute (the buyer is a commuting airline pilot), flood risk, resale value and home condition.`;

/** Facts payload to send a real model (keeps the prompt provider-agnostic). */
export function insightFacts(home: AnalyzedHome) {
  return {
    listing: home.listing,
    monthlyPayment: Math.round(home.mortgage.totalMonthly),
    score: home.score,
    flood: home.flood,
    commute: home.commute,
    pricePerSqft: home.pricePerSqft,
  };
}
