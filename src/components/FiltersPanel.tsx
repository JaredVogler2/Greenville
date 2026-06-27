"use client";

import * as React from "react";
import type { FilterState } from "@/lib/filters";
import type { FloodZone, Recommendation } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Field, SectionTitle, Button } from "./ui";

interface Props {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  neighborhoods: string[];
  onReset: () => void;
}

const FLOOD_ZONES: FloodZone[] = ["X", "X (shaded)", "AE", "VE", "A"];
const RECS: Recommendation[] = ["Strong Buy", "Buy", "Consider", "Pass"];

function Num({
  value,
  onChange,
  placeholder,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm tabular outline-none focus:ring-2 focus:ring-harbor-400"
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    />
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-harbor-500 bg-harbor-50 text-harbor-700"
          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}

export function FiltersPanel({ filters, onChange, neighborhoods, onReset }: Props) {
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });
  const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle>Filters</SectionTitle>
        <button onClick={onReset} className="text-xs font-medium text-harbor-600 hover:underline">
          Reset
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Price min">
          <Num value={filters.priceMin} onChange={(v) => set({ priceMin: v })} placeholder="$" />
        </Field>
        <Field label="Price max">
          <Num value={filters.priceMax} onChange={(v) => set({ priceMax: v })} placeholder="$" />
        </Field>
        <Field label="Max payment/mo">
          <Num value={filters.monthlyMax} onChange={(v) => set({ monthlyMax: v })} placeholder="$" />
        </Field>
        <Field label="Min score">
          <Num value={filters.scoreMin} onChange={(v) => set({ scoreMin: v })} placeholder="0-100" />
        </Field>
        <Field label="Built after">
          <Num value={filters.yearBuiltMin} onChange={(v) => set({ yearBuiltMin: v })} placeholder="2018" />
        </Field>
        <Field label="Max age (yrs)">
          <Num value={filters.ageMax} onChange={(v) => set({ ageMax: v })} />
        </Field>
        <Field label="Min sqft">
          <Num value={filters.sqftMin} onChange={(v) => set({ sqftMin: v })} placeholder="1700" />
        </Field>
        <Field label="Min lot (ac)">
          <Num value={filters.lotMin} onChange={(v) => set({ lotMin: v })} />
        </Field>
        <Field label="Min beds">
          <Num value={filters.bedsMin} onChange={(v) => set({ bedsMin: v })} placeholder="3" />
        </Field>
        <Field label="Min baths">
          <Num value={filters.bathsMin} onChange={(v) => set({ bathsMin: v })} placeholder="2" />
        </Field>
        <Field label="Min garage">
          <Num value={filters.garageMin} onChange={(v) => set({ garageMin: v })} />
        </Field>
        <Field label="Max HOA/mo">
          <Num value={filters.hoaMax} onChange={(v) => set({ hoaMax: v })} placeholder="$" />
        </Field>
        <Field label="Max CHS commute">
          <Num value={filters.airportMax} onChange={(v) => set({ airportMax: v })} placeholder="min" />
        </Field>
        <Field label="Max downtown">
          <Num value={filters.downtownMax} onChange={(v) => set({ downtownMax: v })} placeholder="min" />
        </Field>
        <Field label="Min school (1-10)">
          <Num value={filters.schoolMin} onChange={(v) => set({ schoolMin: v })} />
        </Field>
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-medium text-slate-500">Recommendation</span>
        <div className="flex flex-wrap gap-1.5">
          {RECS.map((r) => (
            <Chip key={r} active={filters.recommendations.includes(r)} onClick={() => set({ recommendations: toggle(filters.recommendations, r) })}>
              {r}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-medium text-slate-500">Flood zone</span>
        <div className="flex flex-wrap gap-1.5">
          {FLOOD_ZONES.map((z) => (
            <Chip key={z} active={filters.floodZones.includes(z)} onClick={() => set({ floodZones: toggle(filters.floodZones, z) })}>
              {z}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-xs font-medium text-slate-500">Community</span>
        <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto scroll-thin pr-1">
          {neighborhoods.map((n) => (
            <Chip key={n} active={filters.neighborhoods.includes(n)} onClick={() => set({ neighborhoods: toggle(filters.neighborhoods, n) })}>
              {n}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
