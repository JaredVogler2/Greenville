/**
 * Excel workbook export (SheetJS).
 *
 * Produces the downloadable workbook described in the spec: one ranked row
 * per home with every required column, clickable Zillow/Realtor/Redfin/Maps/
 * tour links, plus supporting "Assumptions", "Neighborhoods" and "Pilot
 * Career" sheets. Runs server-side in the /api/export route.
 */

import * as XLSX from "xlsx";
import type { AnalyzedHome } from "./types";
import { DEFAULT_ASSUMPTIONS, type MortgageAssumptions } from "./profile";
import { NEIGHBORHOODS } from "./neighborhoods";
import { pilotProjection } from "./pilot";

type Cell = string | number | { v: string; l: { Target: string; Tooltip?: string } };

const HEADERS = [
  "Overall Rank",
  "Recommendation",
  "Score",
  "Address",
  "Neighborhood",
  "City",
  "ZIP",
  "Price",
  "Monthly Payment",
  "Down Payment",
  "Interest Rate",
  "Bedrooms",
  "Bathrooms",
  "Square Feet",
  "Lot Size (ac)",
  "Price/Sq Ft",
  "Garage",
  "Year Built",
  "Age",
  "HOA",
  "Taxes",
  "Insurance",
  "Flood",
  "PMI",
  "Est. Maintenance",
  "Commute CHS (min)",
  "Commute Downtown (min)",
  "Flood Zone",
  "School Ratings (E/M/H)",
  "Crime (1-10)",
  "Builder",
  "Days on Market",
  "Price Changes",
  "Investment Score",
  "Family Score",
  "Airport Score",
  "Notes",
  "Zillow",
  "Realtor",
  "Redfin",
  "Google Maps",
  "Virtual Tour",
];

const link = (target: string | undefined, label = "Open"): Cell =>
  target ? { v: label, l: { Target: target, Tooltip: target } } : "";

function rowFor(h: AnalyzedHome): Cell[] {
  const l = h.listing;
  const m = h.mortgage;
  const schools = `${l.schools.elementary.rating}/${l.schools.middle.rating}/${l.schools.high.rating}`;
  const priceChanges = l.priceHistory.length > 1 ? `${l.priceHistory.length - 1} cut(s)` : "none";
  const notes = `${h.score.recommendation}. ${h.insight.summary}`;
  return [
    h.rank,
    h.score.recommendation,
    h.score.overall,
    l.address,
    l.neighborhood,
    l.city,
    l.zip,
    l.price,
    Math.round(m.totalMonthly),
    Math.round(m.downPayment),
    +(m.interestRate * 100).toFixed(3),
    l.bedrooms,
    l.bathrooms,
    l.sqft,
    l.lotSizeAcres,
    h.pricePerSqft,
    l.garageSpaces,
    l.yearBuilt,
    h.homeAge,
    l.hoaMonthly,
    Math.round(m.monthlyTaxes),
    Math.round(m.monthlyInsurance),
    Math.round(m.monthlyFlood),
    Math.round(m.monthlyPMI),
    Math.round(m.maintenanceReserveMonthly),
    l.commute.airportCHS,
    l.commute.downtown,
    l.floodZone,
    schools,
    l.crimeRating,
    l.builder,
    l.daysOnMarket,
    priceChanges,
    h.score.investmentScore,
    h.score.familyScore,
    h.score.airportScore,
    notes,
    link(l.listingUrls.zillow, "Zillow"),
    link(l.listingUrls.realtor, "Realtor"),
    link(l.listingUrls.redfin, "Redfin"),
    link(l.listingUrls.googleMaps, "Map"),
    link(l.listingUrls.virtualTour, "Tour"),
  ];
}

function buildListingsSheet(homes: AnalyzedHome[]): XLSX.WorkSheet {
  const aoa: Cell[][] = [HEADERS, ...homes.map(rowFor)];
  const ws = XLSX.utils.aoa_to_sheet(aoa as XLSX.CellObject[][]);
  // Column widths
  ws["!cols"] = HEADERS.map((hh) => ({ wch: Math.min(40, Math.max(8, hh.length + 2)) }));
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: homes.length, c: HEADERS.length - 1 } }) };
  ws["!freeze"] = { xSplit: "4", ySplit: "1", topLeftCell: "E2", activePane: "bottomRight", state: "frozen" };
  return ws;
}

function buildAssumptionsSheet(a: MortgageAssumptions): XLSX.WorkSheet {
  const rows: (string | number)[][] = [
    ["Charleston Home Search — Mortgage & Financial Assumptions", ""],
    ["", ""],
    ["Down Payment %", `${(a.downPaymentPct * 100).toFixed(0)}%`],
    ["Interest Rate", `${(a.interestRate * 100).toFixed(3)}%`],
    ["Loan Term (years)", a.termYears],
    ["Property Tax Rate (effective)", `${(a.propertyTaxRate * 100).toFixed(2)}%`],
    ["Insurance Rate", `${(a.insuranceRate * 100).toFixed(2)}%`],
    ["PMI Rate (when DP < 20%)", `${(a.pmiRate * 100).toFixed(2)}%`],
    ["Closing Cost %", `${(a.closingCostPct * 100).toFixed(2)}%`],
    ["Maintenance Reserve %/yr", `${(a.maintenanceRatePct * 100).toFixed(2)}%`],
    ["Assumed Appreciation/yr", `${(a.appreciationRate * 100).toFixed(2)}%`],
    ["Comparable Rent (break-even)", a.rentComparable],
    ["", ""],
    ["Note", "Figures are planning estimates. Taxes/insurance/flood prefer each listing's carried value; otherwise estimated from the rates above."],
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

function buildNeighborhoodsSheet(): XLSX.WorkSheet {
  const header = ["Community", "Submarket", "Desirability", "Growth", "Family", "Priority", "Notes"];
  const rows = NEIGHBORHOODS.map((n) => [n.name, n.area, n.desirability, n.growth, n.family, n.priority, n.blurb]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws["!cols"] = [{ wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 9 }, { wch: 70 }];
  return ws;
}

function buildPilotSheet(): XLSX.WorkSheet {
  const proj = pilotProjection();
  const rows: (string | number)[][] = [
    ["Pilot Career Projection (husband)", ""],
    ["", ""],
    ["Current flight hours", proj.timeline.currentHours],
    ["Building (hrs/week)", proj.timeline.hoursPerWeek],
    ["Months to Restricted ATP (~1,250 hr)", proj.timeline.monthsToRestrictedAtp],
    ["Months to Full ATP (1,500 hr)", proj.timeline.monthsToFullAtp],
    ["", ""],
    ["Stage", "Years", "Low", "Expected", "High"],
    ...proj.stages.map((s) => [s.stage, s.typicalYears, s.annual.low, s.annual.expected, s.annual.high]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 34 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
  return ws;
}

/** Build the full workbook as a Node Buffer (xlsx). */
export function buildWorkbook(
  homes: AnalyzedHome[],
  assumptions: MortgageAssumptions = DEFAULT_ASSUMPTIONS,
): Buffer {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildListingsSheet(homes), "Ranked Homes");
  XLSX.utils.book_append_sheet(wb, buildAssumptionsSheet(assumptions), "Assumptions");
  XLSX.utils.book_append_sheet(wb, buildNeighborhoodsSheet(), "Neighborhoods");
  XLSX.utils.book_append_sheet(wb, buildPilotSheet(), "Pilot Career");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
