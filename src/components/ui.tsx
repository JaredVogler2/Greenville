import * as React from "react";
import { cn } from "@/lib/cn";
import type { Recommendation } from "@/lib/types";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}
      {...props}
    />
  );
}

export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{children}</h3>
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className={cn("tabular text-lg font-semibold", accent ? "text-harbor-600" : "text-slate-800")}>
        {value}
      </div>
      {sub ? <div className="text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

export const RECOMMENDATION_STYLE: Record<Recommendation, { bg: string; text: string; dot: string; hex: string }> = {
  "Strong Buy": { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500", hex: "#10b981" },
  Buy: { bg: "bg-lime-100", text: "text-lime-800", dot: "bg-lime-500", hex: "#84cc16" },
  Consider: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500", hex: "#f59e0b" },
  Pass: { bg: "bg-rose-100", text: "text-rose-800", dot: "bg-rose-500", hex: "#f43f5e" },
};

export function RecBadge({ rec, className }: { rec: Recommendation; className?: string }) {
  const s = RECOMMENDATION_STYLE[rec];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        s.bg,
        s.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {rec}
    </span>
  );
}

/** A small 0–100 score chip with a color ramp. */
export function ScorePill({ score, className }: { score: number; className?: string }) {
  const color =
    score >= 74 ? "bg-emerald-600" : score >= 65 ? "bg-lime-600" : score >= 54 ? "bg-amber-500" : "bg-rose-500";
  return (
    <span
      className={cn("inline-flex h-7 w-9 items-center justify-center rounded-md text-sm font-bold text-white tabular", color, className)}
    >
      {score}
    </span>
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" }) {
  const styles = {
    primary: "bg-harbor-600 text-white hover:bg-harbor-700",
    ghost: "text-slate-600 hover:bg-slate-100",
    outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
        styles,
        className,
      )}
      {...props}
    />
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export function rankBadge(rank: number) {
  return (
    <span className="tabular inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-800 px-1.5 text-xs font-semibold text-white">
      {rank}
    </span>
  );
}
