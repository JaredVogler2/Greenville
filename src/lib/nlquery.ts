/**
 * Lightweight natural-language query parser.
 *
 * Translates plain-English requests into a partial `FilterState` + sort
 * directive + optional neighborhood comparison. Deterministic and key-free;
 * the same surface could be backed by an LLM (return the identical shape).
 *
 * Handles the spec's examples, e.g.:
 *   "Show me homes under $500k with less than a 25-minute airport commute."
 *   "Find homes with the best appreciation potential."
 *   "Show only flood zone X homes."
 *   "Compare Park West vs Hanahan."
 */

import { EMPTY_FILTERS, type FilterState, type SortKey } from "./filters";
import type { FloodZone } from "./types";
import { allNeighborhoodNames } from "./neighborhoods";

export interface ParsedQuery {
  filters: Partial<FilterState>;
  sort?: { key: SortKey; dir: "asc" | "desc" };
  compareNeighborhoods?: string[];
  explanation: string;
}

function parseMoney(token: string): number {
  // "$500k", "500,000", "1.2m"
  const cleaned = token.replace(/[$,\s]/g, "").toLowerCase();
  const m = cleaned.match(/^([\d.]+)(k|m)?$/);
  if (!m) return NaN;
  let n = parseFloat(m[1]);
  if (m[2] === "k") n *= 1_000;
  if (m[2] === "m") n *= 1_000_000;
  return n;
}

export function parseQuery(raw: string): ParsedQuery {
  const q = raw.toLowerCase();
  const filters: Partial<FilterState> = {};
  const notes: string[] = [];
  let sort: ParsedQuery["sort"];

  // Compare "<A> vs <B>"
  const cmp = q.match(/compare\s+(.+?)\s+(?:vs\.?|versus|and|to)\s+(.+?)[.?!]?$/);
  if (cmp) {
    const names = allNeighborhoodNames();
    const find = (s: string) =>
      names.find((n) => n.toLowerCase() === s.trim()) ??
      names.find((n) => n.toLowerCase().includes(s.trim()) || s.trim().includes(n.toLowerCase()));
    const a = find(cmp[1]);
    const b = find(cmp[2]);
    if (a && b) {
      return {
        filters: { neighborhoods: [a, b] },
        compareNeighborhoods: [a, b],
        explanation: `Comparing ${a} vs ${b}.`,
      };
    }
  }

  // Price: "under $500k", "below 450,000", "less than $500k"
  const priceUnder = q.match(/(?:under|below|less than|<|up to|max(?:imum)?)\s*\$?([\d.,]+\s?[km]?)/);
  if (priceUnder) {
    const v = parseMoney(priceUnder[1]);
    // Distinguish price from payment by surrounding words handled below.
    if (!Number.isNaN(v) && v >= 100_000) {
      filters.priceMax = v;
      notes.push(`price ≤ $${v.toLocaleString()}`);
    }
  }
  const priceOver = q.match(/(?:over|above|more than|at least|min(?:imum)?)\s*\$?([\d.,]+\s?[km]?)/);
  if (priceOver) {
    const v = parseMoney(priceOver[1]);
    if (!Number.isNaN(v) && v >= 100_000) {
      filters.priceMin = v;
      notes.push(`price ≥ $${v.toLocaleString()}`);
    }
  }

  // Monthly payment
  const pay = q.match(/(?:payment|monthly|per month|\/mo)[^\d]*\$?([\d.,]+\s?[k]?)/);
  if (pay) {
    const v = parseMoney(pay[1]);
    if (!Number.isNaN(v) && v < 100_000) {
      filters.monthlyMax = v;
      notes.push(`payment ≤ $${v.toLocaleString()}/mo`);
    }
  }

  // Airport commute: "less than a 25-minute airport commute", "within 30 min of the airport"
  const airport = q.match(/(\d{1,2})\s*-?\s*min(?:ute)?s?[^.]*\b(?:airport|chs)\b/);
  const airport2 = q.match(/\b(?:airport|chs)\b[^.]*?(\d{1,2})\s*-?\s*min/);
  const airportMin = airport?.[1] ?? airport2?.[1];
  if (airportMin) {
    filters.airportMax = Number(airportMin);
    notes.push(`≤ ${airportMin} min to CHS`);
  }

  // Downtown commute
  const dt = q.match(/(\d{1,2})\s*-?\s*min(?:ute)?s?[^.]*\bdowntown\b/);
  if (dt) {
    filters.downtownMax = Number(dt[1]);
    notes.push(`≤ ${dt[1]} min downtown`);
  }

  // Beds / baths
  const beds = q.match(/(\d)\+?\s*(?:bed|br|bedroom)/);
  if (beds) {
    filters.bedsMin = Number(beds[1]);
    notes.push(`≥ ${beds[1]} beds`);
  }
  const baths = q.match(/(\d)\+?\s*(?:bath|ba|bathroom)/);
  if (baths) {
    filters.bathsMin = Number(baths[1]);
    notes.push(`≥ ${baths[1]} baths`);
  }

  // Square footage
  const sqft = q.match(/(\d[\d,]{2,})\s*(?:sq\s?ft|sqft|square feet)/);
  if (sqft) {
    filters.sqftMin = parseMoney(sqft[1]);
    notes.push(`≥ ${sqft[1]} sqft`);
  }

  // Year built / newer
  const year = q.match(/(?:built|newer than|after|since)\s*(?:in\s*)?(20\d{2})/);
  if (year) {
    filters.yearBuiltMin = Number(year[1]);
    notes.push(`built ${year[1]}+`);
  }

  // Garage
  if (/garage/.test(q)) {
    filters.garageMin = 1;
    notes.push("has garage");
  }

  // Flood zone: "flood zone X", "zone AE", "no flood"
  const zone = q.match(/(?:flood\s*)?zone\s*(x\s*\(shaded\)|x|ae|ve|a)\b/);
  if (zone) {
    const z = zone[1].toUpperCase().replace(/\s+/g, " ").trim() as FloodZone;
    filters.floodZones = [z === "X (SHADED)" ? ("X (shaded)" as FloodZone) : z];
    notes.push(`flood zone ${z}`);
  } else if (/\bno flood|flood[- ]?free|minimal flood\b/.test(q)) {
    filters.floodZones = ["X"];
    notes.push("flood zone X");
  }

  // Schools
  if (/(?:great|top|best|strong|excellent)\s+schools?/.test(q)) {
    filters.schoolMin = 7;
    notes.push("strong schools (≥7/10)");
  }

  // Sort intents
  if (/best appreciation|appreciation potential|appreciate/.test(q)) {
    sort = { key: "investment", dir: "desc" };
    notes.push("ranked by appreciation/investment potential");
  } else if (/best value|cheapest|lowest price/.test(q)) {
    sort = { key: "price", dir: "asc" };
    notes.push("lowest price first");
  } else if (/best schools|family|kids/.test(q)) {
    sort = { key: "family", dir: "desc" };
    notes.push("ranked by family score");
  } else if (/shortest commute|closest to (?:the )?airport|pilot/.test(q)) {
    sort = { key: "airportScore", dir: "desc" };
    notes.push("ranked by airport convenience");
  } else if (/best|top|highest score|recommend/.test(q)) {
    sort = { key: "score", dir: "desc" };
    notes.push("ranked by overall score");
  }

  const explanation = notes.length
    ? `Interpreted as: ${notes.join(", ")}.`
    : "Couldn't extract specific filters — showing all homes. Try e.g. \"under $500k within 25 min of CHS\".";

  return { filters: { ...EMPTY_FILTERS, ...filters }, sort, explanation };
}
