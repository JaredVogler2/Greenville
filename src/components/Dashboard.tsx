"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  Plane,
  Home as HomeIcon,
  Map as MapIcon,
  Table as TableIcon,
  BarChart3,
  GitCompare,
  Wallet,
  Download,
  Anchor,
} from "lucide-react";
import listingsRaw from "@/data/listings.json";
import type { AnalyzedHome, Listing } from "@/lib/types";
import { analyzeAll } from "@/lib/listings";
import { applyFilters, sortHomes, EMPTY_FILTERS, type FilterState, type SortKey } from "@/lib/filters";
import { DEFAULT_ASSUMPTIONS, BUYER_PROFILE, type MortgageAssumptions } from "@/lib/profile";
import { usd, usdShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Button } from "./ui";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { FiltersPanel } from "./FiltersPanel";
import { SearchBar } from "./SearchBar";
import { HomesTable } from "./HomesTable";
import { ChartsView } from "./ChartsView";
import { CompareView } from "./CompareView";
import { HomeDetail } from "./HomeDetail";
import { FinancialSummary } from "./FinancialSummary";

// Leaflet must not be server-rendered.
const MapView = dynamic(() => import("./MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400">Loading map…</div>,
});

type View = "map" | "table" | "charts" | "compare" | "finance";

const VIEWS: { key: View; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "map", label: "Map", icon: MapIcon },
  { key: "table", label: "Table", icon: TableIcon },
  { key: "charts", label: "Charts", icon: BarChart3 },
  { key: "compare", label: "Compare", icon: GitCompare },
  { key: "finance", label: "Financials", icon: Wallet },
];

const LISTINGS = listingsRaw as unknown as Listing[];

export function Dashboard() {
  const [assumptions, setAssumptions] = React.useState<MortgageAssumptions>(DEFAULT_ASSUMPTIONS);
  const [wifeHours, setWifeHours] = React.useState<"low" | "high">("low");
  const [filters, setFilters] = React.useState<FilterState>(EMPTY_FILTERS);
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "score", dir: "desc" });
  const [view, setView] = React.useState<View>("map");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [compareIds, setCompareIds] = React.useState<string[]>([]);
  const [nlExplanation, setNlExplanation] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);

  const analyzed = React.useMemo<AnalyzedHome[]>(
    () => analyzeAll(LISTINGS, { assumptions, wifeHours }),
    [assumptions, wifeHours],
  );

  const neighborhoods = React.useMemo(
    () => [...new Set(analyzed.map((h) => h.listing.neighborhood))].sort(),
    [analyzed],
  );

  const filtered = React.useMemo(
    () => sortHomes(applyFilters(analyzed, filters), sort.key, sort.dir),
    [analyzed, filters, sort],
  );

  const selectedHome = React.useMemo(
    () => analyzed.find((h) => h.listing.id === selectedId) ?? null,
    [analyzed, selectedId],
  );
  const compareHomes = React.useMemo(
    () => compareIds.map((id) => analyzed.find((h) => h.listing.id === id)).filter(Boolean) as AnalyzedHome[],
    [analyzed, compareIds],
  );

  const toggleCompare = (id: string) =>
    setCompareIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 4 ? prev : [...prev, id]));

  const handleNL = (result: {
    filters: Partial<FilterState>;
    sort?: { key: SortKey; dir: "asc" | "desc" };
    compareNeighborhoods?: string[];
    explanation: string;
  }) => {
    setFilters({ ...EMPTY_FILTERS, ...result.filters });
    if (result.sort) setSort(result.sort);
    setNlExplanation(result.explanation);
    if (result.compareNeighborhoods) {
      const ids = analyzed
        .filter((h) => result.compareNeighborhoods!.includes(h.listing.neighborhood))
        .sort((a, b) => b.score.overall - a.score.overall)
        .slice(0, 4)
        .map((h) => h.listing.id);
      setCompareIds(ids);
      setView("compare");
    } else {
      setView("table");
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assumptions, wifeHours, ids: filtered.map((h) => h.listing.id) }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "charleston-home-analysis.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  // KPIs
  const inBudget = filtered.filter((h) => h.mortgage.totalMonthly <= BUYER_PROFILE.budget.targetMonthlyHigh).length;
  const strongBuys = filtered.filter((h) => h.score.recommendation === "Strong Buy").length;
  const medianPrice = filtered.length
    ? [...filtered].sort((a, b) => a.listing.price - b.listing.price)[Math.floor(filtered.length / 2)].listing.price
    : 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-harbor-600 text-white">
              <Anchor className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-slate-900">Charleston Home Search &amp; Analysis</h1>
              <p className="text-xs text-slate-500">Relocation analysis · Greenville → Charleston metro · {analyzed.length} homes, {neighborhoods.length} communities</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 md:flex">
              <Kpi label="In budget" value={`${inBudget}/${filtered.length}`} />
              <Kpi label="Strong buys" value={String(strongBuys)} />
              <Kpi label="Median" value={usdShort(medianPrice)} />
            </div>
            <Button onClick={handleExport} disabled={exporting}>
              <Download className="h-4 w-4" /> {exporting ? "Building…" : "Excel"}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1500px] flex-1 gap-4 px-4 py-4">
        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 space-y-4 lg:block">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <AssumptionsPanel assumptions={assumptions} onChange={setAssumptions} wifeHours={wifeHours} onWifeHoursChange={setWifeHours} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <FiltersPanel filters={filters} onChange={setFilters} neighborhoods={neighborhoods} onReset={() => { setFilters(EMPTY_FILTERS); setNlExplanation(null); }} />
          </div>
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <strong>Demo data:</strong> these {analyzed.length} homes are realistic <em>samples</em>, not live MLS listings — the Zillow/Realtor/Redfin links open <strong>live for-sale searches</strong> for each home&apos;s ZIP. Wire a real feed (MLS/RESO, a CSV export, or a listings API) to populate actual homes — see the README.
          </div>
          <SearchBar onApply={handleNL} />
          {nlExplanation ? (
            <div className="rounded-lg border border-harbor-200 bg-harbor-50 px-3 py-1.5 text-xs text-harbor-700">{nlExplanation}</div>
          ) : null}

          {/* View tabs */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
              {VIEWS.map((v) => {
                const Icon = v.icon;
                return (
                  <button
                    key={v.key}
                    onClick={() => setView(v.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      view === v.key ? "bg-harbor-600 text-white" : "text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{v.label}</span>
                    {v.key === "compare" && compareIds.length > 0 ? (
                      <span className="ml-0.5 rounded-full bg-white/20 px-1.5 text-xs">{compareIds.length}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <span className="text-sm text-slate-500">{filtered.length} {filtered.length === 1 ? "home" : "homes"}</span>
          </div>

          {/* View body */}
          <div className="min-h-[60vh] flex-1">
            {view === "map" ? (
              <div className="h-[72vh]"><MapView homes={filtered} onSelect={setSelectedId} /></div>
            ) : view === "table" ? (
              <HomesTable homes={filtered} onSelect={setSelectedId} compareIds={compareIds} onToggleCompare={toggleCompare} />
            ) : view === "charts" ? (
              <ChartsView homes={filtered} />
            ) : view === "compare" ? (
              <CompareView homes={compareHomes} onRemove={toggleCompare} onSelect={setSelectedId} />
            ) : (
              <FinancialSummary assumptions={assumptions} wifeHours={wifeHours} />
            )}
          </div>
        </main>
      </div>

      {/* Mobile filters note */}
      <div className="border-t border-slate-200 bg-white px-4 py-2 text-center text-xs text-slate-400 lg:hidden">
        <Plane className="mr-1 inline h-3 w-3" /> Open on a larger screen for the full filter &amp; assumptions sidebar.
      </div>

      <footer className="border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-400">
        <HomeIcon className="mr-1 inline h-3 w-3" /> Listings are realistic <strong>sample</strong> data (not live MLS) — site links open live for-sale searches for each home&apos;s ZIP. Figures are planning estimates, not financial or real-estate advice. See README for live-data integration seams.
      </footer>

      <HomeDetail home={selectedHome} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="tabular text-sm font-bold text-slate-800">{value}</div>
    </div>
  );
}
