"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { AnalyzedHome } from "@/lib/types";
import { Card, SectionTitle } from "./ui";
import { usdShort } from "@/lib/format";

interface Props {
  homes: AnalyzedHome[];
}

const HARBOR = "#22618c";
const PALMETTO = "#539b36";
const FLOOD_COLORS: Record<string, string> = {
  X: "#10b981",
  "X (shaded)": "#84cc16",
  AE: "#f59e0b",
  VE: "#f43f5e",
  A: "#fb923c",
};

function histogram(values: number[], binSize: number, fmt: (n: number) => string) {
  if (values.length === 0) return [];
  const min = Math.floor(Math.min(...values) / binSize) * binSize;
  const max = Math.ceil(Math.max(...values) / binSize) * binSize;
  const bins: { label: string; count: number }[] = [];
  for (let b = min; b < max; b += binSize) {
    const count = values.filter((v) => v >= b && v < b + binSize).length;
    bins.push({ label: fmt(b), count });
  }
  return bins;
}

function byNeighborhood(homes: AnalyzedHome[], value: (h: AnalyzedHome) => number) {
  const map = new Map<string, number[]>();
  for (const h of homes) {
    const arr = map.get(h.listing.neighborhood) ?? [];
    arr.push(value(h));
    map.set(h.listing.neighborhood, arr);
  }
  return [...map.entries()]
    .map(([name, arr]) => ({ name, value: Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) }))
    .sort((a, b) => b.value - a.value);
}

function ChartCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <SectionTitle hint={hint}>{title}</SectionTitle>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function ChartsView({ homes }: Props) {
  const priceBins = React.useMemo(() => histogram(homes.map((h) => h.listing.price), 50_000, usdShort), [homes]);
  const payBins = React.useMemo(() => histogram(homes.map((h) => h.mortgage.totalMonthly), 500, usdShort), [homes]);
  const ageBins = React.useMemo(
    () => histogram(homes.map((h) => h.homeAge), 2, (n) => `${n}-${n + 1}y`),
    [homes],
  );
  const ppsfByNbhd = React.useMemo(() => byNeighborhood(homes, (h) => h.pricePerSqft), [homes]);
  const schoolByNbhd = React.useMemo(
    () =>
      byNeighborhood(homes, (h) => {
        const s = h.listing.schools;
        return ((s.elementary.rating + s.middle.rating + s.high.rating) / 3) * 10;
      }),
    [homes],
  );
  const hoaByNbhd = React.useMemo(() => byNeighborhood(homes, (h) => h.listing.hoaMonthly), [homes]);
  const insByNbhd = React.useMemo(() => byNeighborhood(homes, (h) => h.insurance.totalAnnual), [homes]);

  const floodDist = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const h of homes) map.set(h.listing.floodZone, (map.get(h.listing.floodZone) ?? 0) + 1);
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [homes]);

  const scatter = React.useMemo(
    () =>
      homes.map((h) => ({
        airport: h.listing.commute.airportCHS,
        score: h.score.overall,
        price: h.listing.price,
        name: h.listing.neighborhood,
      })),
    [homes],
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Price distribution" hint={`${homes.length} homes`}>
        <BarChart data={priceBins} margin={{ top: 5, right: 8, bottom: 5, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={42} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill={HARBOR} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Monthly payment distribution" hint="all-in PITI+">
        <BarChart data={payBins} margin={{ top: 5, right: 8, bottom: 5, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={42} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill={PALMETTO} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Commute to CHS vs. overall score" hint="bubble = price">
        <ScatterChart margin={{ top: 8, right: 12, bottom: 16, left: -16 }}>
          <CartesianGrid stroke="#eef2f7" />
          <XAxis type="number" dataKey="airport" name="CHS min" tick={{ fontSize: 11 }} unit="m" />
          <YAxis type="number" dataKey="score" name="Score" tick={{ fontSize: 11 }} domain={[40, 90]} />
          <ZAxis type="number" dataKey="price" range={[40, 320]} name="Price" />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(v: number, n: string) => (n === "Price" ? usdShort(v) : v)}
          />
          <Scatter data={scatter} fill={HARBOR} fillOpacity={0.6} />
        </ScatterChart>
      </ChartCard>

      <ChartCard title="Flood-zone mix">
        <PieChart>
          <Pie data={floodDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => `${e.name} (${e.value})`} labelLine={false}>
            {floodDist.map((d) => (
              <Cell key={d.name} fill={FLOOD_COLORS[d.name] ?? "#94a3b8"} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ChartCard>

      <ChartCard title="Avg $/sqft by community">
        <BarChart data={ppsfByNbhd} layout="vertical" margin={{ top: 5, right: 12, bottom: 5, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
          <Tooltip formatter={(v: number) => `$${v}/sqft`} />
          <Bar dataKey="value" fill={HARBOR} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Avg school rating by community" hint="0-100 (avg×10)">
        <BarChart data={schoolByNbhd} layout="vertical" margin={{ top: 5, right: 12, bottom: 5, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
          <Tooltip />
          <Bar dataKey="value" fill={PALMETTO} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Avg HOA by community" hint="$/mo">
        <BarChart data={hoaByNbhd} layout="vertical" margin={{ top: 5, right: 12, bottom: 5, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
          <Tooltip formatter={(v: number) => `$${v}/mo`} />
          <Bar dataKey="value" fill="#7c3aed" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Avg annual insurance by community" hint="HO + wind + flood">
        <BarChart data={insByNbhd} layout="vertical" margin={{ top: 5, right: 12, bottom: 5, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
          <Tooltip formatter={(v: number) => usdShort(v)} />
          <Bar dataKey="value" fill="#e11d48" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Home age distribution" hint="years since built">
        <BarChart data={ageBins} margin={{ top: 5, right: 8, bottom: 5, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={42} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#0891b2" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartCard>
    </div>
  );
}
