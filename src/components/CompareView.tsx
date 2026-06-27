"use client";

import * as React from "react";
import { X } from "lucide-react";
import type { AnalyzedHome } from "@/lib/types";
import { usd, pct } from "@/lib/format";
import { Card, RecBadge, ScorePill } from "./ui";
import { cn } from "@/lib/cn";

interface Props {
  homes: AnalyzedHome[];
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
}

type Better = "high" | "low" | "none";
interface Row {
  label: string;
  get: (h: AnalyzedHome) => number;
  fmt: (h: AnalyzedHome) => React.ReactNode;
  better: Better;
}

const ROWS: Row[] = [
  { label: "Overall score", get: (h) => h.score.overall, fmt: (h) => <ScorePill score={h.score.overall} />, better: "high" },
  { label: "Price", get: (h) => h.listing.price, fmt: (h) => usd(h.listing.price), better: "low" },
  { label: "Monthly payment", get: (h) => h.mortgage.totalMonthly, fmt: (h) => usd(h.mortgage.totalMonthly), better: "low" },
  { label: "Cash to close", get: (h) => h.mortgage.cashToClose, fmt: (h) => usd(h.mortgage.cashToClose), better: "low" },
  { label: "DTI (front)", get: (h) => h.mortgage.dtiFront, fmt: (h) => pct(h.mortgage.dtiFront), better: "low" },
  { label: "$/sqft", get: (h) => h.pricePerSqft, fmt: (h) => usd(h.pricePerSqft), better: "low" },
  { label: "Sq ft", get: (h) => h.listing.sqft, fmt: (h) => h.listing.sqft.toLocaleString(), better: "high" },
  { label: "Beds / baths", get: (h) => h.listing.bedrooms, fmt: (h) => `${h.listing.bedrooms} / ${h.listing.bathrooms}`, better: "high" },
  { label: "Year built", get: (h) => h.listing.yearBuilt, fmt: (h) => String(h.listing.yearBuilt), better: "high" },
  { label: "HOA / mo", get: (h) => h.listing.hoaMonthly, fmt: (h) => usd(h.listing.hoaMonthly), better: "low" },
  { label: "Taxes / mo", get: (h) => h.mortgage.monthlyTaxes, fmt: (h) => usd(h.mortgage.monthlyTaxes), better: "low" },
  { label: "Insurance / yr", get: (h) => h.insurance.totalAnnual, fmt: (h) => usd(h.insurance.totalAnnual), better: "low" },
  { label: "CHS commute", get: (h) => h.listing.commute.airportCHS, fmt: (h) => `${h.listing.commute.airportCHS} min`, better: "low" },
  { label: "Downtown commute", get: (h) => h.listing.commute.downtown, fmt: (h) => `${h.listing.commute.downtown} min`, better: "low" },
  { label: "Flood zone", get: (h) => (h.flood.insuranceRequired ? 0 : 1), fmt: (h) => h.listing.floodZone, better: "high" },
  {
    label: "School avg",
    get: (h) => (h.listing.schools.elementary.rating + h.listing.schools.middle.rating + h.listing.schools.high.rating) / 3,
    fmt: (h) => ((h.listing.schools.elementary.rating + h.listing.schools.middle.rating + h.listing.schools.high.rating) / 3).toFixed(1),
    better: "high",
  },
  { label: "Crime (safety)", get: (h) => h.listing.crimeRating, fmt: (h) => `${h.listing.crimeRating}/10`, better: "high" },
  { label: "Walk score", get: (h) => h.listing.walkScore, fmt: (h) => String(h.listing.walkScore), better: "high" },
  { label: "5-yr equity", get: (h) => h.mortgage.projectedEquity5yr, fmt: (h) => usd(h.mortgage.projectedEquity5yr), better: "high" },
  { label: "Investment score", get: (h) => h.score.investmentScore, fmt: (h) => String(h.score.investmentScore), better: "high" },
  { label: "Family score", get: (h) => h.score.familyScore, fmt: (h) => String(h.score.familyScore), better: "high" },
  { label: "Airport score", get: (h) => h.score.airportScore, fmt: (h) => String(h.score.airportScore), better: "high" },
];

export function CompareView({ homes, onRemove, onSelect }: Props) {
  if (homes.length === 0) {
    return (
      <Card className="p-10 text-center text-slate-400">
        Select homes with the compare checkbox (in the table) to line them up side by side.
      </Card>
    );
  }

  const bestId = (row: Row): string | null => {
    if (row.better === "none") return null;
    let best: AnalyzedHome | null = null;
    for (const h of homes) {
      if (!best) best = h;
      else if (row.better === "high" ? row.get(h) > row.get(best) : row.get(h) < row.get(best)) best = h;
    }
    return best?.listing.id ?? null;
  };

  return (
    <Card className="overflow-auto scroll-thin">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="sticky left-0 z-10 bg-slate-50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Metric
            </th>
            {homes.map((h) => (
              <th key={h.listing.id} className="min-w-44 px-3 py-3 text-left align-top">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => onSelect(h.listing.id)} className="text-left">
                    <div className="font-semibold text-slate-800 hover:text-harbor-600">{h.listing.neighborhood}</div>
                    <div className="text-xs font-normal text-slate-500">{h.listing.address}</div>
                    <div className="mt-1"><RecBadge rec={h.score.recommendation} /></div>
                  </button>
                  <button onClick={() => onRemove(h.listing.id)} className="rounded p-0.5 text-slate-400 hover:bg-slate-200">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => {
            const best = bestId(row);
            return (
              <tr key={row.label} className="border-b border-slate-100">
                <td className="sticky left-0 z-10 bg-white px-3 py-2 text-xs font-medium text-slate-500">{row.label}</td>
                {homes.map((h) => (
                  <td
                    key={h.listing.id}
                    className={cn(
                      "px-3 py-2 tabular",
                      best === h.listing.id && homes.length > 1 ? "bg-emerald-50 font-semibold text-emerald-800" : "text-slate-700",
                    )}
                  >
                    {row.fmt(h)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
