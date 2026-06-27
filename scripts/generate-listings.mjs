/**
 * Deterministic generator for the curated Charleston-metro sample dataset.
 *
 * Why a generator (and not hand-typed JSON or live API pulls)?
 *  - Zillow/Redfin have no public API and the paid feeds (MLS/RESO, Google
 *    Distance Matrix, GreatSchools, Walk Score, ATTOM) need keys this repo
 *    can't ship. See src/lib/data-sources/index.ts for the live seams.
 *  - A seeded generator gives realistic, schema-valid, reproducible data so
 *    `next build` always works and the analysis engines have something rich
 *    to chew on. Every anchor fact below (school names, builders, flood-zone
 *    mix, price/$psf bands, lat/lng centers, traffic-aware commute minutes)
 *    reflects the real Charleston submarket it represents.
 *
 * Run:  node scripts/generate-listings.mjs   →  writes src/data/listings.json
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "data", "listings.json");

// Seeded PRNG (mulberry32) for reproducible output.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260627);
const rng = (lo, hi) => lo + rand() * (hi - lo);
const irng = (lo, hi) => Math.round(rng(lo, hi));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const round = (n, step) => Math.round(n / step) * step;
function weighted(pairs) {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of pairs) {
    if ((r -= w) <= 0) return v;
  }
  return pairs[0][0];
}

const AGENTS = [
  "Carolina One Real Estate",
  "Dunes Properties",
  "Keller Williams Charleston",
  "The Boulevard Company",
  "Brand Name Real Estate",
  "Matt O'Neill Real Estate",
  "EXP Realty LLC",
  "Coldwell Banker Realty",
];
const WATER_HEATERS = ["Tankless (gas)", "50-gal electric", "Tankless (electric)", "40-gal gas"];
const EXTERIORS = ["Hardiplank fiber cement", "Brick & Hardiplank", "Vinyl siding", "Stucco & Hardiplank"];
const INTERNET = ["Spectrum (cable, 1 Gbps)", "AT&T Fiber (1 Gbps)", "Home Telecom Fiber (gigabit)", "Comcast Xfinity (cable)"];
const UTILS = ["Public water/sewer", "Dominion Energy (electric)", "Natural gas"];
const ENERGY = [
  ["Spray-foam attic", "Tankless water heater", "Low-E windows"],
  ["Radiant barrier", "15 SEER HVAC", "ENERGY STAR appliances"],
  ["Smart thermostat", "LED throughout", "Low-E windows"],
  ["Solar-ready", "Conditioned crawlspace", "16 SEER HVAC"],
];

// --- Area templates (shared submarket characteristics) ---------------------
const AREAS = {
  mpNorth: {
    city: "Mount Pleasant",
    zip: "29466",
    county: "Charleston",
    schoolDistrict: "Charleston County School District",
    elementary: [["Carolina Park Elementary", 8], ["Charles Pinckney Elementary", 9], ["Laurel Hill Primary", 8]],
    middle: [["Cario Middle", 8], ["Laing Middle", 8]],
    high: [["Wando High", 8], ["Lucy Beckham High", 8]],
    builders: ["David Weekley Homes", "Pulte Homes", "John Wieland Homes", "Toll Brothers", "K. Hovnanian Homes", "Saussy Burbank"],
    floods: [["X", 70], ["X (shaded)", 15], ["AE", 15]],
    price: [560000, 850000],
    ppsf: [250, 320],
    hoa: [80, 170],
    year: [2016, 2024],
    sqft: [2000, 3400],
    lot: [0.14, 0.32],
    crime: [8, 9],
    walk: [25, 55],
    bike: [35, 55],
    transit: [10, 25],
    commute: { airportCHS: 26, downtown: 28, beach: 16, costco: 8, publix: 5, boeing: 28, jointBaseCharleston: 30, hospital: 10, flightSchool: 26, parks: 6, boatRamp: 12, shopping: 6 },
  },
  mpSouth: {
    city: "Mount Pleasant",
    zip: "29464",
    county: "Charleston",
    schoolDistrict: "Charleston County School District",
    elementary: [["Belle Hall Elementary", 8], ["Mamie Whitesides Elementary", 8], ["James B. Edwards Elementary", 8]],
    middle: [["Moultrie Middle", 7], ["Laing Middle", 8]],
    high: [["Lucy Beckham High", 8], ["Wando High", 8]],
    builders: ["John Wieland Homes", "David Weekley Homes", "Saussy Burbank", "Pulte Homes"],
    floods: [["X", 55], ["X (shaded)", 20], ["AE", 25]],
    price: [560000, 900000],
    ppsf: [270, 360],
    hoa: [60, 260],
    year: [2017, 2024],
    sqft: [1750, 3100],
    lot: [0.08, 0.24],
    crime: [8, 9],
    walk: [35, 65],
    bike: [40, 60],
    transit: [15, 30],
    commute: { airportCHS: 20, downtown: 18, beach: 12, costco: 6, publix: 4, boeing: 22, jointBaseCharleston: 24, hospital: 8, flightSchool: 22, parks: 6, boatRamp: 8, shopping: 5 },
  },
  westAshley: {
    city: "Charleston",
    zip: "29414",
    county: "Charleston",
    schoolDistrict: "Charleston County School District",
    elementary: [["Drayton Hall Elementary", 6], ["Springfield Elementary", 5], ["Oakland Elementary", 6]],
    middle: [["C.E. Williams Middle", 5], ["West Ashley Middle", 5]],
    high: [["West Ashley High", 5]],
    builders: ["David Weekley Homes", "Pulte Homes", "Crescent Homes", "Beazer Homes"],
    floods: [["X", 60], ["X (shaded)", 20], ["AE", 20]],
    price: [400000, 600000],
    ppsf: [200, 262],
    hoa: [55, 130],
    year: [2017, 2023],
    sqft: [1750, 2900],
    lot: [0.10, 0.22],
    crime: [6, 7],
    walk: [30, 58],
    bike: [40, 58],
    transit: [20, 35],
    commute: { airportCHS: 22, downtown: 16, beach: 24, costco: 22, publix: 6, boeing: 24, jointBaseCharleston: 22, hospital: 14, flightSchool: 22, parks: 8, boatRamp: 12, shopping: 7 },
  },
  hanahan: {
    city: "Hanahan",
    zip: "29410",
    county: "Berkeley",
    schoolDistrict: "Berkeley County School District",
    elementary: [["Hanahan Elementary", 7], ["Bowens Corner Elementary", 7]],
    middle: [["Hanahan Middle", 6]],
    high: [["Hanahan High", 7]],
    builders: ["D.R. Horton", "Lennar", "Mungo Homes", "Eastwood Homes"],
    floods: [["X", 75], ["X (shaded)", 15], ["AE", 10]],
    price: [380000, 560000],
    ppsf: [190, 244],
    hoa: [0, 90],
    year: [2018, 2024],
    sqft: [1750, 2700],
    lot: [0.12, 0.24],
    crime: [7, 8],
    walk: [25, 45],
    bike: [35, 50],
    transit: [15, 25],
    commute: { airportCHS: 14, downtown: 18, beach: 30, costco: 22, publix: 7, boeing: 10, jointBaseCharleston: 12, hospital: 16, flightSchool: 16, parks: 8, boatRamp: 14, shopping: 8 },
  },
  parkCircle: {
    city: "North Charleston",
    zip: "29405",
    county: "Charleston",
    schoolDistrict: "Charleston County School District",
    elementary: [["Hunley Park Elementary", 4], ["North Charleston Elementary", 3]],
    middle: [["Morningside Middle", 3]],
    high: [["Military Magnet Academy", 4], ["North Charleston High", 3]],
    builders: ["Stanley Martin Homes", "Homes by Dickerson", "Saussy Burbank"],
    floods: [["X", 85], ["X (shaded)", 10], ["AE", 5]],
    price: [400000, 620000],
    ppsf: [230, 300],
    hoa: [0, 70],
    year: [2019, 2024],
    sqft: [1700, 2500],
    lot: [0.06, 0.16],
    crime: [5, 6],
    walk: [55, 82],
    bike: [50, 66],
    transit: [30, 42],
    commute: { airportCHS: 12, downtown: 16, beach: 28, costco: 24, publix: 8, boeing: 8, jointBaseCharleston: 10, hospital: 14, flightSchool: 14, parks: 6, boatRamp: 16, shopping: 8 },
  },
  danielIsland: {
    city: "Charleston",
    zip: "29492",
    county: "Berkeley",
    schoolDistrict: "Berkeley County School District",
    elementary: [["Daniel Island School", 8], ["Philip Simmons Elementary", 8]],
    middle: [["Daniel Island School", 8], ["Philip Simmons Middle", 8]],
    high: [["Philip Simmons High", 8]],
    builders: ["Toll Brothers", "David Weekley Homes", "Lowcountry Premier Custom Homes"],
    floods: [["X", 60], ["X (shaded)", 20], ["AE", 18], ["VE", 2]],
    price: [720000, 1300000],
    ppsf: [300, 420],
    hoa: [100, 250],
    year: [2018, 2024],
    sqft: [2200, 3600],
    lot: [0.10, 0.30],
    crime: [9, 9],
    walk: [35, 62],
    bike: [50, 66],
    transit: [15, 25],
    commute: { airportCHS: 18, downtown: 22, beach: 26, costco: 14, publix: 6, boeing: 16, jointBaseCharleston: 20, hospital: 16, flightSchool: 18, parks: 5, boatRamp: 8, shopping: 7 },
  },
  nexton: {
    city: "Summerville",
    zip: "29486",
    county: "Berkeley",
    schoolDistrict: "Berkeley County School District",
    elementary: [["Nexton Elementary", 7], ["Cane Bay Elementary", 6]],
    middle: [["Sangaree Middle", 5], ["Cane Bay Middle", 6]],
    high: [["Cane Bay High", 6]],
    builders: ["Pulte Homes", "Lennar", "David Weekley Homes", "Homes by Dickerson"],
    floods: [["X", 90], ["X (shaded)", 10]],
    price: [400000, 580000],
    ppsf: [190, 240],
    hoa: [80, 130],
    year: [2019, 2024],
    sqft: [1800, 2900],
    lot: [0.10, 0.22],
    crime: [8, 8],
    walk: [30, 55],
    bike: [40, 55],
    transit: [10, 20],
    commute: { airportCHS: 32, downtown: 38, beach: 42, costco: 28, publix: 8, boeing: 26, jointBaseCharleston: 28, hospital: 18, flightSchool: 32, parks: 8, boatRamp: 22, shopping: 6 },
  },
  summerville: {
    city: "Summerville",
    zip: "29483",
    county: "Dorchester",
    schoolDistrict: "Dorchester School District Two",
    elementary: [["Sangaree Elementary", 5], ["Beech Hill Elementary", 6]],
    middle: [["Sangaree Middle", 5], ["Gregg Middle", 6]],
    high: [["Summerville High", 6], ["Cane Bay High", 6]],
    builders: ["D.R. Horton", "Mungo Homes", "Lennar", "K. Hovnanian Homes"],
    floods: [["X", 90], ["X (shaded)", 10]],
    price: [360000, 520000],
    ppsf: [175, 220],
    hoa: [0, 90],
    year: [2018, 2024],
    sqft: [1750, 2800],
    lot: [0.12, 0.26],
    crime: [7, 8],
    walk: [20, 45],
    bike: [35, 50],
    transit: [10, 20],
    commute: { airportCHS: 34, downtown: 36, beach: 44, costco: 30, publix: 8, boeing: 28, jointBaseCharleston: 26, hospital: 16, flightSchool: 34, parks: 8, boatRamp: 24, shopping: 7 },
  },
  caneBay: {
    city: "Summerville",
    zip: "29486",
    county: "Berkeley",
    schoolDistrict: "Berkeley County School District",
    elementary: [["Cane Bay Elementary", 6]],
    middle: [["Cane Bay Middle", 6]],
    high: [["Cane Bay High", 6]],
    builders: ["Lennar", "D.R. Horton", "Mungo Homes", "Del Webb"],
    floods: [["X", 92], ["X (shaded)", 8]],
    price: [350000, 480000],
    ppsf: [165, 210],
    hoa: [80, 120],
    year: [2019, 2024],
    sqft: [1750, 2700],
    lot: [0.12, 0.22],
    crime: [7, 8],
    walk: [20, 42],
    bike: [35, 50],
    transit: [10, 18],
    commute: { airportCHS: 40, downtown: 46, beach: 48, costco: 34, publix: 10, boeing: 32, jointBaseCharleston: 34, hospital: 24, flightSchool: 40, parks: 6, boatRamp: 26, shopping: 10 },
  },
  cainhoy: {
    // Cainhoy peninsula (Point Hope) — new master-planned, Berkeley County
    city: "Charleston",
    zip: "29492",
    county: "Berkeley",
    schoolDistrict: "Berkeley County School District",
    elementary: [["Philip Simmons Elementary", 8]],
    middle: [["Philip Simmons Middle", 8]],
    high: [["Philip Simmons High", 8]],
    builders: ["David Weekley Homes", "Pulte Homes", "Homes by Dickerson", "Lennar"],
    floods: [["X", 78], ["X (shaded)", 14], ["AE", 8]],
    price: [430000, 700000],
    ppsf: [225, 285],
    hoa: [90, 150],
    year: [2019, 2024],
    sqft: [1900, 3000],
    lot: [0.10, 0.20],
    crime: [8, 9],
    walk: [25, 50],
    bike: [40, 55],
    transit: [10, 20],
    commute: { airportCHS: 22, downtown: 26, beach: 28, costco: 16, publix: 8, boeing: 18, jointBaseCharleston: 22, hospital: 18, flightSchool: 20, parks: 6, boatRamp: 10, shopping: 9 },
  },
  goosecreek: {
    // Carnes Crossroads — Berkeley County master-planned near Goose Creek
    city: "Summerville",
    zip: "29486",
    county: "Berkeley",
    schoolDistrict: "Berkeley County School District",
    elementary: [["Carolyn Lewis Elementary", 7], ["Foxbank Elementary", 6]],
    middle: [["Berkeley Middle", 5], ["Sangaree Middle", 5]],
    high: [["Berkeley High", 6], ["Cane Bay High", 6]],
    builders: ["David Weekley Homes", "John Wieland Homes", "Saussy Burbank", "Pulte Homes"],
    floods: [["X", 88], ["X (shaded)", 12]],
    price: [400000, 600000],
    ppsf: [200, 255],
    hoa: [85, 140],
    year: [2019, 2024],
    sqft: [1850, 2900],
    lot: [0.10, 0.22],
    crime: [7, 8],
    walk: [28, 52],
    bike: [38, 54],
    transit: [10, 20],
    commute: { airportCHS: 26, downtown: 32, beach: 40, costco: 24, publix: 7, boeing: 20, jointBaseCharleston: 22, hospital: 16, flightSchool: 26, parks: 7, boatRamp: 20, shopping: 8 },
  },
};

// --- Neighborhoods (subdivision name, map center, street pool, count) ------
// 25 real Charleston-metro communities, ordered roughly by buyer priority.
const NEIGHBORHOODS = [
  { name: "Park West", area: "mpNorth", lat: 32.857, lng: -79.823, count: 3,
    streets: ["Park West Blvd", "Whitemarsh Way", "Hopeman Ln", "Ballantine Dr", "Marsh Cove Ln", "Beresford Run", "Sienna Dr", "Bridgepointe Dr"] },
  { name: "Carolina Park", area: "mpNorth", lat: 32.866, lng: -79.806, count: 3,
    streets: ["Carolina Park Blvd", "Rbelia St", "Sanders Farm Ln", "Mossy Branch St", "Hidden Grove St", "Bantry Ct", "Wodin Pl", "Banc St"] },
  { name: "Dunes West", area: "mpNorth", lat: 32.872, lng: -79.838, count: 2,
    streets: ["Harper Lake Dr", "Ayers Plantation Way", "Palm Cove Way", "Egret Walk Ln", "Watershed Dr", "Saint Thomas Dr"] },
  { name: "Oyster Point", area: "mpNorth", lat: 32.848, lng: -79.815, count: 2,
    streets: ["Oyster Point Row", "Wahoo Dr", "Sea Lavender Ln", "Crab Bank Dr", "Tidewater Dr"] },
  { name: "Liberty Hill Farm", area: "mpNorth", lat: 32.861, lng: -79.812, count: 2,
    streets: ["Mary Bramble Dr", "Liberty Hill Farm Rd", "Spirea Dr", "Wildflower Ln"] },
  { name: "Rivertowne", area: "mpNorth", lat: 32.851, lng: -79.808, count: 2,
    streets: ["Etiwan Park St", "Rivertowne Country Club Dr", "Rivertowne Pkwy", "Saturday Rd", "Sweetbay Dr"] },
  { name: "Hamlin Plantation", area: "mpNorth", lat: 32.842, lng: -79.808, count: 2,
    streets: ["Hamlin Sound Cir", "Planters Trace Loop", "Old Bridge Dr", "Park Crossing Dr", "Botany Bay Dr"] },
  { name: "Mount Pleasant", area: "mpSouth", lat: 32.823, lng: -79.851, count: 2,
    streets: ["Center Lake Dr", "Whipple Rd", "Bowman Rd", "Fairmont Ave", "Mathis Ferry Rd"] },
  { name: "Belle Hall", area: "mpSouth", lat: 32.829, lng: -79.847, count: 2,
    streets: ["Belle Hall Pkwy", "Daniel Island Dr", "Jamestowne Blvd", "Sanibel Dr", "Captiva Row"] },
  { name: "I'On", area: "mpSouth", lat: 32.808, lng: -79.864, count: 2,
    streets: ["Ionsborough St", "North Shelmore Blvd", "Civitas St", "Fairford Rd", "Hopetown Rd"] },
  { name: "Carolina Bay", area: "westAshley", lat: 32.793, lng: -80.055, count: 3,
    streets: ["Bremerton Pl", "Marsh Hen Dr", "Banbridge St", "Ashley Gardens Blvd", "Battery Bend Dr", "Crawford St", "Quinby Pl"] },
  { name: "Boltons Landing", area: "westAshley", lat: 32.800, lng: -80.060, count: 2,
    streets: ["Bolton Hall Rd", "Reggatta Rd", "Schooner Bend Ave", "Sweetbay Dr", "Marsh Creek Dr"] },
  { name: "West Ashley", area: "westAshley", lat: 32.797, lng: -80.012, count: 2,
    streets: ["Magwood Dr", "Sycamore Ave", "Carriage Hill Pl", "Wappoo Hall Rd", "Coburg Rd"] },
  { name: "Grand Oaks Plantation", area: "westAshley", lat: 32.804, lng: -80.085, count: 2,
    streets: ["Grand Oaks Blvd", "Ainsdale Dr", "Battery Haig Rd", "Lindera Preserve Ln", "Doncaster Dr"] },
  { name: "Hanahan", area: "hanahan", lat: 32.918, lng: -80.022, count: 2,
    streets: ["Tanner Ford Blvd", "Eagle Landing Blvd", "Foster Creek Rd", "Berkeley Hills Blvd", "Murray Dr"] },
  { name: "Tanner Plantation", area: "hanahan", lat: 32.930, lng: -80.012, count: 2,
    streets: ["Tanner Ford Blvd", "Brimsley Way", "Wando Reach Rd", "Mabeline Rd", "Plowden Mill Rd"] },
  { name: "Park Circle", area: "parkCircle", lat: 32.878, lng: -79.997, count: 3,
    streets: ["Buist Ave", "Jenkins Ave", "Mixson Ave", "O'Hear Ave", "Durant Ave", "Montague Ave"] },
  { name: "Daniel Island", area: "danielIsland", lat: 32.866, lng: -79.902, count: 2,
    streets: ["Seven Farms Dr", "Pier View St", "Ralston Creek St", "Delahow St", "King George St", "Iron Bottom Ln"] },
  { name: "Point Hope", area: "cainhoy", lat: 32.903, lng: -79.860, count: 2,
    streets: ["Point Hope Pkwy", "Nelliefield Creek Dr", "Sanctuary Park Dr", "Wando Villas Dr", "Clouter Creek Dr"] },
  { name: "Carnes Crossroads", area: "goosecreek", lat: 33.018, lng: -80.069, count: 2,
    streets: ["Carnes Crossroads Blvd", "Brachell Knoll Dr", "Hundred Oaks Pkwy", "Northern Pintail Dr", "Mascord Way"] },
  { name: "Nexton", area: "nexton", lat: 33.020, lng: -80.180, count: 3,
    streets: ["Brighton Park Blvd", "Sigmund St", "Marvin Gardens Ln", "Del Webb Blvd", "Edenton Rd"] },
  { name: "Summerville", area: "summerville", lat: 33.000, lng: -80.190, count: 2,
    streets: ["Old Trolley Rd", "Beech Hill Rd", "Drop Off Dr", "Sumter Ave", "Carolina Ave"] },
  { name: "The Ponds", area: "summerville", lat: 32.968, lng: -80.225, count: 2,
    streets: ["Hundred Oaks Pkwy", "Schoolhouse Way", "Amblescroft Rd", "Loftus Ln", "Spring Hollow Dr"] },
  { name: "Wescott Plantation", area: "summerville", lat: 32.927, lng: -80.118, count: 2,
    streets: ["Wescott Blvd", "Delafield Dr", "Plantation Pointe Dr", "Sapwood Rd", "Sayle Dr"] },
  { name: "Cane Bay", area: "caneBay", lat: 33.075, lng: -80.130, count: 2,
    streets: ["Cane Bay Blvd", "Saint Brides Dr", "Fair Winds Way", "Liberty Village Way", "Waterleaf Dr"] },
];

const PROP_TYPE_WEIGHTS = [["Single Family", 80], ["Townhome", 18], ["Condo", 2]];

function isoDaysAgo(days) {
  const d = new Date("2026-06-27T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

let counter = 0;
const listings = [];

for (const nb of NEIGHBORHOODS) {
  const a = AREAS[nb.area];
  const usedNumbers = new Set();
  for (let i = 0; i < nb.count; i++) {
    counter++;
    const propertyType = weighted(PROP_TYPE_WEIGHTS);
    const isAttached = propertyType !== "Single Family";

    // Core size & price (price derived from sqft × $psf for internal consistency)
    let sqft = irng(a.sqft[0], a.sqft[1]);
    if (isAttached) sqft = Math.min(sqft, irng(1700, 2200));
    const ppsf = rng(a.ppsf[0], a.ppsf[1]);
    let price = round(sqft * ppsf, 1000);
    price = Math.max(a.price[0], Math.min(a.price[1], price));

    const yearBuilt = irng(a.year[0], a.year[1]);
    const homeAge = 2026 - yearBuilt;

    // Street number unique within neighborhood
    let num;
    do {
      num = irng(100, 4999);
    } while (usedNumbers.has(num));
    usedNumbers.add(num);
    const street = pick(nb.streets);
    const unit = isAttached && rand() < 0.5 ? ` Unit ${irng(1, 24)}` : "";
    const address = `${num} ${street}${unit}`;

    // Jittered coordinates around the neighborhood center (~1.5km box)
    const lat = +(nb.lat + rng(-0.013, 0.013)).toFixed(6);
    const lng = +(nb.lng + rng(-0.014, 0.014)).toFixed(6);

    const floodZone = weighted(a.floods);
    const insuranceRequired = floodZone === "AE" || floodZone === "VE" || floodZone === "A";

    // Beds/baths scale with size
    const bedrooms = sqft > 2600 ? pick([4, 4, 5]) : sqft > 2000 ? pick([3, 4, 4]) : pick([3, 3, 4]);
    const bathrooms = bedrooms >= 5 ? pick([3, 4]) : bedrooms === 4 ? pick([2.5, 3, 3]) : pick([2, 2.5, 2.5]);
    const halfBaths = Number.isInteger(bathrooms) ? (rand() < 0.4 ? 1 : 0) : 1;
    const fullBaths = Math.floor(bathrooms);
    const garageSpaces = isAttached ? pick([1, 2, 2]) : pick([2, 2, 2, 3]);
    const stories = isAttached ? pick([2, 3]) : sqft > 2600 ? 2 : pick([1, 2, 2]);

    const lotSizeAcres = isAttached ? +rng(0.04, 0.09).toFixed(2) : +rng(a.lot[0], a.lot[1]).toFixed(2);

    const hoaMonthly = round(isAttached ? rng(180, 320) : rng(a.hoa[0], a.hoa[1]), 5);

    // Taxes: SC primary residence ≈ 0.5% effective of market value (±15%)
    const annualTaxes = round(price * 0.005 * rng(0.85, 1.15), 25);
    // Homeowners + wind ≈ 0.6% of value on the coast (±20%), higher near water
    const windFactor = a.commute.beach <= 16 ? 1.15 : 1.0;
    const estInsuranceAnnual = round(price * 0.006 * windFactor * rng(0.85, 1.15), 50);
    // Flood premium only when required (NFIP RR2.0 varies widely)
    const estFloodInsuranceAnnual = insuranceRequired
      ? round((floodZone === "VE" ? rng(2400, 4200) : rng(900, 2200)), 25)
      : rand() < 0.25
        ? round(rng(450, 750), 25) // some owners carry preferred-risk in X
        : 0;

    const daysOnMarket = Math.max(1, Math.round(Math.abs(rng(2, 95))));
    const hadCut = daysOnMarket > 35 && rand() < 0.55;
    const originalPrice = hadCut ? round(price * rng(1.02, 1.06), 1000) : price;
    const priceHistory = hadCut
      ? [
          { date: isoDaysAgo(daysOnMarket), price: originalPrice },
          { date: isoDaysAgo(Math.round(daysOnMarket * 0.4)), price },
        ]
      : [{ date: isoDaysAgo(daysOnMarket), price }];
    const sellerConcessions = daysOnMarket > 50 ? round(price * rng(0.005, 0.015), 500) : 0;

    const roofAgeYears = Math.min(homeAge, irng(0, Math.max(1, homeAge)));
    const hvacAgeYears = Math.min(homeAge, irng(0, Math.max(1, homeAge)));

    const [elName, elRating] = pick(a.elementary);
    const [mdName, mdRating] = pick(a.middle);
    const [hsName, hsRating] = pick(a.high);

    const id = `${slugify(nb.name)}-${slugify(street)}-${num}-${counter}`;
    const q = encodeURIComponent(`${address}, ${a.city}, SC ${a.zip}`);

    const listing = {
      id,
      mlsId: `CHS${String(2400000 + counter * 137).slice(0, 7)}`,
      source: "Sample MLS feed (curated)",
      listingUrls: {
        zillow: `https://www.zillow.com/homes/${q}_rb/`,
        realtor: `https://www.realtor.com/realestateandhomes-search/${q}`,
        redfin: `https://www.redfin.com/stingray/do/location-autocomplete?location=${q}`,
        googleMaps: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        virtualTour: rand() < 0.4 ? `https://my.matterport.com/show/?m=sample-${id}` : undefined,
      },
      photos: [
        `https://picsum.photos/seed/${id}-a/960/640`,
        `https://picsum.photos/seed/${id}-b/960/640`,
        `https://picsum.photos/seed/${id}-c/960/640`,
        `https://picsum.photos/seed/${id}-d/960/640`,
      ],
      address,
      lat,
      lng,
      neighborhood: nb.name,
      subdivision: nb.name,
      city: a.city,
      zip: a.zip,
      county: a.county,
      builder: pick(a.builders),
      yearBuilt,
      bedrooms,
      bathrooms,
      halfBaths,
      garageSpaces,
      stories,
      sqft,
      lotSizeAcres,
      price,
      hoaMonthly,
      annualTaxes,
      estInsuranceAnnual,
      estFloodInsuranceAnnual,
      floodZone,
      floodHistory:
        floodZone === "X"
          ? "No recorded flood losses; outside the mapped 100/500-yr floodplain."
          : floodZone === "X (shaded)"
            ? "Within the 0.2%-annual (500-yr) zone; no recorded structural flood losses."
            : "Within a FEMA Special Flood Hazard Area; verify Elevation Certificate and any prior claims.",
      daysOnMarket,
      priceHistory,
      sellerConcessions,
      listingAgent: pick(AGENTS),
      propertyType,
      condition: {
        roofAgeYears,
        hvacAgeYears,
        waterHeater: pick(WATER_HEATERS),
        exteriorMaterial: pick(EXTERIORS),
        energyFeatures: pick(ENERGY),
        internet: pick(INTERNET),
        utilities: UTILS,
      },
      schools: {
        district: a.schoolDistrict,
        elementary: { name: elName, rating: elRating },
        middle: { name: mdName, rating: mdRating },
        high: { name: hsName, rating: hsRating },
      },
      crimeRating: irng(a.crime[0], a.crime[1]),
      walkScore: irng(a.walk[0], a.walk[1]),
      bikeScore: irng(a.bike[0], a.bike[1]),
      transitScore: irng(a.transit[0], a.transit[1]),
      commute: Object.fromEntries(
        Object.entries(a.commute).map(([k, v]) => [k, Math.max(2, Math.round(v + rng(-3, 3)))]),
      ),
    };

    // Strip undefined (JSON.stringify drops them anyway, but keep clean).
    if (!listing.listingUrls.virtualTour) delete listing.listingUrls.virtualTour;

    listings.push(listing);
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(listings, null, 2) + "\n");
console.log(`Wrote ${listings.length} listings to ${OUT}`);
