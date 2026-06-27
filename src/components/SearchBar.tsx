"use client";

import * as React from "react";
import { Search, Sparkles } from "lucide-react";
import { parseQuery } from "@/lib/nlquery";
import type { FilterState } from "@/lib/filters";
import type { SortKey } from "@/lib/filters";

interface Props {
  onApply: (result: {
    filters: Partial<FilterState>;
    sort?: { key: SortKey; dir: "asc" | "desc" };
    compareNeighborhoods?: string[];
    explanation: string;
  }) => void;
}

const EXAMPLES = [
  "Homes under $500k within 25 min of CHS",
  "Best appreciation potential",
  "Only flood zone X homes",
  "Compare Park West vs Hanahan",
  "4 bed strong schools under $3300/mo",
];

export function SearchBar({ onApply }: Props) {
  const [text, setText] = React.useState("");

  const submit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    onApply(parseQuery(trimmed));
  };

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(text);
        }}
        className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-harbor-400"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-harbor-500" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask in plain English — e.g. “homes under $500k with less than a 25-minute airport commute”"
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-harbor-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-harbor-700">
          <Search className="h-3.5 w-3.5" /> Search
        </button>
      </form>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              setText(ex);
              submit(ex);
            }}
            className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500 hover:bg-slate-200"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
