/**
 * Airline pilot career model for the husband.
 *
 * Inputs from the spec: 350 hours logged, building ~20 hours/week, ATP
 * minimum 1,500 hours, currently $100k. Produces a timeline to ATP and
 * salary progression (low / expected / high) across the four career stages.
 *
 * Salary bands reflect post-2023 contract environment (Delta/United/American
 * pattern bargaining lifted regional and major pay materially). They are
 * planning estimates, not guarantees.
 */

import { BUYER_PROFILE, type BuyerProfile } from "./profile";

export interface AtpTimeline {
  currentHours: number;
  hoursPerWeek: number;
  hoursToRestrictedAtp: number; // R-ATP (1,000–1,250 hrs depending on pathway)
  weeksToRestrictedAtp: number;
  monthsToRestrictedAtp: number;
  hoursToFullAtp: number;
  weeksToFullAtp: number;
  monthsToFullAtp: number;
  estimatedAtpDate: string; // relative description
  note: string;
}

export interface SalaryBand {
  low: number;
  expected: number;
  high: number;
}

export interface CareerStage {
  stage: string;
  typicalYears: string; // years-of-experience window at this stage
  annual: SalaryBand;
  note: string;
}

export interface PilotProjection {
  timeline: AtpTimeline;
  stages: CareerStage[];
  // A simple year-by-year household-relevant trajectory for the pilot income.
  trajectory: { yearLabel: string; income: SalaryBand; stage: string }[];
}

const R_ATP_HOURS = 1_250; // conservative restricted-ATP threshold

export function atpTimeline(profile: BuyerProfile = BUYER_PROFILE): AtpTimeline {
  const { currentHours, hoursPerWeek, atpMinimum } = profile.pilot;
  const hoursToRestrictedAtp = Math.max(0, R_ATP_HOURS - currentHours);
  const hoursToFullAtp = Math.max(0, atpMinimum - currentHours);

  const weeksToRestrictedAtp = Math.ceil(hoursToRestrictedAtp / hoursPerWeek);
  const weeksToFullAtp = Math.ceil(hoursToFullAtp / hoursPerWeek);
  const monthsToRestrictedAtp = Math.round((weeksToRestrictedAtp / 52) * 12);
  const monthsToFullAtp = Math.round((weeksToFullAtp / 52) * 12);

  return {
    currentHours,
    hoursPerWeek,
    hoursToRestrictedAtp,
    weeksToRestrictedAtp,
    monthsToRestrictedAtp,
    hoursToFullAtp,
    weeksToFullAtp,
    monthsToFullAtp,
    estimatedAtpDate: `~${monthsToFullAtp} months at ${hoursPerWeek} hrs/week (R-ATP eligible in ~${monthsToRestrictedAtp} months)`,
    note:
      "Building 20 hrs/week is aggressive but achievable as a CFI. R-ATP (1,250 hrs with a qualifying 4-yr aviation degree, or 1,000 hrs for select pathways) lets a regional hire begin sooner than the full 1,500-hr ATP.",
  };
}

/**
 * Career-stage salary bands. Figures are annual W-2 estimates and assume a
 * narrowbody seat unless noted; widebody captain pay sits at the high end.
 */
export const CAREER_STAGES: CareerStage[] = [
  {
    stage: "Regional First Officer",
    typicalYears: "Years 0–2",
    annual: { low: 75_000, expected: 95_000, high: 115_000 },
    note: "Post-2022 retention deals pushed first-year regional FO pay (with bonuses) near six figures.",
  },
  {
    stage: "Regional Captain",
    typicalYears: "Years 2–5",
    annual: { low: 130_000, expected: 175_000, high: 215_000 },
    note: "Upgrade timing depends on hiring; some regionals upgrade FOs in 12–24 months.",
  },
  {
    stage: "Major Airline First Officer",
    typicalYears: "Years 4–8",
    annual: { low: 110_000, expected: 190_000, high: 260_000 },
    note: "First-year major FO pay starts ~$100–120k and climbs quickly on the pay scale.",
  },
  {
    stage: "Major Airline Captain",
    typicalYears: "Years 8+",
    annual: { low: 270_000, expected: 360_000, high: 480_000 },
    note: "Senior widebody captains at legacy carriers can exceed $450k in good years.",
  },
];

export function pilotProjection(profile: BuyerProfile = BUYER_PROFILE): PilotProjection {
  const timeline = atpTimeline(profile);

  // Rough year-by-year household-planning trajectory for the first decade.
  const trajectory: PilotProjection["trajectory"] = [
    { yearLabel: "Now", income: { low: 100_000, expected: 100_000, high: 100_000 }, stage: "Building hours / CFI ($100k current)" },
    { yearLabel: "Year 1–2", income: CAREER_STAGES[0].annual, stage: CAREER_STAGES[0].stage },
    { yearLabel: "Year 2–5", income: CAREER_STAGES[1].annual, stage: CAREER_STAGES[1].stage },
    { yearLabel: "Year 4–8", income: CAREER_STAGES[2].annual, stage: CAREER_STAGES[2].stage },
    { yearLabel: "Year 8+", income: CAREER_STAGES[3].annual, stage: CAREER_STAGES[3].stage },
  ];

  return { timeline, stages: CAREER_STAGES, trajectory };
}
