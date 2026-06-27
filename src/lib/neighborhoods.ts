/**
 * Neighborhood / submarket metadata for the Charleston metro target areas.
 *
 * Growth, desirability and family scores (0–100) encode local market
 * knowledge that isn't present on an individual listing. They feed the
 * appreciation and neighborhood components of the scoring model.
 */

export interface NeighborhoodMeta {
  name: string;
  area: string; // broader submarket grouping
  desirability: number; // resale demand / prestige
  growth: number; // forward appreciation potential
  family: number; // family-friendliness
  priority: number; // buyer's stated priority (1 highest)
  blurb: string;
}

export const NEIGHBORHOODS: NeighborhoodMeta[] = [
  { name: "Park West", area: "Mount Pleasant", desirability: 90, growth: 78, family: 93, priority: 1, blurb: "Established master-planned MP community; top schools, amenities, easy 17 access." },
  { name: "Carolina Park", area: "Mount Pleasant", desirability: 91, growth: 85, family: 94, priority: 1, blurb: "Newer master-planned MP neighborhood; Wando schools, parks, town center." },
  { name: "Dunes West", area: "Mount Pleasant", desirability: 88, growth: 75, family: 90, priority: 1, blurb: "Gated golf community along the Wando; larger lots, boating access." },
  { name: "Oyster Point", area: "Mount Pleasant", desirability: 89, growth: 80, family: 92, priority: 1, blurb: "Recent David Weekley/Pulte community; lagoon amenities, strong demand." },
  { name: "Liberty Hill Farm", area: "Mount Pleasant", desirability: 87, growth: 82, family: 90, priority: 1, blurb: "Newer MP enclave near Carolina Park; quick to 526." },
  { name: "Mount Pleasant", area: "Mount Pleasant", desirability: 92, growth: 79, family: 94, priority: 1, blurb: "Charleston's premier East Cooper suburb; best schools and resale in the metro." },
  { name: "Rivertowne", area: "Mount Pleasant", desirability: 86, growth: 74, family: 90, priority: 1, blurb: "Arnold Palmer golf community along the Wando; pool, tennis, deep-water access." },
  { name: "Hamlin Plantation", area: "Mount Pleasant", desirability: 87, growth: 75, family: 91, priority: 1, blurb: "Lowcountry-style MP community near Hamlin Sound; resort amenities, Laing/Wando schools." },
  { name: "Belle Hall", area: "Mount Pleasant", desirability: 88, growth: 76, family: 90, priority: 1, blurb: "Close-in South MP; quick I-526 access, walk to shops, marsh-front sections." },
  { name: "I'On", area: "Mount Pleasant", desirability: 94, growth: 78, family: 89, priority: 1, blurb: "New-urbanist, highly walkable village; premium prices and exceptional resale." },
  { name: "Grand Oaks Plantation", area: "West Ashley", desirability: 80, growth: 76, family: 85, priority: 2, blurb: "Established West Ashley community off Glenn McConnell; parks, value, easy 526." },
  { name: "Tanner Plantation", area: "Berkeley", desirability: 79, growth: 82, family: 84, priority: 2, blurb: "Hanahan master-planned community; town center, short hop to airport and Boeing." },
  { name: "Point Hope", area: "Cainhoy", desirability: 84, growth: 88, family: 89, priority: 2, blurb: "Fast-growing Cainhoy peninsula community; Philip Simmons schools, close to airport." },
  { name: "Carnes Crossroads", area: "Berkeley", desirability: 83, growth: 88, family: 88, priority: 3, blurb: "Award-winning Berkeley master-planned community; lakes, trails, John Wieland homes." },
  { name: "The Ponds", area: "Summerville", desirability: 78, growth: 80, family: 87, priority: 3, blurb: "Conservation-focused Summerville community; historic farmhouse amenity, tree canopy." },
  { name: "Wescott Plantation", area: "Summerville", desirability: 74, growth: 76, family: 84, priority: 3, blurb: "Golf community in Dorchester II schools; established, good value north of Ashley." },
  { name: "Carolina Bay", area: "West Ashley", desirability: 79, growth: 80, family: 83, priority: 2, blurb: "Popular West Ashley master-planned community; parks, pools, value vs MP." },
  { name: "Boltons Landing", area: "West Ashley", desirability: 75, growth: 73, family: 81, priority: 2, blurb: "West Ashley community with amenities; commuter-friendly to downtown." },
  { name: "West Ashley", area: "West Ashley", desirability: 77, growth: 75, family: 81, priority: 2, blurb: "Close-in to downtown; mix of new and established, improving value." },
  { name: "Hanahan", area: "Berkeley", desirability: 76, growth: 83, family: 82, priority: 2, blurb: "Central Berkeley County town; strong value, fast-improving, near Tanger/Park Circle." },
  { name: "Park Circle", area: "North Charleston", desirability: 81, growth: 88, family: 79, priority: 2, blurb: "Trendy, rapidly appreciating; walkable East Montague district, close to airport/Boeing." },
  { name: "Daniel Island", area: "Daniel Island", desirability: 93, growth: 76, family: 92, priority: 3, blurb: "Premium island town; top amenities and schools — buy only on an exceptional deal." },
  { name: "Nexton", area: "Summerville", desirability: 84, growth: 90, family: 89, priority: 3, blurb: "Award-winning master-planned community; explosive growth, gigabit internet." },
  { name: "Summerville", area: "Summerville", desirability: 71, growth: 78, family: 83, priority: 3, blurb: "Historic Flowertown; affordable, family-oriented, longer airport commute." },
  { name: "Cane Bay", area: "Berkeley", desirability: 69, growth: 80, family: 85, priority: 4, blurb: "Affordable master-planned Berkeley community; great value, longest commute." },
];

const BY_NAME = new Map(NEIGHBORHOODS.map((n) => [n.name.toLowerCase(), n]));

const DEFAULT_META: NeighborhoodMeta = {
  name: "Charleston metro",
  area: "Charleston",
  desirability: 75,
  growth: 76,
  family: 82,
  priority: 3,
  blurb: "Charleston-area community with similar characteristics to the target list.",
};

export function neighborhoodMeta(name: string): NeighborhoodMeta {
  return BY_NAME.get(name.trim().toLowerCase()) ?? DEFAULT_META;
}

export function allNeighborhoodNames(): string[] {
  return NEIGHBORHOODS.map((n) => n.name);
}
