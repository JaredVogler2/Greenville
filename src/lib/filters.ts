/**
 * Filter state shared by the filter panel, the table and the NL search bar,
 * plus the pure function that applies it to a set of analyzed homes.
 */

import type { AnalyzedHome, FloodZone, Recommendation } from "./types";

export interface FilterState {
  priceMin: number | null;
  priceMax: number | null;
  monthlyMax: number | null;
  yearBuiltMin: number | null;
  sqftMin: number | null;
  bedsMin: number | null;
  bathsMin: number | null;
  garageMin: number | null;
  neighborhoods: string[];
  floodZones: FloodZone[];
  hoaMax: number | null;
  airportMax: number | null; // minutes
  downtownMax: number | null; // minutes
  schoolMin: number | null; // avg rating 1–10
  ageMax: number | null; // years
  lotMin: number | null; // acres
  scoreMin: number | null;
  recommendations: Recommendation[];
  text: string;
}

export type SortKey =
  | "rank"
  | "price"
  | "monthly"
  | "score"
  | "ppsf"
  | "sqft"
  | "yearBuilt"
  | "airport"
  | "downtown"
  | "investment"
  | "family"
  | "airportScore";

export const EMPTY_FILTERS: FilterState = {
  priceMin: null,
  priceMax: null,
  monthlyMax: null,
  yearBuiltMin: null,
  sqftMin: null,
  bedsMin: null,
  bathsMin: null,
  garageMin: null,
  neighborhoods: [],
  floodZones: [],
  hoaMax: null,
  airportMax: null,
  downtownMax: null,
  schoolMin: null,
  ageMax: null,
  lotMin: null,
  scoreMin: null,
  recommendations: [],
  text: "",
};

function avgSchool(h: AnalyzedHome): number {
  const s = h.listing.schools;
  return (s.elementary.rating + s.middle.rating + s.high.rating) / 3;
}

export function applyFilters(homes: AnalyzedHome[], f: FilterState): AnalyzedHome[] {
  const text = f.text.trim().toLowerCase();
  return homes.filter((h) => {
    const l = h.listing;
    if (f.priceMin != null && l.price < f.priceMin) return false;
    if (f.priceMax != null && l.price > f.priceMax) return false;
    if (f.monthlyMax != null && h.mortgage.totalMonthly > f.monthlyMax) return false;
    if (f.yearBuiltMin != null && l.yearBuilt < f.yearBuiltMin) return false;
    if (f.sqftMin != null && l.sqft < f.sqftMin) return false;
    if (f.bedsMin != null && l.bedrooms < f.bedsMin) return false;
    if (f.bathsMin != null && l.bathrooms < f.bathsMin) return false;
    if (f.garageMin != null && l.garageSpaces < f.garageMin) return false;
    if (f.neighborhoods.length && !f.neighborhoods.includes(l.neighborhood)) return false;
    if (f.floodZones.length && !f.floodZones.includes(l.floodZone)) return false;
    if (f.hoaMax != null && l.hoaMonthly > f.hoaMax) return false;
    if (f.airportMax != null && l.commute.airportCHS > f.airportMax) return false;
    if (f.downtownMax != null && l.commute.downtown > f.downtownMax) return false;
    if (f.schoolMin != null && avgSchool(h) < f.schoolMin) return false;
    if (f.ageMax != null && h.homeAge > f.ageMax) return false;
    if (f.lotMin != null && l.lotSizeAcres < f.lotMin) return false;
    if (f.scoreMin != null && h.score.overall < f.scoreMin) return false;
    if (f.recommendations.length && !f.recommendations.includes(h.score.recommendation)) return false;
    if (text) {
      const hay = `${l.address} ${l.neighborhood} ${l.subdivision} ${l.city} ${l.zip} ${l.builder}`.toLowerCase();
      if (!hay.includes(text)) return false;
    }
    return true;
  });
}

export function sortHomes(homes: AnalyzedHome[], key: SortKey, dir: "asc" | "desc"): AnalyzedHome[] {
  const val = (h: AnalyzedHome): number => {
    switch (key) {
      case "rank":
        return h.rank;
      case "price":
        return h.listing.price;
      case "monthly":
        return h.mortgage.totalMonthly;
      case "score":
        return h.score.overall;
      case "ppsf":
        return h.pricePerSqft;
      case "sqft":
        return h.listing.sqft;
      case "yearBuilt":
        return h.listing.yearBuilt;
      case "airport":
        return h.listing.commute.airportCHS;
      case "downtown":
        return h.listing.commute.downtown;
      case "investment":
        return h.score.investmentScore;
      case "family":
        return h.score.familyScore;
      case "airportScore":
        return h.score.airportScore;
    }
  };
  const sorted = [...homes].sort((a, b) => val(a) - val(b));
  return dir === "asc" ? sorted : sorted.reverse();
}
