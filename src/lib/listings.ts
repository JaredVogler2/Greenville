/**
 * The analysis pipeline: raw `Listing[]` → enriched, scored, ranked
 * `AnalyzedHome[]`. This is the single source of truth the UI and the
 * Excel exporter both consume.
 */

import type { AnalyzedHome, Listing } from "./types";
import { analyzeMortgage, type MortgageOptions } from "./mortgage";
import { scoreHome } from "./scoring";
import { analyzeCommute, analyzeFlood, analyzeInsurance } from "./analysis";
import { buildInsight } from "./insight";
import { getListingSource, type ListingQuery } from "./data-sources";

/** Analyze a single listing under a set of mortgage assumptions. */
export function analyzeListing(listing: Listing, opts: MortgageOptions = {}): Omit<AnalyzedHome, "rank"> {
  const mortgage = analyzeMortgage(listing, opts);
  const score = scoreHome(listing, mortgage, opts.profile);
  const insurance = analyzeInsurance(listing);
  const flood = analyzeFlood(listing);
  const commute = analyzeCommute(listing);
  const insight = buildInsight(listing, mortgage, score);

  return {
    listing,
    mortgage,
    score,
    insurance,
    flood,
    commute,
    pricePerSqft: Math.round(listing.price / listing.sqft),
    homeAge: new Date().getFullYear() - listing.yearBuilt,
    insight,
  };
}

/** Analyze a full set and assign ranks (1 = best overall score). */
export function analyzeAll(listings: Listing[], opts: MortgageOptions = {}): AnalyzedHome[] {
  const analyzed = listings.map((l) => analyzeListing(l, opts));
  analyzed.sort((a, b) => b.score.overall - a.score.overall);
  return analyzed.map((h, i) => ({ ...h, rank: i + 1 }));
}

/** Fetch from the active data source and analyze. Used by API routes. */
export async function getAnalyzedHomes(
  query?: ListingQuery,
  opts: MortgageOptions = {},
): Promise<AnalyzedHome[]> {
  const source = getListingSource();
  const listings = await source.fetchListings(query);
  return analyzeAll(listings, opts);
}
