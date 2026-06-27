"use client";

import * as React from "react";
import type { MortgageAssumptions } from "@/lib/profile";
import { DOWN_PAYMENT_SCENARIOS } from "@/lib/profile";
import { cn } from "@/lib/cn";
import { Field, SectionTitle } from "./ui";

interface Props {
  assumptions: MortgageAssumptions;
  onChange: (next: MortgageAssumptions) => void;
  wifeHours: "low" | "high";
  onWifeHoursChange: (v: "low" | "high") => void;
}

function NumberInput({
  value,
  onChange,
  step = 1,
  suffix,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  suffix?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center rounded-md border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-harbor-400">
      <input
        type="number"
        className="w-full rounded-md px-2 py-1.5 text-sm tabular outline-none"
        value={Number.isFinite(value) ? value : ""}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      {suffix ? <span className="pr-2 text-xs text-slate-400">{suffix}</span> : null}
    </div>
  );
}

export function AssumptionsPanel({ assumptions, onChange, wifeHours, onWifeHoursChange }: Props) {
  const set = (patch: Partial<MortgageAssumptions>) => onChange({ ...assumptions, ...patch });

  return (
    <div className="space-y-3">
      <SectionTitle hint="adjust to re-score">Mortgage assumptions</SectionTitle>

      <div>
        <span className="mb-1 block text-xs font-medium text-slate-500">Down payment</span>
        <div className="flex gap-1.5">
          {DOWN_PAYMENT_SCENARIOS.map((dp) => (
            <button
              key={dp}
              onClick={() => set({ downPaymentPct: dp })}
              className={cn(
                "flex-1 rounded-md border px-2 py-1.5 text-sm font-semibold transition-colors",
                Math.abs(assumptions.downPaymentPct - dp) < 0.001
                  ? "border-harbor-500 bg-harbor-50 text-harbor-700"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              {Math.round(dp * 100)}%
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Interest rate (%)">
          <NumberInput
            value={+(assumptions.interestRate * 100).toFixed(3)}
            step={0.125}
            suffix="%"
            onChange={(v) => set({ interestRate: (v || 0) / 100 })}
          />
        </Field>
        <Field label="Loan term (yrs)">
          <NumberInput value={assumptions.termYears} step={5} onChange={(v) => set({ termYears: v || 30 })} />
        </Field>
        <Field label="Property tax (%)">
          <NumberInput
            value={+(assumptions.propertyTaxRate * 100).toFixed(2)}
            step={0.05}
            suffix="%"
            onChange={(v) => set({ propertyTaxRate: (v || 0) / 100 })}
          />
        </Field>
        <Field label="Insurance (%)">
          <NumberInput
            value={+(assumptions.insuranceRate * 100).toFixed(2)}
            step={0.05}
            suffix="%"
            onChange={(v) => set({ insuranceRate: (v || 0) / 100 })}
          />
        </Field>
        <Field label="PMI (%)">
          <NumberInput
            value={+(assumptions.pmiRate * 100).toFixed(2)}
            step={0.05}
            suffix="%"
            onChange={(v) => set({ pmiRate: (v || 0) / 100 })}
          />
        </Field>
        <Field label="Appreciation (%)">
          <NumberInput
            value={+(assumptions.appreciationRate * 100).toFixed(1)}
            step={0.5}
            suffix="%"
            onChange={(v) => set({ appreciationRate: (v || 0) / 100 })}
          />
        </Field>
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium text-slate-500">Wife&apos;s hours (DTI income)</span>
        <div className="flex gap-1.5">
          {(["low", "high"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => onWifeHoursChange(opt)}
              className={cn(
                "flex-1 rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors",
                wifeHours === opt
                  ? "border-harbor-500 bg-harbor-50 text-harbor-700"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              {opt === "low" ? "35 hrs ($172k)" : "40 hrs ($183k)"}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[11px] leading-snug text-slate-400">
        HOA, taxes, insurance &amp; flood use each listing&apos;s carried figures where available; the rates above fill gaps and drive PMI / DTI.
      </p>
    </div>
  );
}
