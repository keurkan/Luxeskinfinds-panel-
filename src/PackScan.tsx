import { useRef, useState } from "react";
import { extractFromPack, readFileAsBase64 } from "./lib";
import type { Extraction } from "./lib";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Drop a packaging photo (and optionally paste listing text), and the model
 * reports what's legible on it.
 *
 * Only brand, name and ingredients are written into the form — texture, scent
 * and claims are shown as reference instead. They aren't Product fields, and
 * turning a printed claim into site copy is a judgement call that stays with
 * the writer.
 */
export function PackScan({
  onApply,
}: {
  onApply: (fields: { brand: string; name: string; ingredients: string[] }) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<{ base64: string; mediaType: string } | null>(null);
  const [listingText, setListingText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extraction | null>(null);
  const [applied, setApplied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function accept(f: File) {
    setError(null);
    setResult(null);
    setApplied(false);
    if (!ACCEPTED.includes(f.type)) {
      setError("That file type isn't supported. Use a JPEG, PNG, WebP or GIF.");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setError("That image is over 8MB. Try a smaller one.");
      return;
    }
    const { base64, dataUrl } = await readFileAsBase64(f);
    setFile({ base64, mediaType: f.type });
    setPreview(dataUrl);
  }

  async function scan() {
    setBusy(true);
    setError(null);
    setApplied(false);
    try {
      const extraction = await extractFromPack({
        imageBase64: file?.base64,
        mediaType: file?.mediaType,
        listingText,
      });
      setResult(extraction);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function apply() {
    if (!result) return;
    onApply({ brand: result.brand, name: result.name, ingredients: result.ingredients });
    setApplied(true);
  }

  const canScan = (!!file || listingText.trim().length > 0) && !busy;
  const emptyFields = result
    ? (["texture", "scent", "sizeOrNet"] as const).filter((k) => !result[k].trim())
    : [];

  return (
    <section className="card">
      <h2 className="card-title">Scan the pack</h2>
      <p className="card-sub">
        Drop a photo of the packaging and it reads what&rsquo;s printed on it. Paste listing text
        too if you have it.
      </p>

      <div
        className={`dropzone ${dragging ? "is-dragging" : ""} ${preview ? "has-image" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) void accept(f);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); }
        }}
        role="button"
        tabIndex={0}
        aria-label="Drop a product photo, or click to choose a file"
      >
        {preview ? (
          <img src={preview} alt="The packaging photo you selected" className="drop-preview" />
        ) : (
          <div className="drop-empty">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="8.5" cy="9.5" r="1.5" />
              <path d="M21 15l-5-5L5 20" />
            </svg>
            <span>Drop a product photo, or click to choose</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void accept(f); }}
        />
      </div>

      {preview && (
        <button className="link-btn" style={{ marginTop: 10 }} onClick={() => { setPreview(null); setFile(null); setResult(null); }}>
          Remove photo
        </button>
      )}

      <div className="field">
        <label htmlFor="listing">
          Listing text <span className="hint">Optional. Paste the Amazon description if you have it.</span>
        </label>
        <textarea id="listing" value={listingText} onChange={(e) => setListingText(e.target.value)} placeholder="Paste the product listing here…" />
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={() => void scan()} disabled={!canScan}>
          {busy ? "Reading the pack…" : "Read the pack"}
        </button>
      </div>

      {error && <div className="warn" role="alert"><strong>Couldn&rsquo;t scan.</strong> {error}</div>}

      {result && (
        <div className="extraction">
          <div className="extraction-head">
            <p className="eyebrow" style={{ color: "var(--gold)" }}>What&rsquo;s legible on the pack</p>
            <button className="btn btn-ghost" onClick={apply} disabled={applied}>
              {applied ? "Applied" : "Fill brand, name & ingredients"}
            </button>
          </div>

          <dl className="extraction-grid">
            <Row label="Brand" value={result.brand} />
            <Row label="Name" value={result.name} />
            <Row label="Texture" value={result.texture} />
            <Row label="Scent" value={result.scent} />
            <Row label="Size" value={result.sizeOrNet} />
          </dl>

          <ListBlock label="Claims printed on pack" items={result.claims} />
          <ListBlock label="Ingredients" items={result.ingredients} />

          {(result.legibilityNotes.trim() || emptyFields.length > 0) && (
            <div className="warn" style={{ background: "var(--gold-wash)", borderLeftColor: "var(--gold-soft)" }}>
              <strong style={{ color: "var(--gold)" }}>Verify by hand.</strong>{" "}
              {result.legibilityNotes.trim()}
              {emptyFields.length > 0 && ` Left empty because they weren't legible: ${emptyFields.join(", ")}.`}
            </div>
          )}

          <p className="hint" style={{ marginTop: 14 }}>
            Claims and texture are shown for reference, not written into the form — turning a
            printed claim into site copy is your call, not the model&rsquo;s.
          </p>
        </div>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="extraction-row">
      <dt>{label}</dt>
      <dd>{value.trim() || <span className="empty">not legible</span>}</dd>
    </div>
  );
}

function ListBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="extraction-list">
      <p className="extraction-label">{label}</p>
      {items.length === 0 ? (
        <p className="empty" style={{ fontSize: "0.875rem" }}>none legible</p>
      ) : (
        <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>
      )}
    </div>
  );
}
