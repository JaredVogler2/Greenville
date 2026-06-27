"use client";

import * as React from "react";
import {
  X,
  ExternalLink,
  TrendingUp,
  Droplets,
  ShieldCheck,
  Car,
  GraduationCap,
  Home,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Handshake,
} from "lucide-react";
import type { AnalyzedHome } from "@/lib/types";
import { usd, pct, num } from "@/lib/format";
import { SCORE_WEIGHTS } from "@/lib/scoring";
import { RecBadge, ScorePill, SectionTitle } from "./ui";
import { cn } from "@/lib/cn";

interface Props {
  home: AnalyzedHome | null;
  onClose: () => void;
}

function Bar({ value, max = 100, color = "bg-harbor-500" }: { value: number; max?: number; color?: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100">
      <div className={cn("h-1.5 rounded-full", color)} style={{ width: `${Math.max(2, Math.min(100, (value / max) * 100))}%` }} />
    </div>
  );
}

function KV({ k, v, strong }: { k: string; v: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-slate-500">{k}</span>
      <span className={cn("tabular", strong ? "font-semibold text-slate-800" : "text-slate-700")}>{v}</span>
    </div>
  );
}

const COMPONENT_LABELS: { key: keyof typeof SCORE_WEIGHTS; label: string }[] = [
  { key: "financialValue", label: "Financial value" },
  { key: "commute", label: "Commute" },
  { key: "schools", label: "Schools" },
  { key: "floodRisk", label: "Flood risk" },
  { key: "appreciation", label: "Appreciation" },
  { key: "homeCondition", label: "Home condition" },
  { key: "hoa", label: "HOA" },
  { key: "neighborhood", label: "Neighborhood" },
];

export function HomeDetail({ home, onClose }: Props) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (home) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [home, onClose]);

  if (!home) return null;
  const { listing: l, mortgage: m, score, flood, insurance, commute, insight } = home;
  const dist = l.commute;

  const links: [string, string | undefined][] = [
    ["Zillow", l.listingUrls.zillow],
    ["Realtor", l.listingUrls.realtor],
    ["Redfin", l.listingUrls.redfin],
    ["Google Maps", l.listingUrls.googleMaps],
    ["Virtual Tour", l.listingUrls.virtualTour],
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-2xl flex-col bg-slate-50 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="tabular text-xs font-semibold text-slate-400">Rank #{home.rank}</span>
              <RecBadge rec={score.recommendation} />
            </div>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900">{l.address}</h2>
            <p className="text-sm text-slate-500">
              {l.subdivision}, {l.city} {l.zip} · {l.county} County · MLS {l.mlsId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ScorePill score={score.overall} className="h-9 w-12 text-base" />
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="scroll-thin flex-1 space-y-4 overflow-y-auto p-5">
          {/* Photo */}
          <div className="grid grid-cols-4 gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.photos[0]} alt="" className="col-span-4 h-48 w-full rounded-lg object-cover sm:h-56" />
          </div>

          {/* Price + key facts */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{usd(l.price)}</div>
                <div className="text-sm text-slate-500">{usd(home.pricePerSqft)}/sqft · {l.builder} · {l.propertyType}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-harbor-700">{usd(m.totalMonthly)}<span className="text-sm font-normal text-slate-400">/mo</span></div>
                <div className="text-xs text-slate-500">all-in at {pct(m.downPaymentPct, 0)} down</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {[
                ["Beds", l.bedrooms],
                ["Baths", `${l.bathrooms}${l.halfBaths ? `+${l.halfBaths}h` : ""}`],
                ["Sq ft", num(l.sqft)],
                ["Year", l.yearBuilt],
                ["Garage", l.garageSpaces],
                ["Lot ac", l.lotSizeAcres],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">{k}</div>
                  <div className="tabular text-sm font-semibold text-slate-700">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Insight */}
          <div className="rounded-xl border border-harbor-200 bg-harbor-50/60 p-4">
            <SectionTitle hint="generated analysis">Analyst summary</SectionTitle>
            <p className="text-sm leading-relaxed text-slate-700">{insight.summary}</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {insight.pros.length > 0 && (
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><ThumbsUp className="h-3.5 w-3.5" /> Pros</div>
                  <ul className="space-y-1 text-xs text-slate-600">{insight.pros.map((p, i) => <li key={i}>• {p}</li>)}</ul>
                </div>
              )}
              {insight.cons.length > 0 && (
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-rose-700"><ThumbsDown className="h-3.5 w-3.5" /> Cons</div>
                  <ul className="space-y-1 text-xs text-slate-600">{insight.cons.map((p, i) => <li key={i}>• {p}</li>)}</ul>
                </div>
              )}
            </div>
            {insight.risks.length > 0 && (
              <div className="mt-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-700"><AlertTriangle className="h-3.5 w-3.5" /> Risks</div>
                <ul className="space-y-1 text-xs text-slate-600">{insight.risks.map((p, i) => <li key={i}>• {p}</li>)}</ul>
              </div>
            )}
            <div className="mt-3 rounded-lg bg-white p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700"><Handshake className="h-3.5 w-3.5" /> Negotiation &amp; offer</div>
              <p className="text-xs text-slate-600">{insight.negotiation}</p>
              <p className="mt-1 text-xs font-medium text-harbor-700">{insight.offerRecommendation}</p>
            </div>
          </div>

          {/* Payment + score side by side */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <SectionTitle hint="monthly">Payment breakdown</SectionTitle>
              <KV k="Principal & interest" v={usd(m.principalAndInterest)} />
              <KV k="Property taxes" v={usd(m.monthlyTaxes)} />
              <KV k="Insurance (HO + wind)" v={usd(m.monthlyInsurance)} />
              <KV k="Flood insurance" v={usd(m.monthlyFlood)} />
              <KV k="HOA" v={usd(m.monthlyHOA)} />
              <KV k="PMI" v={m.pmiRequired ? usd(m.monthlyPMI) : "—"} />
              <div className="my-1 border-t border-slate-100" />
              <KV k="Total payment" v={usd(m.totalMonthly)} strong />
              <KV k="+ Maintenance reserve" v={usd(m.maintenanceReserveMonthly)} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <SectionTitle hint="weighted 0–100">Score breakdown</SectionTitle>
              <div className="space-y-2">
                {COMPONENT_LABELS.map(({ key, label }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{label} <span className="text-slate-300">({Math.round(SCORE_WEIGHTS[key] * 100)}%)</span></span>
                      <span className="tabular font-medium text-slate-700">{score.components[key]}</span>
                    </div>
                    <Bar value={score.components[key]} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cash & long-term */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <SectionTitle>Cash &amp; ratios</SectionTitle>
              <KV k="Down payment" v={usd(m.downPayment)} />
              <KV k="Closing costs" v={usd(m.closingCosts)} />
              {l.sellerConcessions > 0 && <KV k="Seller concessions" v={`−${usd(l.sellerConcessions)}`} />}
              <KV k="Cash to close" v={usd(m.cashToClose)} strong />
              <KV k="Emergency fund left" v={usd(m.emergencyFundRemaining)} />
              <KV k="DTI (front / back)" v={`${pct(m.dtiFront)} / ${pct(m.dtiBack)}`} />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <SectionTitle hint="ownership horizon">Long-term outlook</SectionTitle>
              <KV k="5-yr total cost" v={usd(m.fiveYearCost)} />
              <KV k="10-yr total cost" v={usd(m.tenYearCost)} />
              <KV k="Projected 5-yr equity" v={usd(m.projectedEquity5yr)} strong />
              <KV k="Projected 10-yr equity" v={usd(m.projectedEquity10yr)} />
              <KV k="Break-even vs. renting" v={m.breakEvenMonths >= 120 ? "10+ yrs" : `~${m.breakEvenMonths} mo`} />
              <KV k="Assumed appreciation" v={pct(m.estAppreciationRate)} />
            </div>
          </div>

          {/* Sub-scores */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: TrendingUp, label: "Investment", val: score.investmentScore },
              { icon: Home, label: "Family", val: score.familyScore },
              { icon: Car, label: "Airport / pilot", val: score.airportScore },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                <Icon className="mx-auto h-4 w-4 text-harbor-500" />
                <div className="mt-1 tabular text-2xl font-bold text-slate-800">{val}</div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
              </div>
            ))}
          </div>

          {/* Risk analysis */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700"><Droplets className="h-4 w-4 text-sky-500" /> Flood — Zone {flood.zone}</div>
              <p className="text-xs text-slate-600">{flood.riskLevel} risk · {flood.insuranceRequired ? "insurance required" : "insurance optional"}.</p>
              <p className="mt-1 text-xs text-slate-500">{flood.elevationNote}</p>
              <p className="mt-1 text-xs text-slate-500">{flood.notes}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Insurance</div>
              <KV k="Homeowners" v={usd(insurance.homeowners)} />
              <KV k="Wind / hail" v={usd(insurance.wind)} />
              <KV k="Flood" v={usd(insurance.flood)} />
              <KV k="Total / yr" v={usd(insurance.totalAnnual)} strong />
              <p className="mt-1 text-xs text-slate-500">Future increase risk: <span className="font-medium">{insurance.futureIncreaseRisk}</span>. {insurance.notes}</p>
            </div>
          </div>

          {/* Schools + commute */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700"><GraduationCap className="h-4 w-4 text-violet-500" /> Schools — {l.schools.district}</div>
              <KV k={`Elementary · ${l.schools.elementary.name}`} v={`${l.schools.elementary.rating}/10`} />
              <KV k={`Middle · ${l.schools.middle.name}`} v={`${l.schools.middle.rating}/10`} />
              <KV k={`High · ${l.schools.high.name}`} v={`${l.schools.high.rating}/10`} />
              <div className="mt-2 border-t border-slate-100 pt-2">
                <KV k="Crime (safety)" v={`${l.crimeRating}/10`} />
                <KV k="Walk / Bike / Transit" v={`${l.walkScore} / ${l.bikeScore} / ${l.transitScore}`} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700"><Car className="h-4 w-4 text-harbor-500" /> Drive times (weekday ~3pm)</div>
              <div className="grid grid-cols-2 gap-x-4">
                {[
                  ["CHS airport", dist.airportCHS],
                  ["Downtown", dist.downtown],
                  ["Beach", dist.beach],
                  ["Boeing", dist.boeing],
                  ["Joint Base", dist.jointBaseCharleston],
                  ["Hospital", dist.hospital],
                  ["Flight school", dist.flightSchool],
                  ["Costco", dist.costco],
                  ["Publix", dist.publix],
                  ["Boat ramp", dist.boatRamp],
                ].map(([k, v]) => (
                  <KV key={k} k={k as string} v={`${v} min`} />
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">{commute.notes}</p>
            </div>
          </div>

          {/* Condition + market */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <SectionTitle>Condition &amp; market</SectionTitle>
            <div className="grid grid-cols-2 gap-x-4">
              <KV k="Roof age" v={`${l.condition.roofAgeYears} yr`} />
              <KV k="HVAC age" v={`${l.condition.hvacAgeYears} yr`} />
              <KV k="Water heater" v={l.condition.waterHeater} />
              <KV k="Exterior" v={l.condition.exteriorMaterial} />
              <KV k="Internet" v={l.condition.internet} />
              <KV k="Days on market" v={`${l.daysOnMarket}`} />
            </div>
            <div className="mt-1 text-xs text-slate-500">Energy: {l.condition.energyFeatures.join(", ")}</div>
            <div className="mt-1 text-xs text-slate-500">
              Price history: {l.priceHistory.map((p) => `${usd(p.price)} (${p.date})`).join(" → ")} · Listing: {l.listingAgent}
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-2 pb-2">
            {links.map(([label, url]) =>
              url ? (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {label} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null,
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
