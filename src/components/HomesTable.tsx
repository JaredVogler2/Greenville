"use client";

import * as React from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, GitCompare } from "lucide-react";
import type { AnalyzedHome } from "@/lib/types";
import { usd, usdShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import { RecBadge, ScorePill } from "./ui";

interface Props {
  homes: AnalyzedHome[];
  onSelect: (id: string) => void;
  compareIds: string[];
  onToggleCompare: (id: string) => void;
}

const col = createColumnHelper<AnalyzedHome>();

export function HomesTable({ homes, onSelect, compareIds, onToggleCompare }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "score", desc: true }]);

  const columns = React.useMemo(
    () => [
      col.accessor("rank", { header: "#", cell: (c) => <span className="tabular text-slate-500">{c.getValue()}</span>, size: 40 }),
      col.accessor((h) => h.score.recommendation, {
        id: "rec",
        header: "Rec",
        cell: (c) => <RecBadge rec={c.getValue()} />,
        sortingFn: (a, b) => a.original.score.overall - b.original.score.overall,
      }),
      col.accessor((h) => h.score.overall, {
        id: "score",
        header: "Score",
        cell: (c) => <ScorePill score={c.getValue()} />,
      }),
      col.accessor((h) => h.listing.address, {
        id: "address",
        header: "Home",
        cell: (c) => (
          <div className="min-w-44">
            <div className="font-medium text-slate-800">{c.row.original.listing.address}</div>
            <div className="text-xs text-slate-500">
              {c.row.original.listing.neighborhood} · {c.row.original.listing.city}
            </div>
          </div>
        ),
      }),
      col.accessor((h) => h.listing.price, { id: "price", header: "Price", cell: (c) => <span className="tabular font-medium">{usd(c.getValue())}</span> }),
      col.accessor((h) => h.mortgage.totalMonthly, {
        id: "monthly",
        header: "Pmt/mo",
        cell: (c) => <span className="tabular">{usd(c.getValue())}</span>,
      }),
      col.accessor((h) => h.pricePerSqft, { id: "ppsf", header: "$/sqft", cell: (c) => <span className="tabular">{usd(c.getValue())}</span> }),
      col.accessor((h) => h.listing.bedrooms, { id: "beds", header: "BR", cell: (c) => <span className="tabular">{c.getValue()}</span>, size: 40 }),
      col.accessor((h) => h.listing.sqft, { id: "sqft", header: "SqFt", cell: (c) => <span className="tabular">{c.getValue().toLocaleString()}</span> }),
      col.accessor((h) => h.listing.yearBuilt, { id: "year", header: "Built", cell: (c) => <span className="tabular">{c.getValue()}</span>, size: 56 }),
      col.accessor((h) => h.listing.commute.airportCHS, { id: "chs", header: "CHS", cell: (c) => <span className="tabular">{c.getValue()}m</span>, size: 50 }),
      col.accessor((h) => h.listing.floodZone, { id: "flood", header: "Flood", cell: (c) => <span className="text-xs">{c.getValue()}</span> }),
      col.accessor((h) => h.score.investmentScore, { id: "inv", header: "Invest", cell: (c) => <span className="tabular text-slate-600">{c.getValue()}</span> }),
      col.accessor((h) => h.score.familyScore, { id: "fam", header: "Family", cell: (c) => <span className="tabular text-slate-600">{c.getValue()}</span> }),
      col.display({
        id: "compare",
        header: () => <GitCompare className="h-3.5 w-3.5" />,
        cell: (c) => {
          const id = c.row.original.listing.id;
          const active = compareIds.includes(id);
          return (
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => {
                e.stopPropagation();
                onToggleCompare(id);
              }}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 cursor-pointer accent-harbor-600"
              aria-label="Add to compare"
            />
          );
        },
        size: 40,
      }),
    ],
    [compareIds, onToggleCompare],
  );

  const table = useReactTable({
    data: homes,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-auto scroll-thin rounded-xl border border-slate-200 bg-white">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-slate-200">
              {hg.headers.map((header) => (
                <th key={header.id} className="whitespace-nowrap px-3 py-2 text-left font-semibold text-slate-500">
                  {header.isPlaceholder ? null : (
                    <button
                      className={cn("inline-flex items-center gap-1", header.column.getCanSort() && "hover:text-slate-800")}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() ? <ArrowUpDown className="h-3 w-3 opacity-40" /> : null}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onSelect(row.original.listing.id)}
              className="cursor-pointer border-b border-slate-100 hover:bg-harbor-50/40"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="whitespace-nowrap px-3 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {homes.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-slate-400">
                No homes match the current filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
