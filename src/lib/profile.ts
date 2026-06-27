/**
 * The buyer's profile and the default mortgage / financial assumptions,
 * taken directly from the project spec. Everything here is adjustable in
 * the UI; these are the starting points.
 */

export interface MortgageAssumptions {
  downPaymentPct: number; // 0.10 | 0.15 | 0.20 ...
  interestRate: number; // annual, e.g. 0.0675
  termYears: number;
  // Rates applied when a listing doesn't carry its own figure.
  propertyTaxRate: number; // annual, as a fraction of price (SC primary 4% assessment)
  insuranceRate: number; // annual, as a fraction of price
  pmiRate: number; // annual, as a fraction of loan, applied when downPct < 0.20
  closingCostPct: number; // as a fraction of price
  maintenanceRatePct: number; // annual maintenance reserve as fraction of price
  appreciationRate: number; // annual home appreciation
  rentComparable: number; // monthly rent for a comparable home (break-even)
}

export const DEFAULT_ASSUMPTIONS: MortgageAssumptions = {
  downPaymentPct: 0.15,
  interestRate: 0.0675,
  termYears: 30,
  // SC primary residence is assessed at 4% of value; effective all-in rate
  // (county + municipal + school operating, after the owner-occupant credit)
  // for the Charleston metro lands near ~0.5% of market value.
  propertyTaxRate: 0.005,
  insuranceRate: 0.006, // coastal SC wind-inclusive homeowners runs high
  pmiRate: 0.006,
  closingCostPct: 0.03,
  maintenanceRatePct: 0.01,
  appreciationRate: 0.04,
  rentComparable: 2900,
};

export const DOWN_PAYMENT_SCENARIOS = [0.1, 0.15, 0.2] as const;

export interface BuyerProfile {
  origin: string;
  destinationPreference: string[];
  currentHome: {
    purchaseDate: string;
    purchasePrice: number;
    estCurrentValue: number; // appreciated estimate, used for sale proceeds
    sellingCostPct: number; // agent commission + closing on the sale side
    remainingMortgage: number; // approximate payoff
  };
  income: {
    husbandCurrentSalary: number;
    wifeHourly: number;
    wifeHoursLow: number;
    wifeHoursHigh: number;
    otherMonthlyDebts: number; // car loans, etc. (DTI back-end)
  };
  budget: {
    targetMonthlyLow: number;
    targetMonthlyHigh: number;
    emergencyFundTarget: number;
  };
  pilot: {
    currentHours: number;
    hoursPerWeek: number;
    atpMinimum: number;
  };
}

export const BUYER_PROFILE: BuyerProfile = {
  origin: "Greenville, South Carolina",
  destinationPreference: ["Mount Pleasant", "Charleston metro (best value)"],
  currentHome: {
    purchaseDate: "2024-03",
    purchasePrice: 420_000,
    // Greenville appreciated modestly since early 2024; ~6–8% to mid-2026.
    estCurrentValue: 450_000,
    sellingCostPct: 0.07, // ~6% commission + ~1% seller closing
    remainingMortgage: 360_000, // approx. balance on a 2024 purchase
  },
  income: {
    husbandCurrentSalary: 100_000,
    wifeHourly: 40,
    wifeHoursLow: 35,
    wifeHoursHigh: 40,
    otherMonthlyDebts: 650,
  },
  budget: {
    targetMonthlyLow: 3_100,
    targetMonthlyHigh: 3_300,
    emergencyFundTarget: 30_000,
  },
  pilot: {
    currentHours: 350,
    hoursPerWeek: 20,
    atpMinimum: 1_500,
  },
};

/** Estimated net cash from selling the current Greenville home. */
export function estimateSaleProceeds(profile: BuyerProfile = BUYER_PROFILE): number {
  const { estCurrentValue, sellingCostPct, remainingMortgage } = profile.currentHome;
  const sellingCosts = estCurrentValue * sellingCostPct;
  return Math.max(0, estCurrentValue - sellingCosts - remainingMortgage);
}

/** Gross household monthly income at the wife's low / high hours estimate. */
export function householdMonthlyIncome(
  profile: BuyerProfile = BUYER_PROFILE,
  wifeHours: "low" | "high" = "low",
): number {
  const hours = wifeHours === "low" ? profile.income.wifeHoursLow : profile.income.wifeHoursHigh;
  const wifeAnnual = profile.income.wifeHourly * hours * 52;
  const annual = profile.income.husbandCurrentSalary + wifeAnnual;
  return annual / 12;
}
