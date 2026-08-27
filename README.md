# LuxeSkinFinds Panel

A local authoring tool for the LuxeSkinFinds product catalogue. Fill in a form,
watch the card render exactly as it will on the site, then copy TypeScript that
pastes straight into `src/lib/products.ts`.

```bash
npm install
cp .env.example .env   # add your Anthropic API key
npm run dev
```

Runs on **http://localhost:3001**, so it can sit alongside the site's own dev
server on port 3000.

The two AI features need an Anthropic API key. Everything else works without
one. The key is read server-side from `.env` (gitignored) by a Vite middleware
plugin — it never enters the client bundle, and the browser only ever calls
same-origin `/api/*` routes.

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

## Theme

Light by default, with a toggle in the top bar. Like the site it doesn't
follow `prefers-color-scheme`: the panel previews a site whose canonical
palette is light, so the OS shouldn't silently flip what you're checking your
work against. The choice persists to `localStorage` and is applied before
first paint by the inline script in `index.html`.

Dark re-points the same token names in `index.css`, mirroring the site's own
dark palette so the preview still reads true against what ships.

## Scan the pack

Drop a photo of the packaging — optionally with the listing text pasted in —
and it reads what's printed and fills in brand, name and ingredients.

The system prompt is in `server/prompts.ts` and its grounding rule is a
compliance requirement, not a style preference. The model reports only what is
legible in the image or explicitly present in the pasted text. It leaves fields
empty rather than guessing, never infers a property from the product category
(an oil is not "fast-absorbing" unless the label says so), and is told
explicitly not to fill gaps from its own knowledge of the brand — recognising a
product is not the same as reading it.

Texture, scent and claims are shown as reference rather than written into the
form. They aren't `Product` fields, and turning a printed claim into site copy
is a judgement call that belongs to the writer. The result also reports what it
could not read, so you know what to verify by hand.

## Pinterest pins

Generates four pin ideas for the current product, one per search intent —
problem-led, comparison, routine, ingredient-led — so they compete for
different queries instead of being four rewordings of one idea.

Each returns a title (under 60 characters, keyword first), a description
(2–3 natural sentences, 150–300 characters, ending with `#ad` and at most two
other hashtags), alt text, and a design note so the pins stay visually distinct
too. Character counts are shown against their limits.

Descriptions are written as prose on purpose. Pinterest ranks primarily on
title and description keywords; hashtags carry roughly 1% of the weight, so a
hashtag-stacked description trades away the readable copy that actually drives
saves for almost nothing.

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
