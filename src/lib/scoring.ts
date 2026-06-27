/**
 * Weighted scoring model (0–100) and Strong Buy / Buy / Consider / Pass
 * recommendation, plus the three headline sub-scores (investment, family,
 * airport/pilot-commuter). Weights match the spec exactly.
 */

import type {
  Listing,
  MortgageBreakdown,
  Recommendation,
  ScoreBreakdown,
} from "./types";
import { neighborhoodMeta } from "./neighborhoods";
import { BUYER_PROFILE, type BuyerProfile } from "./profile";

export const SCORE_WEIGHTS = {
  financialValue: 0.25,
  commute: 0.2,
  schools: 0.15,
  floodRisk: 0.1,
  appreciation: 0.1,
  homeCondition: 0.1,
  hoa: 0.05,
  neighborhood: 0.05,
} as const;

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/** Linear map from [a,b] onto [0,100], clamped. Set a>b to invert (lower=better). */
function scale(value: number, a: number, b: number): number {
  if (a === b) return 50;
  return clamp(((value - a) / (b - a)) * 100);
}

// --- Component scores -------------------------------------------------------

function financialValueScore(
  listing: Listing,
  mortgage: MortgageBreakdown,
  profile: BuyerProfile,
): number {
  // 1) Budget fit: target is $3,100–3,300/mo. Reward landing in/under the
  //    band; penalize meaningfully above it.
  const { targetMonthlyLow, targetMonthlyHigh } = profile.budget;
  const pay = mortgage.totalMonthly;
  let budgetFit: number;
  if (pay <= targetMonthlyLow) {
    // Comfortably under budget — but extreme under-spend isn't "better value"
    // for these goals, so taper rather than max out.
    budgetFit = 90 + scale(pay, targetMonthlyLow - 1200, targetMonthlyLow) * 0.1;
  } else if (pay <= targetMonthlyHigh) {
    budgetFit = scale(pay, targetMonthlyHigh, targetMonthlyLow) * 0.2 + 80; // 80–100 band
  } else {
    budgetFit = clamp(80 - ((pay - targetMonthlyHigh) / targetMonthlyHigh) * 220);
  }

  // 2) DTI health (front-end). <=0.28 ideal, >=0.43 poor.
  const dtiScore = scale(mortgage.dtiFront, 0.43, 0.2);

  // 3) Price-per-sqft value relative to a metro reference band.
  const ppsf = listing.price / listing.sqft;
  const ppsfScore = scale(ppsf, 350, 180); // $180/sqft great, $350 expensive

  return clamp(budgetFit * 0.5 + dtiScore * 0.25 + ppsfScore * 0.25);
}

function commuteScore(listing: Listing): number {
  const { airportCHS, downtown } = listing.commute;
  // Spec target: within ~35 minutes to both CHS and downtown.
  const airport = scale(airportCHS, 45, 12);
  const dt = scale(downtown, 45, 12);
  return clamp(airport * 0.55 + dt * 0.45);
}

function schoolsScore(listing: Listing): number {
  const { elementary, middle, high } = listing.schools;
  const avg = (elementary.rating + middle.rating + high.rating) / 3; // 1–10
  return clamp(scale(avg, 3, 10));
}

function floodScore(listing: Listing): number {
  switch (listing.floodZone) {
    case "X":
      return 100;
    case "X (shaded)":
      return 82;
    case "AE":
      return 48;
    case "A":
      return 42;
    case "VE":
      return 15;
    default:
      return 60;
  }
}

function appreciationScore(listing: Listing): number {
  const meta = neighborhoodMeta(listing.neighborhood);
  // Growth potential + a nudge for newer construction (less obsolescence risk)
  // and for not-stale listings (lower days-on-market signals demand).
  const newness = scale(listing.yearBuilt, 2015, 2024);
  const demand = scale(listing.daysOnMarket, 120, 5);
  return clamp(meta.growth * 0.6 + newness * 0.25 + demand * 0.15);
}

function homeConditionScore(listing: Listing): number {
  const yearScore = scale(listing.yearBuilt, 2010, 2024);
  const roof = scale(listing.condition.roofAgeYears, 25, 0);
  const hvac = scale(listing.condition.hvacAgeYears, 20, 0);
  return clamp(yearScore * 0.5 + roof * 0.25 + hvac * 0.25);
}

function hoaScore(listing: Listing): number {
  // $0/mo = 100, $300+/mo = 0.
  return scale(listing.hoaMonthly, 300, 0);
}

function neighborhoodScore(listing: Listing): number {
  const meta = neighborhoodMeta(listing.neighborhood);
  const safety = scale(listing.crimeRating, 1, 10);
  const walk = scale(listing.walkScore, 10, 90);
  return clamp(meta.desirability * 0.5 + safety * 0.3 + walk * 0.2);
}

// --- Sub-scores (headline) --------------------------------------------------

function investmentScore(listing: Listing, mortgage: MortgageBreakdown): number {
  const ppsf = listing.price / listing.sqft;
  const value = scale(ppsf, 350, 180);
  const appr = appreciationScore(listing);
  const equity = scale(mortgage.projectedEquity5yr, 40_000, 220_000);
  return Math.round(clamp(appr * 0.45 + value * 0.3 + equity * 0.25));
}

function familyScore(listing: Listing): number {
  const meta = neighborhoodMeta(listing.neighborhood);
  const schools = schoolsScore(listing);
  const safety = scale(listing.crimeRating, 1, 10);
  const space = scale(listing.sqft, 1500, 3200);
  const beds = scale(listing.bedrooms, 3, 5);
  return Math.round(clamp(schools * 0.35 + safety * 0.25 + meta.family * 0.2 + space * 0.1 + beds * 0.1));
}

function airportScore(listing: Listing): number {
  const airport = scale(listing.commute.airportCHS, 45, 12);
  const flight = scale(listing.commute.flightSchool, 45, 12);
  return Math.round(clamp(airport * 0.75 + flight * 0.25));
}

// --- Aggregate --------------------------------------------------------------

function recommendationFor(overall: number): Recommendation {
  // Calibrated to the Charleston-metro tradeoff space: the premium areas are
  // expensive (budget drag) while the value areas have weaker schools, so a
  // mid-70s score is genuinely a standout here.
  if (overall >= 74) return "Strong Buy";
  if (overall >= 65) return "Buy";
  if (overall >= 54) return "Consider";
  return "Pass";
}

export function scoreHome(
  listing: Listing,
  mortgage: MortgageBreakdown,
  profile: BuyerProfile = BUYER_PROFILE,
): ScoreBreakdown {
  const components = {
    financialValue: Math.round(financialValueScore(listing, mortgage, profile)),
    commute: Math.round(commuteScore(listing)),
    schools: Math.round(schoolsScore(listing)),
    floodRisk: Math.round(floodScore(listing)),
    appreciation: Math.round(appreciationScore(listing)),
    homeCondition: Math.round(homeConditionScore(listing)),
    hoa: Math.round(hoaScore(listing)),
    neighborhood: Math.round(neighborhoodScore(listing)),
  };

  const overall =
    components.financialValue * SCORE_WEIGHTS.financialValue +
    components.commute * SCORE_WEIGHTS.commute +
    components.schools * SCORE_WEIGHTS.schools +
    components.floodRisk * SCORE_WEIGHTS.floodRisk +
    components.appreciation * SCORE_WEIGHTS.appreciation +
    components.homeCondition * SCORE_WEIGHTS.homeCondition +
    components.hoa * SCORE_WEIGHTS.hoa +
    components.neighborhood * SCORE_WEIGHTS.neighborhood;

  const overallRounded = Math.round(overall);

  return {
    overall: overallRounded,
    recommendation: recommendationFor(overallRounded),
    components,
    investmentScore: investmentScore(listing, mortgage),
    familyScore: familyScore(listing),
    airportScore: airportScore(listing),
  };
}
