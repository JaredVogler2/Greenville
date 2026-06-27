"use client";

import * as React from "react";
import type { Listing } from "@/lib/types";
import type { MortgageAssumptions } from "@/lib/profile";
import { BUYER_PROFILE, estimateSaleProceeds, householdMonthlyIncome } from "@/lib/profile";
import { analyzeMortgage } from "@/lib/mortgage";
import { pilotProjection } from "@/lib/pilot";
import { usd, pct } from "@/lib/format";
import { Card, SectionTitle, Stat } from "./ui";
import { cn } from "@/lib/cn";

interface Props {
  assumptions: MortgageAssumptions;
  wifeHours: "low" | "high";
}

function stubListing(price: number, hoaMonthly: number): Listing {
  return {
    price,
    hoaMonthly,
    annualTaxes: 0,
    estInsuranceAnnual: 0,
    estFloodInsuranceAnnual: 0,
    sellerConcessions: 0,
  } as unknown as Listing;
}

export function FinancialSummary({ assumptions, wifeHours }: Props) {
  const [price, setPrice] = React.useState(475_000);
  const [hoa, setHoa] = React.useState(90);

  const proceeds = estimateSaleProceeds();
  const income = householdMonthlyIncome(BUYER_PROFILE, wifeHours);
  const proj = pilotProjection();

  const scenarios = ([0.1, 0.15, 0.2] as const).map((dp) => {
    const m = analyzeMortgage(stubListing(price, hoa), {
      assumptions: { ...assumptions, downPaymentPct: dp },
      wifeHours,
    });
    return { dp, m };
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <SectionTitle hint="Greenville, SC">Current home &amp; funds</SectionTitle>
          <div className="space-y-2">
            <Stat label="Est. current value" value={usd(BUYER_PROFILE.currentHome.estCurrentValue)} sub={`Bought ${BUYER_PROFILE.currentHome.purchaseDate} for ${usd(BUYER_PROFILE.currentHome.purchasePrice)}`} />
            <Stat
              label="Est. net sale proceeds"
              value={usd(proceeds)}
              accent
              sub={`After ${pct(BUYER_PROFILE.currentHome.sellingCostPct, 0)} selling costs & ${usd(BUYER_PROFILE.currentHome.remainingMortgage)} payoff`}
            />
            <Stat label="Household income (gross/mo)" value={usd(income)} sub={wifeHours === "low" ? "Wife at 35 hrs (~$172k/yr)" : "Wife at 40 hrs (~$183k/yr)"} />
          </div>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <SectionTitle hint="adjust price & HOA">Down-payment scenarios</SectionTitle>
          <div className="mb-3 flex flex-wrap gap-3">
            <label className="text-xs font-medium text-slate-500">
              Home price
              <input
                type="number"
                value={price}
                step={5000}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="ml-2 w-32 rounded-md border border-slate-300 px-2 py-1 text-sm tabular"
              />
            </label>
            <label className="text-xs font-medium text-slate-500">
              HOA/mo
              <input
                type="number"
                value={hoa}
                step={10}
                onChange={(e) => setHoa(Number(e.target.value) || 0)}
                className="ml-2 w-24 rounded-md border border-slate-300 px-2 py-1 text-sm tabular"
              />
            </label>
          </div>
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 text-left">Metric</th>
                  {scenarios.map((s) => (
                    <th key={s.dp} className="py-2 text-right">{Math.round(s.dp * 100)}% down</th>
                  ))}
                </tr>
              </thead>
              <tbody className="tabular">
                {[
                  { label: "Down payment", get: (m: (typeof scenarios)[0]["m"]) => usd(m.downPayment) },
                  { label: "Loan amount", get: (m: (typeof scenarios)[0]["m"]) => usd(m.loanAmount) },
                  { label: "Total monthly", get: (m: (typeof scenarios)[0]["m"]) => usd(m.totalMonthly), bold: true },
                  { label: "— incl. PMI", get: (m: (typeof scenarios)[0]["m"]) => (m.monthlyPMI > 0 ? usd(m.monthlyPMI) : "—") },
                  { label: "Cash to close", get: (m: (typeof scenarios)[0]["m"]) => usd(m.cashToClose) },
                  { label: "Emergency fund left", get: (m: (typeof scenarios)[0]["m"]) => usd(m.emergencyFundRemaining) },
                  { label: "DTI (front)", get: (m: (typeof scenarios)[0]["m"]) => pct(m.dtiFront) },
                  { label: "DTI (back)", get: (m: (typeof scenarios)[0]["m"]) => pct(m.dtiBack) },
                ].map((row) => (
                  <tr key={row.label} className="border-b border-slate-100">
                    <td className={cn("py-1.5 text-left text-slate-500", row.bold && "font-semibold text-slate-700")}>{row.label}</td>
                    {scenarios.map((s) => {
                      const overBudget = row.label === "Total monthly" && s.m.totalMonthly > BUYER_PROFILE.budget.targetMonthlyHigh;
                      return (
                        <td
                          key={s.dp}
                          className={cn("py-1.5 text-right", row.bold && "font-semibold", overBudget ? "text-rose-600" : "text-slate-700")}
                        >
                          {row.get(s.m)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Target all-in payment: {usd(BUYER_PROFILE.budget.targetMonthlyLow)}–{usd(BUYER_PROFILE.budget.targetMonthlyHigh)}/mo. Red = over budget. Taxes &amp; insurance estimated from the rate assumptions.
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <SectionTitle hint="husband — commercial airline track">Pilot career projection</SectionTitle>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Current hours" value={proj.timeline.currentHours} sub={`+${proj.timeline.hoursPerWeek}/week`} />
          <Stat label="To Restricted ATP" value={`~${proj.timeline.monthsToRestrictedAtp} mo`} sub="~1,250 hr pathway" />
          <Stat label="To Full ATP" value={`~${proj.timeline.monthsToFullAtp} mo`} sub="1,500 hr minimum" accent />
          <Stat label="Today's income" value={usd(BUYER_PROFILE.income.husbandCurrentSalary)} sub="CFI / hour-building" />
        </div>
        <div className="mt-3 overflow-x-auto scroll-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 text-left">Career stage</th>
                <th className="py-2 text-left">Window</th>
                <th className="py-2 text-right">Low</th>
                <th className="py-2 text-right">Expected</th>
                <th className="py-2 text-right">High</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {proj.stages.map((s) => (
                <tr key={s.stage} className="border-b border-slate-100">
                  <td className="py-1.5 text-left font-medium text-slate-700">{s.stage}</td>
                  <td className="py-1.5 text-left text-slate-500">{s.typicalYears}</td>
                  <td className="py-1.5 text-right text-slate-600">{usd(s.annual.low)}</td>
                  <td className="py-1.5 text-right font-semibold text-harbor-700">{usd(s.annual.expected)}</td>
                  <td className="py-1.5 text-right text-slate-600">{usd(s.annual.high)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">{proj.timeline.note}</p>
      </Card>
    </div>
  );
}
