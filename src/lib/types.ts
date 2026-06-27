/**
 * Core domain types for the Charleston Area Home Search & Analysis app.
 *
 * `Listing` is the raw record as it would arrive from a data source
 * (Zillow / Realtor.com / Redfin / MLS / builder feeds). `AnalyzedHome`
 * is a `Listing` enriched with the derived financial, commute, flood,
 * insurance, neighborhood and scoring analysis computed by this app.
 */

export type PropertyType = "Single Family" | "Townhome" | "Condo";

export type FloodZone =
  | "X" // minimal risk
  | "X (shaded)" // 0.2% annual / 500-year
  | "AE" // 1% annual (100-year), base flood elevation defined
  | "VE" // coastal high hazard (wave action)
  | "A"; // 1% annual, no base flood elevation

export type Recommendation = "Strong Buy" | "Buy" | "Consider" | "Pass";

/** Distances (in minutes of drive time) to key Charleston-area destinations. */
export interface CommuteTimes {
  airportCHS: number; // Charleston International (CHS) — weekday ~3pm
  downtown: number; // Downtown Charleston (peninsula)
  beach: number; // nearest public beach (IOP / Folly / Sullivan's)
  costco: number; // Mount Pleasant Costco
  publix: number; // nearest Publix
  boeing: number; // Boeing South Carolina (North Charleston)
  jointBaseCharleston: number; // Joint Base Charleston
  hospital: number; // nearest major hospital (MUSC / Roper / East Cooper)
  flightSchool: number; // nearest flight school (helps the pilot user)
  parks: number; // nearest major park
  boatRamp: number; // nearest public boat ramp
  shopping: number; // nearest major shopping center
}

/** School assignment + GreatSchools-style 1–10 ratings. */
export interface Schools {
  district: string;
  elementary: { name: string; rating: number };
  middle: { name: string; rating: number };
  high: { name: string; rating: number };
}

/** Condition / mechanicals — drives the "home condition" score component. */
export interface Condition {
  roofAgeYears: number;
  hvacAgeYears: number;
  waterHeater: string;
  exteriorMaterial: string;
  energyFeatures: string[];
  internet: string; // primary high-speed provider
  utilities: string[];
}

export interface PriceChange {
  date: string; // ISO date
  price: number;
}

/**
 * Raw listing record. Mirrors the "For Every Home Collect" list in the spec.
 * Fields a real feed might not provide are typed as optional.
 */
export interface Listing {
  id: string;
  mlsId: string;
  source: string; // which feed this came from
  listingUrls: {
    zillow?: string;
    realtor?: string;
    redfin?: string;
    builder?: string;
    googleMaps?: string;
    virtualTour?: string;
  };
  photos: string[];

  // Location
  address: string;
  lat: number;
  lng: number;
  neighborhood: string;
  subdivision: string;
  city: string;
  zip: string;
  county: string;

  // Structure
  builder: string;
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  halfBaths: number;
  garageSpaces: number;
  stories: number;
  sqft: number;
  lotSizeAcres: number;

  // Money
  price: number;
  hoaMonthly: number; // dollars / month
  annualTaxes: number; // county property tax, dollars / year (primary-residence rate)
  estInsuranceAnnual: number; // homeowners + wind, dollars / year
  estFloodInsuranceAnnual: number; // dollars / year (0 when not required)

  // Risk / market
  floodZone: FloodZone;
  floodHistory: string; // free text summary
  daysOnMarket: number;
  priceHistory: PriceChange[];
  sellerConcessions: number; // dollars offered
  listingAgent: string;

  // Type & condition
  propertyType: PropertyType;
  condition: Condition;

  // Schools & livability
  schools: Schools;
  crimeRating: number; // 1 (worst) – 10 (safest)
  walkScore: number;
  bikeScore: number;
  transitScore: number;

  commute: CommuteTimes;
}

// ---------------------------------------------------------------------------
// Derived analysis
// ---------------------------------------------------------------------------

export interface MortgageBreakdown {
  homePrice: number;
  downPaymentPct: number;
  downPayment: number;
  loanAmount: number;
  interestRate: number;
  termYears: number;

  principalAndInterest: number; // monthly
  monthlyTaxes: number;
  monthlyInsurance: number;
  monthlyFlood: number;
  monthlyHOA: number;
  monthlyPMI: number;
  totalMonthly: number; // PITI + HOA + flood + PMI

  // Cash / ratios
  closingCosts: number;
  cashToClose: number; // down payment + closing costs - concessions
  emergencyFundRemaining: number;
  dtiFront: number; // housing / gross monthly income
  dtiBack: number; // (housing + other debts) / gross monthly income
  pmiRequired: boolean;

  // Long-horizon
  maintenanceReserveMonthly: number;
  fiveYearCost: number;
  tenYearCost: number;
  breakEvenMonths: number; // months until owning beats renting comparable
  projectedEquity5yr: number;
  projectedEquity10yr: number;
  estAppreciationRate: number; // annual
}

export interface ScoreBreakdown {
  overall: number; // 0–100
  recommendation: Recommendation;
  components: {
    financialValue: number;
    commute: number;
    schools: number;
    floodRisk: number;
    appreciation: number;
    homeCondition: number;
    hoa: number;
    neighborhood: number;
  };
  // Spec-required headline sub-scores
  investmentScore: number;
  familyScore: number;
  airportScore: number; // a.k.a. pilot-commuter convenience
}

export interface InsuranceAnalysis {
  homeowners: number;
  wind: number;
  flood: number;
  totalAnnual: number;
  futureIncreaseRisk: "Low" | "Moderate" | "High";
  notes: string;
}

export interface FloodAnalysis {
  zone: FloodZone;
  riskLevel: "Minimal" | "Low" | "Moderate" | "High" | "Very High";
  insuranceRequired: boolean;
  elevationNote: string;
  notes: string;
}

export interface CommuteAnalysis {
  airportRank: "Excellent" | "Good" | "Fair" | "Poor";
  downtownRank: "Excellent" | "Good" | "Fair" | "Poor";
  pilotConvenience: "Excellent" | "Good" | "Fair" | "Poor";
  notes: string;
}

/** A fully analyzed home: raw listing + every derived analysis block. */
export interface AnalyzedHome {
  listing: Listing;
  mortgage: MortgageBreakdown;
  score: ScoreBreakdown;
  insurance: InsuranceAnalysis;
  flood: FloodAnalysis;
  commute: CommuteAnalysis;
  pricePerSqft: number;
  homeAge: number;
  rank: number; // 1 = best, assigned after ranking the whole set
  /** Concise generated narrative (pros / cons / negotiation leverage). */
  insight: HomeInsight;
}

export interface HomeInsight {
  summary: string;
  pros: string[];
  cons: string[];
  risks: string[];
  negotiation: string;
  offerRecommendation: string;
}
