/**
 * Generated listing narrative: summary, pros, cons, risks, negotiation
 * leverage and an offer recommendation.
 *
 * This is a deterministic, rules-based generator so the app works with zero
 * external dependencies or API keys. The spec calls for an LLM (e.g. GPT or
 * Claude) here — `src/lib/data-sources/ai.ts` documents the drop-in seam:
 * swap `buildInsight` for an async call that sends the same structured facts
 * to a model and returns the same `HomeInsight` shape.
 */

import type {
  HomeInsight,
  Listing,
  MortgageBreakdown,
  ScoreBreakdown,
} from "./types";
import { analyzeFlood } from "./analysis";
import { neighborhoodMeta } from "./neighborhoods";
import { BUYER_PROFILE } from "./profile";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function buildInsight(
  listing: Listing,
  mortgage: MortgageBreakdown,
  score: ScoreBreakdown,
): HomeInsight {
  const meta = neighborhoodMeta(listing.neighborhood);
  const flood = analyzeFlood(listing);
  const ppsf = Math.round(listing.price / listing.sqft);
  const age = new Date().getFullYear() - listing.yearBuilt;
  const { targetMonthlyLow, targetMonthlyHigh } = BUYER_PROFILE.budget;

  const pros: string[] = [];
  const cons: string[] = [];
  const risks: string[] = [];

  // Budget
  if (mortgage.totalMonthly <= targetMonthlyHigh) {
    pros.push(
      `Estimated ${usd(mortgage.totalMonthly)}/mo all-in fits the ${usd(targetMonthlyLow)}–${usd(
        targetMonthlyHigh,
      )} target budget.`,
    );
  } else {
    cons.push(
      `Estimated ${usd(mortgage.totalMonthly)}/mo runs ${usd(
        mortgage.totalMonthly - targetMonthlyHigh,
      )} over the top of the target budget.`,
    );
  }

  // Schools
  const avgSchool = (
    (listing.schools.elementary.rating + listing.schools.middle.rating + listing.schools.high.rating) /
    3
  ).toFixed(1);
  if (Number(avgSchool) >= 7.5) pros.push(`Strong schools (avg ${avgSchool}/10), led by ${listing.schools.high.name}.`);
  else if (Number(avgSchool) < 6) cons.push(`School ratings are middling (avg ${avgSchool}/10) for a family priority.`);

  // Commute
  if (listing.commute.airportCHS <= 25)
    pros.push(`Short ${listing.commute.airportCHS}-min drive to CHS — excellent for an airline-commuter schedule.`);
  else if (listing.commute.airportCHS >= 38)
    cons.push(`${listing.commute.airportCHS} min to CHS is a long haul for early-morning pilot sign-ins.`);

  // Construction / condition
  if (listing.yearBuilt >= 2020) pros.push(`Newer build (${listing.yearBuilt}) — minimal deferred maintenance.`);
  else if (listing.yearBuilt < 2018) cons.push(`Built ${listing.yearBuilt}; just outside the 2018+ preference.`);
  if (listing.condition.roofAgeYears >= 18) risks.push(`Roof is ~${listing.condition.roofAgeYears} yrs old — budget for replacement.`);
  if (listing.condition.hvacAgeYears >= 15) risks.push(`HVAC is ~${listing.condition.hvacAgeYears} yrs old.`);

  // Flood / insurance
  if (flood.insuranceRequired)
    risks.push(`Flood zone ${flood.zone} — flood insurance is mandatory (${usd(listing.estFloodInsuranceAnnual)}/yr est.).`);
  else pros.push(`Flood zone ${flood.zone} — no mandatory flood insurance.`);

  // HOA
  if (listing.hoaMonthly === 0) pros.push("No HOA dues.");
  else if (listing.hoaMonthly >= 200) cons.push(`HOA is ${usd(listing.hoaMonthly)}/mo.`);

  // Value
  if (ppsf <= 230) pros.push(`${usd(ppsf)}/sqft is solid value for the metro.`);
  else if (ppsf >= 300) cons.push(`${usd(ppsf)}/sqft is on the pricey side.`);

  // Days on market → negotiation leverage
  let negotiation: string;
  const priceDrops = listing.priceHistory.length > 1;
  if (listing.daysOnMarket >= 60) {
    negotiation = `${listing.daysOnMarket} days on market${priceDrops ? " with prior price cuts" : ""} — meaningful buyer leverage. Open ~3–4% under ask and ask for rate-buydown or closing-cost concessions.`;
  } else if (listing.daysOnMarket >= 30) {
    negotiation = `${listing.daysOnMarket} days on market — moderate leverage. A 1–2% under-ask offer with a request for concessions is reasonable.`;
  } else {
    negotiation = `Only ${listing.daysOnMarket} days on market — limited leverage. Expect to offer near ask${
      meta.desirability >= 88 ? " in this high-demand area" : ""
    }.`;
  }

  // Overpriced detector vs neighborhood ppsf band
  if (ppsf >= 310 && listing.daysOnMarket >= 45) {
    risks.push("Appears overpriced relative to the area and sitting on the market — verify recent comparable sales.");
  }

  const offerAnchor =
    listing.daysOnMarket >= 60 ? 0.965 : listing.daysOnMarket >= 30 ? 0.985 : 0.997;
  const suggestedOffer = Math.round((listing.price * offerAnchor) / 1000) * 1000;
  const offerRecommendation = `Suggested opening offer ≈ ${usd(suggestedOffer)} (${(
    (1 - offerAnchor) *
    100
  ).toFixed(1)}% under ask), paired with a request for seller-paid closing costs or a rate buydown.`;

  const verdict =
    score.recommendation === "Strong Buy"
      ? "A standout option"
      : score.recommendation === "Buy"
        ? "A strong fit"
        : score.recommendation === "Consider"
          ? "Worth a look with caveats"
          : "A weaker fit";

  const summary =
    `${verdict} in ${listing.neighborhood} (${listing.city}). ${meta.blurb} ` +
    `This ${listing.bedrooms}BR/${listing.bathrooms}BA, ${listing.sqft.toLocaleString()} sqft ${listing.propertyType.toLowerCase()} ` +
    `(${listing.yearBuilt}, ${age} yrs) lists at ${usd(listing.price)} (${usd(ppsf)}/sqft), ~${usd(
      mortgage.totalMonthly,
    )}/mo all-in. Overall score ${score.overall}/100 — ${score.recommendation}.`;

  return {
    summary,
    pros: pros.slice(0, 6),
    cons: cons.slice(0, 6),
    risks: risks.slice(0, 5),
    negotiation,
    offerRecommendation,
  };
}
