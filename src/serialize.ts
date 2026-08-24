import type { Product } from "./types";

/** Escapes a string for a double-quoted TS string literal. */
function q(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function strArray(items: string[], indent: string): string {
  if (items.length === 0) return "[]";
  const inner = items.map((i) => `${indent}  ${q(i)},`).join("\n");
  return `[\n${inner}\n${indent}]`;
}

/**
 * Renders one product as a TS object literal in the exact style used across
 * luxeskinfinds/src/lib/products.ts — same field order, same quoting, same
 * indentation — so the output can be pasted straight into the array with no
 * reformatting.
 */
export function serializeProduct(p: Product): string {
  const lines: string[] = [];
  lines.push("  {");
  lines.push(`    id: ${q(p.id || "product-id")},`);
  lines.push(`    name: ${q(p.name)},`);
  lines.push(`    brand: ${q(p.brand)},`);
  lines.push(`    angle: ${q(p.angle)},`);
  lines.push(`    band: ${q(p.band)},`);
  lines.push(`    keyIngredients: ${strArray(p.keyIngredients, "    ")},`);
  lines.push(`    bestFor: ${strArray(p.bestFor, "    ")},`);
  lines.push(`    pros: ${strArray(p.pros, "    ")},`);
  lines.push(`    cons: ${strArray(p.cons, "    ")},`);
  if (p.vessel) lines.push(`    vessel: ${q(p.vessel)},`);
  if (p.asin?.trim()) lines.push(`    asin: ${q(p.asin.trim())},`);
  if (p.directUrl?.trim()) lines.push(`    directUrl: ${q(p.directUrl.trim())},`);
  if (p.directMerchant?.trim()) lines.push(`    directMerchant: ${q(p.directMerchant.trim())},`);
  if (p.image?.trim()) lines.push(`    image: ${q(p.image.trim())},`);
  lines.push(`    search: ${q(p.search)},`);
  lines.push("  },");
  return lines.join("\n");
}

export function serializeProducts(products: Product[]): string {
  return products.map(serializeProduct).join("\n");
}
