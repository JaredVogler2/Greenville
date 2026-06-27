/**
 * Flood, insurance and commute analysis derived from a raw listing.
 * These feed both the UI detail panels and the scoring engine.
 */

import type {
  CommuteAnalysis,
  FloodAnalysis,
  FloodZone,
  InsuranceAnalysis,
  Listing,
} from "./types";

// ---------------------------------------------------------------------------
// Flood
// ---------------------------------------------------------------------------

const FLOOD_RISK: Record<FloodZone, FloodAnalysis["riskLevel"]> = {
  X: "Minimal",
  "X (shaded)": "Low",
  A: "High",
  AE: "High",
  VE: "Very High",
};

export function analyzeFlood(listing: Listing): FloodAnalysis {
  const zone = listing.floodZone;
  const riskLevel = FLOOD_RISK[zone];
  // Federally-backed mortgages require flood insurance in Special Flood Hazard
  // Areas (A/AE/VE). Zone X is not mandated (but often still wise near tidal creeks).
  const insuranceRequired = zone === "A" || zone === "AE" || zone === "VE";

  let elevationNote: string;
  switch (zone) {
    case "VE":
      elevationNote =
        "Coastal high-hazard (wave action). Requires elevated construction; premiums and building costs are highest here.";
      break;
    case "AE":
      elevationNote =
        "Base Flood Elevation is defined. An Elevation Certificate showing the finished floor above BFE can sharply cut premiums.";
      break;
    case "A":
      elevationNote = "No Base Flood Elevation published — premiums are estimated conservatively.";
      break;
    case "X (shaded)":
      elevationNote = "0.2%-annual (500-year) zone. Insurance optional; preferred-risk policies are cheap.";
      break;
    default:
      elevationNote = "Outside the mapped 100/500-year floodplain. Lowest-cost flood coverage available.";
  }

  return {
    zone,
    riskLevel,
    insuranceRequired,
    elevationNote,
    notes: listing.floodHistory,
  };
}

// ---------------------------------------------------------------------------
// Insurance
// ---------------------------------------------------------------------------

export function analyzeInsurance(listing: Listing): InsuranceAnalysis {
  const homeownersBase = listing.estInsuranceAnnual;
  // In coastal SC the wind/hail portion is a large share of the homeowners
  // premium. Split it out for transparency (~40% near the coast).
  const wind = Math.round(homeownersBase * 0.4);
  const homeowners = homeownersBase - wind;
  const flood = listing.estFloodInsuranceAnnual;
  const totalAnnual = homeownersBase + flood;

  // Future-increase risk keys off flood zone + distance to the coast (proxied
  // by beach drive time) — closer to the water means more wind exposure.
  let futureIncreaseRisk: InsuranceAnalysis["futureIncreaseRisk"] = "Moderate";
  if (listing.floodZone === "VE" || (listing.commute.beach <= 12 && listing.floodZone === "AE")) {
    futureIncreaseRisk = "High";
  } else if (listing.floodZone === "X" && listing.commute.beach >= 20) {
    futureIncreaseRisk = "Low";
  }

  const notes =
    futureIncreaseRisk === "High"
      ? "Coastal wind exposure and NFIP Risk Rating 2.0 trends point to above-average premium growth. Budget for annual increases."
      : futureIncreaseRisk === "Low"
        ? "Inland location with minimal flood exposure keeps premium growth contained."
        : "Typical Charleston-metro exposure; expect steady but manageable premium growth.";

  return { homeowners, wind, flood, totalAnnual, futureIncreaseRisk, notes };
}

// ---------------------------------------------------------------------------
// Commute
// ---------------------------------------------------------------------------

function rank(minutes: number, excellent: number, good: number, fair: number): CommuteAnalysis["airportRank"] {
  if (minutes <= excellent) return "Excellent";
  if (minutes <= good) return "Good";
  if (minutes <= fair) return "Fair";
  return "Poor";
}

export function analyzeCommute(listing: Listing): CommuteAnalysis {
  const { airportCHS, downtown, flightSchool } = listing.commute;
  const airportRank = rank(airportCHS, 20, 30, 40);
  const downtownRank = rank(downtown, 20, 30, 40);

  // Pilot-commuter convenience blends airport proximity with flight-school
  // access (for finishing ratings) — airport weighted more heavily.
  const pilotMinutes = airportCHS * 0.7 + flightSchool * 0.3;
  const pilotConvenience = rank(pilotMinutes, 20, 28, 38);

  const notes =
    `~${airportCHS} min to CHS and ~${downtown} min downtown (weekday ~3pm). ` +
    (airportRank === "Excellent" || airportRank === "Good"
      ? "Strong base for a commuting airline pilot — short hop to the terminal for early sign-ins."
      : "Airport drive is longer than ideal for early-morning commuter trips; factor in traffic buffer.");

  return { airportRank, downtownRank, pilotConvenience, notes };
}
