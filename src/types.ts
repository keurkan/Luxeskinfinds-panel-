/**
 * Mirrors the `Product` type in luxeskinfinds/src/lib/products.ts exactly.
 * Keep these two in sync by hand — the two projects live in separate repos
 * on purpose, so there's no shared import between them.
 */
export type PriceBand = "$" | "$$" | "$$$";

export type Vessel =
  | "dropper"
  | "jar"
  | "pump"
  | "spray"
  | "tube"
  | "sachet"
  | "bottle";

export type Product = {
  id: string;
  name: string;
  brand: string;
  angle: string;
  band: PriceBand;
  keyIngredients: string[];
  bestFor: string[];
  pros: string[];
  cons: string[];
  vessel?: Vessel;
  asin?: string;
  directUrl?: string;
  directMerchant?: string;
  image?: string;
  search: string;
};

export const emptyProduct = (): Product => ({
  id: "",
  name: "",
  brand: "",
  angle: "",
  band: "$$",
  keyIngredients: [],
  bestFor: [],
  pros: [],
  cons: [],
  vessel: "bottle",
  asin: "",
  directUrl: "",
  directMerchant: "",
  image: "",
  search: "",
});

export const VESSELS: Vessel[] = [
  "dropper", "jar", "pump", "spray", "tube", "sachet", "bottle",
];

export const BANDS: PriceBand[] = ["$", "$$", "$$$"];
