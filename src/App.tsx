import { useMemo, useState } from "react";
import { BANDS, VESSELS, emptyProduct } from "./types";
import type { PriceBand, Product, Vessel } from "./types";
import { serializeProduct, serializeProducts } from "./serialize";
import { VesselTile } from "./VesselArt";

/** Turns "Beauty of Joseon" + "Relief Sun" into "beauty-of-joseon-relief-sun". */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** One item per line — the least fiddly way to enter a short list. */
function toLines(value: string): string[] {
  return value.split("\n").map((l) => l.trim()).filter(Boolean);
}

export default function App() {
  const [draft, setDraft] = useState<Product>(emptyProduct());
  const [ingredientsRaw, setIngredientsRaw] = useState("");
  const [bestForRaw, setBestForRaw] = useState("");
  const [prosRaw, setProsRaw] = useState("");
  const [consRaw, setConsRaw] = useState("");
  const [idTouched, setIdTouched] = useState(false);
  const [saved, setSaved] = useState<Product[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const product: Product = useMemo(
    () => ({
      ...draft,
      keyIngredients: toLines(ingredientsRaw),
      bestFor: toLines(bestForRaw),
      pros: toLines(prosRaw),
      cons: toLines(consRaw),
    }),
    [draft, ingredientsRaw, bestForRaw, prosRaw, consRaw],
  );

  const set = <K extends keyof Product>(key: K, value: Product[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // Auto-derive the id from brand + name until the user edits it themselves.
  const syncId = (brand: string, name: string) => {
    if (!idTouched) {
      const auto = slugify(`${brand} ${name}`);
      setDraft((d) => ({ ...d, id: auto }));
    }
  };

  // Required by the Product type, or required in practice for the card to work.
  const missing: string[] = [];
  if (!product.brand.trim()) missing.push("brand");
  if (!product.name.trim()) missing.push("product name");
  if (!product.id.trim()) missing.push("id");
  if (!product.angle.trim()) missing.push("angle");
  if (!product.search.trim()) missing.push("Amazon search phrase");
  if (product.keyIngredients.length === 0) missing.push("key ingredients");
  if (product.pros.length === 0) missing.push("what we like");
  if (product.cons.length === 0) missing.push("worth knowing");

  const asinLooksWrong =
    !!product.asin?.trim() && !/^[A-Z0-9]{10}$/.test(product.asin.trim());

  const code = serializeProduct(product);

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1800);
  }

  function saveToBatch() {
    setSaved((s) => [...s, product]);
    setDraft(emptyProduct());
    setIngredientsRaw(""); setBestForRaw(""); setProsRaw(""); setConsRaw("");
    setIdTouched(false);
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="wordmark">
            <span className="luxe">Luxe</span>
            <span className="skin">SkinFinds</span>
          </span>
          <span className="tag">Product Panel</span>
        </div>
      </header>

      <div className="layout">
        {/* ---------------------------------------------------- form */}
        <div>
          <section className="card">
            <h2 className="card-title">Add a product</h2>
            <p className="card-sub">
              Fill this in, then copy the generated code into{" "}
              <code>luxeskinfinds/src/lib/products.ts</code>.
            </p>

            <div className="row">
              <div className="field">
                <label htmlFor="brand">Brand</label>
                <input
                  id="brand" type="text" value={draft.brand}
                  placeholder="LANEIGE"
                  onChange={(e) => { set("brand", e.target.value); syncId(e.target.value, draft.name); }}
                />
              </div>
              <div className="field">
                <label htmlFor="name">Product name</label>
                <input
                  id="name" type="text" value={draft.name}
                  placeholder="Lip Sleeping Mask"
                  onChange={(e) => { set("name", e.target.value); syncId(draft.brand, e.target.value); }}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="id">
                ID
                <span className="hint">
                  Auto-filled from brand + name. Must be unique, and it's what a photo file is named after.
                </span>
              </label>
              <input
                id="id" type="text" value={draft.id} placeholder="laneige-lip-mask"
                onChange={(e) => { setIdTouched(true); set("id", e.target.value); }}
              />
            </div>

            <div className="field">
              <label htmlFor="angle">
                Angle
                <span className="hint">One line of positioning — shows as the italic subtitle.</span>
              </label>
              <input
                id="angle" type="text" value={draft.angle}
                placeholder="The one overnight treatment that fixes the problem in a single night"
                onChange={(e) => set("angle", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Price band</label>
              <div className="segmented">
                {BANDS.map((b) => (
                  <button
                    key={b} type="button" className="seg"
                    aria-pressed={draft.band === b}
                    onClick={() => set("band", b as PriceBand)}
                  >{b}</button>
                ))}
              </div>
              <p className="hint">No exact prices — Amazon's terms forbid showing one that can go stale.</p>
            </div>

            <div className="field">
              <label>Packaging shape</label>
              <div className="segmented">
                {VESSELS.map((v) => (
                  <button
                    key={v} type="button" className="seg"
                    aria-pressed={draft.vessel === v}
                    onClick={() => set("vessel", v as Vessel)}
                  >{v}</button>
                ))}
              </div>
              <p className="hint">Drawn on the card until a real photo is added.</p>
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">Details</h2>
            <p className="card-sub">One item per line.</p>

            <div className="field">
              <label htmlFor="ing">Key ingredients</label>
              <textarea id="ing" value={ingredientsRaw} placeholder={"Murumuru seed butter\nShea butter\nBerry complex"} onChange={(e) => setIngredientsRaw(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="bf">Best for</label>
              <textarea id="bf" value={bestForRaw} placeholder={"Chronically dry lips\nWinter"} onChange={(e) => setBestForRaw(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="pros">What we like</label>
              <textarea id="pros" value={prosRaw} placeholder={"Seals lips overnight rather than evaporating like a balm"} onChange={(e) => setProsRaw(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="cons">
                Worth knowing
                <span className="hint">Always fill this in — every product on the site names its trade-offs.</span>
              </label>
              <textarea id="cons" value={consRaw} placeholder={"Sweet scent some find distracting at bedtime"} onChange={(e) => setConsRaw(e.target.value)} />
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">Links</h2>
            <p className="card-sub">Your Amazon tag is applied automatically by the site.</p>

            <div className="field">
              <label htmlFor="search">
                Amazon search phrase
                <span className="hint">Used when there's no ASIN. Keep it precise enough to land on the right product.</span>
              </label>
              <input id="search" type="text" value={draft.search} placeholder="LANEIGE Lip Sleeping Mask Berry" onChange={(e) => set("search", e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="asin">
                ASIN <span className="hint">Optional. 10 characters, from the product URL. Converts better than a search link.</span>
              </label>
              <input id="asin" type="text" value={draft.asin ?? ""} placeholder="B07XXPHQZK" onChange={(e) => set("asin", e.target.value.toUpperCase())} />
              {asinLooksWrong && (
                <div className="warn">
                  <strong>Check this.</strong> An ASIN is exactly 10 characters, letters and digits only.
                </div>
              )}
            </div>

            <div className="row">
              <div className="field">
                <label htmlFor="durl">Direct brand link <span className="hint">Optional — overrides Amazon.</span></label>
                <input id="durl" type="text" value={draft.directUrl ?? ""} placeholder="https://oseamalibu.com/...?ref=CODE" onChange={(e) => set("directUrl", e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="dm">Merchant name</label>
                <input id="dm" type="text" value={draft.directMerchant ?? ""} placeholder="OSEA" onChange={(e) => set("directMerchant", e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="img">
                Photo path
                <span className="hint">Optional. Or just drop the file in public/products/ and run npm run images.</span>
              </label>
              <input id="img" type="text" value={draft.image ?? ""} placeholder="/products/laneige-lip-mask.jpg" onChange={(e) => set("image", e.target.value)} />
            </div>
          </section>
        </div>

        {/* ------------------------------------------------- preview */}
        <div className="right-rail">
          <section className="card">
            <h2 className="card-title">Live preview</h2>
            <p className="card-sub">How this renders on the site.</p>

            <div className="preview-card" style={{ marginTop: 20 }}>
              <div className="preview-body">
                <div className="preview-head">
                  <VesselTile id={product.id} vessel={product.vessel ?? "bottle"} brand={product.brand} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                      <div>
                        <p className="preview-brand">{product.brand || <span className="empty">Brand</span>}</p>
                        <h3 className="preview-name">{product.name || <span className="empty">Product name</span>}</h3>
                      </div>
                      <span className="band-pill">{product.band}</span>
                    </div>
                    <p className="preview-angle">{product.angle || <span className="empty">Your one-line angle appears here.</span>}</p>
                  </div>
                </div>

                {product.keyIngredients.length > 0 && (
                  <div className="chips">
                    {product.keyIngredients.map((i) => <span key={i} className="chip">{i}</span>)}
                  </div>
                )}

                <div className="cols">
                  <div className="pros">
                    <h4 style={{ color: "var(--ink)" }}>What we like</h4>
                    <ul>{product.pros.map((p) => <li key={p}>{p}</li>)}</ul>
                  </div>
                  <div className="cons">
                    <h4 style={{ color: "var(--ink)" }}>Worth knowing</h4>
                    <ul>{product.cons.map((c) => <li key={c}>{c}</li>)}</ul>
                  </div>
                </div>

                <div className="preview-cta">
                  <span className="cta-btn">
                    Check price on {product.directUrl?.trim() ? (product.directMerchant?.trim() || "the brand") : "Amazon"}
                  </span>
                  {product.bestFor.length > 0 && (
                    <span className="cta-meta">Best for: {product.bestFor.join(" · ")}</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">Generated code</h2>
            <p className="card-sub">Paste into the <code>products</code> array in <code>src/lib/products.ts</code>.</p>
            {missing.length > 0 && (
              <div className="warn">
                <strong>Still missing:</strong> {missing.join(", ")}.
              </div>
            )}
            <pre className="code">{code}</pre>
            <div className="btn-row">
              <button
                className="btn btn-primary"
                onClick={() => copy(code, "one")}
                disabled={missing.length > 0}
                title={missing.length > 0 ? "Fill in the missing fields first" : undefined}
              >
                {copied === "one" ? "Copied" : "Copy this product"}
              </button>
              <button className="btn btn-ghost" onClick={saveToBatch} disabled={missing.length > 0}>Add another</button>
            </div>
          </section>

          {saved.length > 0 && (
            <section className="card">
              <h2 className="card-title">Batch ({saved.length})</h2>
              <p className="card-sub">Products queued this session.</p>
              <div className="saved-list">
                {saved.map((s, i) => (
                  <div className="saved-item" key={`${s.id}-${i}`}>
                    <div>
                      <div className="nm">{s.brand} {s.name}</div>
                      <div className="sub">{s.id}</div>
                    </div>
                    <button className="link-btn" onClick={() => setSaved((list) => list.filter((_, n) => n !== i))}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="btn-row">
                <button className="btn btn-primary" onClick={() => copy(serializeProducts([...saved, product]), "all")}>
                  {copied === "all" ? "Copied" : `Copy all ${saved.length + 1}`}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
