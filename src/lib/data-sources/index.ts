/**
 * Data-source adapter layer.
 * --------------------------------------------------------------------------
 * The spec asks for live integrations with Zillow, Realtor.com, Redfin, MLS,
 * builder feeds, County GIS, FEMA flood maps, Google Maps / Distance Matrix,
 * NOAA, tax databases, school ratings, crime stats, Walk Score and insurance
 * estimators.
 *
 * Most of those (Zillow, Redfin) have no public API, and the rest (Google
 * Distance Matrix, Walk Score, ATTOM/tax, GreatSchools) require paid keys.
 * Rather than hard-wire any one vendor, the app talks to this `ListingSource`
 * interface. A `LocalListingSource` ships a curated, realistic Charleston-
 * metro dataset so the entire app runs offline with zero keys. To go live,
 * implement `ListingSource` against real providers (see `LIVE_SOURCE_NOTES`)
 * and swap it in `getListingSource()`.
 */

import type { Listing } from "../types";
import rawListings from "../../data/listings.json";

export interface ListingQuery {
  neighborhoods?: string[];
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
}

export interface ListingSource {
  readonly name: string;
  /** Fetch raw listings (already normalized to the `Listing` shape). */
  fetchListings(query?: ListingQuery): Promise<Listing[]>;
}

/** Local provider: curated, realistic dataset bundled with the app. */
export class LocalListingSource implements ListingSource {
  readonly name = "local-curated";

  async fetchListings(query?: ListingQuery): Promise<Listing[]> {
    let listings = rawListings as unknown as Listing[];
    if (query) {
      listings = listings.filter((l) => {
        if (query.minPrice && l.price < query.minPrice) return false;
        if (query.maxPrice && l.price > query.maxPrice) return false;
        if (query.minBeds && l.bedrooms < query.minBeds) return false;
        if (query.neighborhoods?.length && !query.neighborhoods.includes(l.neighborhood)) return false;
        return true;
      });
    }
    return listings;
  }
}

let _source: ListingSource | null = null;

/** Returns the active listing source. Swap the constructor here to go live. */
export function getListingSource(): ListingSource {
  if (!_source) _source = new LocalListingSource();
  return _source;
}

/**
 * Implementation notes for wiring real providers. Each maps to fields on the
 * `Listing` type; combine them in a custom `ListingSource`.
 */
export const LIVE_SOURCE_NOTES: Record<string, string> = {
  listings:
    "Zillow/Redfin have no public API. Use a licensed MLS/RESO Web API feed, Realtor.com via a partner (e.g. Rapid/Realtor RapidAPI), or builder JSON feeds. Normalize each into `Listing`.",
  flood:
    "FEMA National Flood Hazard Layer (NFHL) ArcGIS REST service returns the flood zone for a lat/lng — populate `floodZone`/`floodHistory`.",
  commute:
    "Google Distance Matrix API with departure_time set to a weekday 3pm gives traffic-aware drive times — populate the `commute` block.",
  taxes:
    "Charleston/Berkeley/Dorchester County GIS + Auditor parcel data (or ATTOM) for assessed value and millage — populate `annualTaxes`.",
  schools:
    "GreatSchools API (or SC Dept. of Education report cards) keyed by attendance zone — populate `schools`.",
  walkscore: "Walk Score API returns walk/bike/transit scores for a lat/lng.",
  crime: "FBI Crime Data API / local sheriff feeds aggregated to a 1–10 safety index.",
  insurance:
    "No free homeowners API; estimate from replacement cost × coastal wind factor, or integrate a quote partner. NFIP rates via FEMA Risk Rating 2.0 for flood.",
  ai: "See data-sources/ai.ts — sends the structured `Listing` + analysis to an LLM for the narrative.",
};
