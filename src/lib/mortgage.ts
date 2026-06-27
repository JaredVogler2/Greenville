/**
 * Mortgage & ownership-cost engine.
 *
 * Pure functions — no React, no I/O — so they're trivially testable and can
 * be reused by the API routes, the table, the calculator and the exporter.
 */

import type { Listing, MortgageBreakdown } from "./types";
import {
  BUYER_PROFILE,
  DEFAULT_ASSUMPTIONS,
  estimateSaleProceeds,
  householdMonthlyIncome,
  type BuyerProfile,
  type MortgageAssumptions,
} from "./profile";

/** Standard amortized monthly principal + interest payment. */
export function monthlyPI(loanAmount: number, annualRate: number, termYears: number): number {
  if (loanAmount <= 0) return 0;
  const r = annualRate / 12;
  const n = termYears * 12;
  if (r === 0) return loanAmount / n;
  const factor = Math.pow(1 + r, n);
  return (loanAmount * (r * factor)) / (factor - 1);
}

/** Remaining loan balance after `monthsPaid` payments. */
export function remainingBalance(
  loanAmount: number,
  annualRate: number,
  termYears: number,
  monthsPaid: number,
): number {
  const r = annualRate / 12;
  const n = termYears * 12;
  if (r === 0) return Math.max(0, loanAmount * (1 - monthsPaid / n));
  const factor = Math.pow(1 + r, n);
  const factorM = Math.pow(1 + r, monthsPaid);
  const balance = loanAmount * (factor - factorM) / (factor - 1);
  return Math.max(0, balance);
}

/** Future value of an asset appreciating at a constant annual rate. */
function appreciatedValue(value: number, annualRate: number, years: number): number {
  return value * Math.pow(1 + annualRate, years);
}

export interface MortgageOptions {
  assumptions?: Partial<MortgageAssumptions>;
  profile?: BuyerProfile;
  /** Use the wife's high-hours income for DTI (default: low / conservative). */
  wifeHours?: "low" | "high";
}

/**
 * Compute the full PITI + reserves picture for a listing under a set of
 * assumptions. Falls back to rate-based estimates when the listing doesn't
 * carry its own tax/insurance figures.
 */
export function analyzeMortgage(listing: Listing, opts: MortgageOptions = {}): MortgageBreakdown {
  const a: MortgageAssumptions = { ...DEFAULT_ASSUMPTIONS, ...opts.assumptions };
  const profile = opts.profile ?? BUYER_PROFILE;

  const homePrice = listing.price;
  const downPaymentPct = a.downPaymentPct;
  const downPayment = homePrice * downPaymentPct;
  const loanAmount = homePrice - downPayment;

  const principalAndInterest = monthlyPI(loanAmount, a.interestRate, a.termYears);

  // Prefer the listing's own carried figures; otherwise estimate from rates.
  const annualTaxes = listing.annualTaxes || homePrice * a.propertyTaxRate;
  const annualInsurance = listing.estInsuranceAnnual || homePrice * a.insuranceRate;
  const annualFlood = listing.estFloodInsuranceAnnual || 0;

  const monthlyTaxes = annualTaxes / 12;
  const monthlyInsurance = annualInsurance / 12;
  const monthlyFlood = annualFlood / 12;
  const monthlyHOA = listing.hoaMonthly;

  const pmiRequired = downPaymentPct < 0.2;
  const monthlyPMI = pmiRequired ? (loanAmount * a.pmiRate) / 12 : 0;

  const totalMonthly =
    principalAndInterest + monthlyTaxes + monthlyInsurance + monthlyFlood + monthlyHOA + monthlyPMI;

  // Cash to close
  const closingCosts = homePrice * a.closingCostPct;
  const concessions = listing.sellerConcessions || 0;
  const cashToClose = downPayment + closingCosts - concessions;

  const saleProceeds = estimateSaleProceeds(profile);
  const emergencyFundRemaining = saleProceeds - cashToClose;

  // DTI
  const grossMonthly = householdMonthlyIncome(profile, opts.wifeHours ?? "low");
  const dtiFront = totalMonthly / grossMonthly;
  const dtiBack = (totalMonthly + profile.income.otherMonthlyDebts) / grossMonthly;

  // Reserves & long-horizon costs
  const maintenanceReserveMonthly = (homePrice * a.maintenanceRatePct) / 12;
  const carryMonthly = totalMonthly + maintenanceReserveMonthly;

  const fiveYearCost = carryMonthly * 60 + cashToClose;
  const tenYearCost = carryMonthly * 120 + cashToClose;

  // Equity = appreciated value − remaining loan balance.
  const value5 = appreciatedValue(homePrice, a.appreciationRate, 5);
  const value10 = appreciatedValue(homePrice, a.appreciationRate, 10);
  const bal5 = remainingBalance(loanAmount, a.interestRate, a.termYears, 60);
  const bal10 = remainingBalance(loanAmount, a.interestRate, a.termYears, 120);
  const projectedEquity5yr = value5 - bal5;
  const projectedEquity10yr = value10 - bal10;

  // Break-even vs renting a comparable home: months until cumulative owning
  // cost (net of equity built + appreciation) drops below cumulative rent.
  const breakEvenMonths = estimateBreakEven({
    cashToClose,
    carryMonthly,
    rent: a.rentComparable,
    homePrice,
    loanAmount,
    annualRate: a.interestRate,
    termYears: a.termYears,
    appreciationRate: a.appreciationRate,
  });

  return {
    homePrice,
    downPaymentPct,
    downPayment,
    loanAmount,
    interestRate: a.interestRate,
    termYears: a.termYears,
    principalAndInterest,
    monthlyTaxes,
    monthlyInsurance,
    monthlyFlood,
    monthlyHOA,
    monthlyPMI,
    totalMonthly,
    closingCosts,
    cashToClose,
    emergencyFundRemaining,
    dtiFront,
    dtiBack,
    pmiRequired,
    maintenanceReserveMonthly,
    fiveYearCost,
    tenYearCost,
    breakEvenMonths,
    projectedEquity5yr,
    projectedEquity10yr,
    estAppreciationRate: a.appreciationRate,
  };
}

interface BreakEvenInput {
  cashToClose: number;
  carryMonthly: number;
  rent: number;
  homePrice: number;
  loanAmount: number;
  annualRate: number;
  termYears: number;
  appreciationRate: number;
}

/**
 * Month at which owning becomes cheaper than renting, accounting for the
 * equity and appreciation an owner accrues. Returns 120 (capped) if owning
 * never beats renting inside 10 years.
 */
function estimateBreakEven(input: BreakEvenInput): number {
  const { cashToClose, carryMonthly, rent, homePrice, loanAmount, annualRate, termYears, appreciationRate } =
    input;
  const rentGrowthMonthly = Math.pow(1.03, 1 / 12); // ~3% annual rent growth
  let cumOwnNet = cashToClose;
  let cumRent = 0;
  let rentNow = rent;
  for (let m = 1; m <= 120; m++) {
    cumOwnNet += carryMonthly;
    cumRent += rentNow;
    rentNow *= rentGrowthMonthly;

    const years = m / 12;
    const value = homePrice * Math.pow(1 + appreciationRate, years);
    const bal = remainingBalance(loanAmount, annualRate, termYears, m);
    const equity = value - bal - homePrice * 0.07; // net of future selling costs
    const netOwnCost = cumOwnNet - equity;
    if (netOwnCost <= cumRent) return m;
  }
  return 120;
}

/** Convenience: total monthly payment only, for quick filtering. */
export function quickMonthly(listing: Listing, assumptions?: Partial<MortgageAssumptions>): number {
  return analyzeMortgage(listing, { assumptions }).totalMonthly;
}
