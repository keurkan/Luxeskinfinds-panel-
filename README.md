# LuxeSkinFinds Panel

A local authoring tool for the LuxeSkinFinds product catalogue. Fill in a form,
watch the card render exactly as it will on the site, then copy TypeScript that
pastes straight into `src/lib/products.ts`.

```bash
npm install
npm run dev
```

Runs on **http://localhost:3001**, so it can sit alongside the site's own dev
server on port 3000.

## Why it exists

Products on the site are typed TypeScript objects, not database rows. That's a
deliberate choice — it's what lets an affiliate product box be a block a writer
drops mid-article. The cost is that adding a product means hand-editing a large
file and getting the shape exactly right.

This tool removes that cost without changing the architecture.

## What it does

- **Auto-derives the id** from brand + name (`Beauty of Joseon` + `Relief Sun` →
  `beauty-of-joseon-relief-sun`). Override it if you want; it stops
  auto-updating once you do.
- **Live preview** built from the same design tokens and the same packaging
  silhouettes as the real `ProductCard`, so what you see is what ships.
- **Blocks incomplete entries.** The copy button stays disabled until every
  required field is filled — including `cons`, because every product on the site
  names its trade-offs.
- **Validates the ASIN shape** (exactly 10 alphanumeric characters).
- **Batches.** Queue several products, then copy them all at once.

## What it deliberately doesn't do

It doesn't write to the site's files. The two projects are separate repos with
no shared imports, and the panel has no filesystem access to the site. You paste
the output yourself — which also means you get to review it before it lands.

## Keeping the schema in sync

`src/types.ts` mirrors the `Product` type in
`luxeskinfinds/src/lib/products.ts`. If you add a field to the site's type, add
it here too. There's no automatic link between them, on purpose — the panel
should never be able to break the site.

## Notes on prices and images

No price field, by design: Amazon's operating agreement forbids displaying a
price that can go stale, so the site shows a band (`$`/`$$`/`$$$`) and sends
shoppers to the live listing.

For photos, leave the path empty and instead drop the file into the site's
`public/products/` named after the product id, then run `npm run images` there.
