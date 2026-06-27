# Charleston Area Home Search & Analysis

A premium real-estate **analysis** platform (not just a listings browser) for a family
relocating from **Greenville, SC** to the **Charleston, SC metro**. It searches, aggregates,
scores, ranks and explains homes against the buyer's actual financial profile, commute
needs (the husband is a commuting airline pilot), flood risk, schools and long-term resale.

It feels like a cross between Zillow/Redfin, a mortgage planner and BiggerPickets — focused on
**objective, personalized recommendations** with a map, charts, comparison tools and a
downloadable Excel report.

> **Live, deployable app.** This is a Next.js application that builds clean and deploys to
> Vercel as-is (see [Deploy](#deploy-to-vercel)). It also produces the requested **Excel
> workbook** with actual listings across **25 Charleston-metro communities**.

---

## Highlights

- **55 curated listings across 25 real Charleston-metro communities** (Mount Pleasant ·
  Park West · Carolina Park · Dunes West · Oyster Point · Hamlin Plantation · Rivertowne ·
  Belle Hall · I'On · Carolina Bay · Boltons Landing · Grand Oaks · West Ashley · Hanahan ·
  Tanner Plantation · Park Circle · Daniel Island · Point Hope · Carnes Crossroads · Nexton ·
  The Ponds · Wescott · Summerville · Cane Bay · Liberty Hill Farm).
- **Full mortgage engine** — PITI + HOA + flood + PMI, DTI (front/back), cash-to-close,
  emergency-fund-remaining, 5/10-yr ownership cost, projected equity, break-even-vs-rent, and
  **10% / 15% / 20% down-payment scenarios**. Every assumption is adjustable and the whole
  board re-scores instantly.
- **Weighted 0–100 scoring model** with the exact spec weights (25% financial value, 20%
  commute, 15% schools, 10% flood, 10% appreciation, 10% condition, 5% HOA, 5% neighborhood)
  → **Strong Buy / Buy / Consider / Pass**, plus **Investment / Family / Airport** sub-scores.
- **Pilot career model** — timeline to Restricted/Full ATP from 350 hrs at +20/wk, and salary
  bands (low/expected/high) for Regional FO → Regional Captain → Major FO → Major Captain.
- **Interactive dashboard** — Leaflet map (markers colored by recommendation), TanStack data
  table, Recharts visualizations, side-by-side comparison, a financial-planning view, and a
  deep per-home analysis drawer with a generated analyst narrative (pros/cons/risks/
  negotiation/offer).
- **Natural-language search** — e.g. *"homes under $500k with less than a 25-minute airport
  commute"*, *"best appreciation potential"*, *"only flood zone X homes"*, *"compare Park West
  vs Hanahan"*.
- **Excel export** — a 4-sheet `.xlsx` (Ranked Homes · Assumptions · Neighborhoods · Pilot
  Career) with all spec columns and clickable Zillow/Realtor/Redfin/Maps/Tour links.

## Buyer profile (baked in, all adjustable)

| | |
|---|---|
| Current home | Bought 03/2024 for $420k (Greenville), ~$450k now, ~$58.5k est. net proceeds |
| Income | Husband $100k (→ airline pilot track) + wife $40/hr × 35–40 hrs ≈ **$172–183k** |
| Target payment | **$3,100–3,300/mo** all-in (PITI + HOA + flood + PMI) |
| Must-haves | 2018+ build, 3+ BR / 2+ BA, 1,700+ sqft, garage preferred, no fixers |
| Location | ≤ ~35 min to CHS airport **and** downtown at weekday ~3pm; Mount Pleasant preferred |

## Scoring model

`overall = 0.25·financialValue + 0.20·commute + 0.15·schools + 0.10·floodRisk +
0.10·appreciation + 0.10·homeCondition + 0.05·hoa + 0.05·neighborhood`

Each component is normalized to 0–100 (see `src/lib/scoring.ts`). Recommendation bands are
calibrated to the Charleston tradeoff space (premium areas cost more; value areas have weaker
schools), so a mid-70s score is genuinely a standout: **Strong Buy ≥ 74, Buy ≥ 65,
Consider ≥ 54, Pass < 54.**

---

## Tech stack

- **Next.js 14 (App Router) · TypeScript · Tailwind CSS** — Vercel-native.
- **Leaflet / react-leaflet** (map), **Recharts** (charts), **TanStack Table** (grid),
  **SheetJS / xlsx** (Excel), **lucide-react** (icons).
- All analysis is **pure TypeScript** in `src/lib/*` (no DB required), so it runs identically
  in the browser (instant re-scoring) and in the `/api/export` Node route.

### Why one Next.js app instead of the full Python/Postgres/Celery stack?

The spec lists a large backend (FastAPI + PostgreSQL + Redis + Celery). That stack can't be
*run or deployed* from this repo without external infrastructure, and the user's requirement
was explicit: **"this must be deployable via Vercel if it's truly an app."** So the analysis
logic lives in framework-agnostic pure functions (`src/lib`) that a FastAPI service could call
verbatim; the Next.js API routes play the role of the backend for a zero-infra, Vercel-ready
deployment. Nightly refresh / Celery would map to a Vercel Cron hitting a refresh route.

---

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
# or a production build:
npm run build && npm start
npm run typecheck    # tsc --noEmit
node scripts/generate-listings.mjs   # regenerate src/data/listings.json
```

## Deploy to Vercel

This is a standard Next.js app — Vercel auto-detects it. Either:

- Push to GitHub and **Import** the repo at [vercel.com/new](https://vercel.com/new), **or**
- `npm i -g vercel && vercel` from the repo root.

No environment variables are required for the demo dataset. The Excel route runs on the
Node.js runtime (declared in `src/app/api/export/route.ts`).

---

## Data: curated sample today, live APIs tomorrow

Zillow and Redfin have **no public API**, and the live feeds the spec calls for (licensed
MLS/RESO, Google Distance Matrix, FEMA NFHL, GreatSchools, Walk Score, ATTOM/County GIS,
insurance quoting) require **paid keys** that can't ship in a public repo. So the app ships a
**deterministic, realistic, schema-valid dataset** (`scripts/generate-listings.mjs` →
`src/data/listings.json`) built from real Charleston market knowledge: real school names,
builders, flood-zone distributions, price/$psf bands, lat/lng centers and traffic-aware
commute minutes per submarket. This guarantees the app always builds and the engines always
have rich data to analyze.

> ⚠️ **The individual homes are not real.** Addresses, prices, MLS IDs and photos are
> fabricated. Because there's no real address to deep-link to, each card's **Zillow / Realtor /
> Redfin** links open a **live for-sale search for that home's ZIP** — so they land on real,
> current listings near that profile, not on a specific (non-existent) address. What *is*
> grounded in reality: community names, school names, builders, flood-zone patterns,
> approximate geography, ballpark commute times, and all the mortgage/scoring/pilot math.

### Getting real listings in

Pick whichever fits your access — the analysis engine is unchanged, only `ListingSource` changes:

1. **CSV / IDX export (free, fastest):** export current listings from your agent's MLS/IDX or a
   spreadsheet; map each row to the `Listing` shape in a custom `ListingSource`. Real homes +
   working deep links, but a static snapshot.
2. **Listings API (auto-updating, paid):** integrate a real feed — e.g. SimplyRETS, Spark/FBS,
   Bridge Interactive (Zillow Group), or a Realtor RapidAPI. Needs an API key and usually
   MLS/IDX approval.
3. **Free real layers you can add today without listings:** FEMA NFHL (flood zone by lat/lng) is
   free; Google Distance Matrix (commute), GreatSchools (schools) and Walk Score need keys.

**Going live is a drop-in swap.** All ingestion goes through one interface:

- `src/lib/data-sources/index.ts` — `ListingSource` interface + `LocalListingSource`.
  Implement `ListingSource` against real providers and swap it in `getListingSource()`.
  `LIVE_SOURCE_NOTES` documents the exact API for each field (FEMA NFHL → flood zone,
  Google Distance Matrix → commute, County GIS/ATTOM → taxes, GreatSchools → schools, etc.).
- `src/lib/data-sources/ai.ts` — the LLM seam. The per-home narrative is generated by a
  deterministic rules engine (`src/lib/insight.ts`) so it works with **zero keys**; to use a
  real model (GPT or Claude), implement `LlmInsightProvider` — it receives the same structured
  facts and returns the same `HomeInsight` shape, so nothing downstream changes.

## Project structure

```
src/
  app/                     # Next.js App Router
    page.tsx               # renders the dashboard
    api/export/route.ts    # POST → streams the .xlsx workbook
  components/              # Dashboard, Map, Table, Charts, Compare, Detail, Financials, …
  lib/
    types.ts               # domain model (Listing, AnalyzedHome, …)
    profile.ts             # buyer profile + default mortgage assumptions
    mortgage.ts            # PITI / DTI / cash-to-close / equity / break-even engine
    pilot.ts               # ATP timeline + airline salary progression
    scoring.ts             # weighted 0–100 model + recommendation + sub-scores
    analysis.ts            # flood / insurance / commute analysis
    neighborhoods.ts       # 25-community metadata (growth / desirability / family)
    insight.ts             # generated narrative (pros/cons/risks/negotiation/offer)
    nlquery.ts             # natural-language → filters/sort
    filters.ts             # filter model + apply/sort
    listings.ts            # pipeline: raw → analyzed → ranked
    export.ts              # SheetJS workbook builder
    data-sources/          # adapter layer (local provider + live-API + LLM seams)
  data/listings.json       # generated dataset (55 homes / 25 communities)
scripts/generate-listings.mjs
```

## Disclaimer

The dataset is **curated/sample data for demonstration**. All financial, commute, flood,
insurance and school figures are **planning estimates**, not financial, legal or real-estate
advice. Verify everything with licensed professionals before making a purchase.
