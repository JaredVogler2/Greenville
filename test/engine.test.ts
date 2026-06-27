import { test } from "node:test";
import assert from "node:assert/strict";
import { monthlyPI, remainingBalance, analyzeMortgage } from "../src/lib/mortgage";
import { analyzeAll } from "../src/lib/listings";
import { scoreHome } from "../src/lib/scoring";
import { atpTimeline } from "../src/lib/pilot";
import listings from "../src/data/listings.json";
import type { Listing } from "../src/lib/types";

const DATA = listings as unknown as Listing[];

test("monthlyPI matches the standard amortization formula", () => {
  // $300,000 @ 6.75% / 30yr ≈ $1,945.79
  const pi = monthlyPI(300_000, 0.0675, 30);
  assert.ok(Math.abs(pi - 1945.79) < 0.5, `got ${pi}`);
});

test("monthlyPI handles a 0% loan as straight-line", () => {
  assert.equal(monthlyPI(360_000, 0, 30), 1000);
});

test("remaining balance decreases and hits ~0 at term end", () => {
  const start = remainingBalance(300_000, 0.0675, 30, 0);
  const mid = remainingBalance(300_000, 0.0675, 30, 180);
  const end = remainingBalance(300_000, 0.0675, 30, 360);
  assert.ok(start > mid && mid > end);
  assert.ok(end < 1, `end balance ${end}`);
});

test("mortgage breakdown: PMI only applies under 20% down", () => {
  const home = DATA[0];
  const at15 = analyzeMortgage(home, { assumptions: { downPaymentPct: 0.15 } });
  const at20 = analyzeMortgage(home, { assumptions: { downPaymentPct: 0.2 } });
  assert.ok(at15.pmiRequired && at15.monthlyPMI > 0);
  assert.ok(!at20.pmiRequired && at20.monthlyPMI === 0);
  // More down → lower total payment.
  assert.ok(at20.totalMonthly < at15.totalMonthly);
});

test("total monthly = sum of its components", () => {
  const m = analyzeMortgage(DATA[0]);
  const sum =
    m.principalAndInterest + m.monthlyTaxes + m.monthlyInsurance + m.monthlyFlood + m.monthlyHOA + m.monthlyPMI;
  assert.ok(Math.abs(sum - m.totalMonthly) < 0.01);
});

test("scores are bounded 0–100 and produce a valid recommendation", () => {
  const home = DATA[0];
  const m = analyzeMortgage(home);
  const s = scoreHome(home, m);
  assert.ok(s.overall >= 0 && s.overall <= 100);
  for (const v of Object.values(s.components)) assert.ok(v >= 0 && v <= 100);
  assert.ok(["Strong Buy", "Buy", "Consider", "Pass"].includes(s.recommendation));
});

test("analyzeAll ranks the full set 1..N by descending score", () => {
  const homes = analyzeAll(DATA);
  assert.equal(homes.length, DATA.length);
  assert.equal(homes[0].rank, 1);
  for (let i = 1; i < homes.length; i++) {
    assert.ok(homes[i - 1].score.overall >= homes[i].score.overall);
    assert.equal(homes[i].rank, i + 1);
  }
});

test("ATP timeline: 350 hrs at 20/wk reaches 1,500 in ~13 months", () => {
  const t = atpTimeline();
  assert.equal(t.hoursToFullAtp, 1150);
  assert.ok(t.monthsToFullAtp >= 12 && t.monthsToFullAtp <= 15, `got ${t.monthsToFullAtp}`);
});
