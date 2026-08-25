import { useState } from "react";
import { generatePins } from "./lib";
import type { Pin, PinAngle } from "./lib";
import type { Product } from "./types";

const ANGLE_LABEL: Record<PinAngle, string> = {
  "problem-led": "Problem-led",
  comparison: "Comparison",
  routine: "Routine",
  "ingredient-led": "Ingredient-led",
};

const ANGLE_INTENT: Record<PinAngle, string> = {
  "problem-led": "searching a symptom",
  comparison: "weighing options",
  routine: "searching a sequence",
  "ingredient-led": "searching the active",
};

/** Pinterest counts characters, so we show the same number the platform will. */
const len = (s: string) => [...s].length;

export function PinIdeas({ product, ready }: { product: Product; ready: boolean }) {
  const [pins, setPins] = useState<Pin[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const { pins: result } = await generatePins({
        brand: product.brand,
        name: product.name,
        angle: product.angle,
        keyIngredients: product.keyIngredients,
        bestFor: product.bestFor,
        pros: product.pros,
        cons: product.cons,
      });
      setPins(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function copyPin(pin: Pin, index: number) {
    await navigator.clipboard.writeText(
      `${pin.title}\n\n${pin.description}\n\nAlt text: ${pin.altText}\n\nDesign: ${pin.designNote}`,
    );
    setCopied(index);
    setTimeout(() => setCopied(null), 1800);
  }

  return (
    <section className="card">
      <h2 className="card-title">Pinterest pins</h2>
      <p className="card-sub">
        Four angles, each targeting a different search. Pinterest ranks on title and description
        keywords — hashtags are worth about 1%.
      </p>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={() => void generate()} disabled={!ready || busy}>
          {busy ? "Writing pins…" : pins ? "Regenerate" : "Generate pin ideas"}
        </button>
      </div>

      {!ready && (
        <p className="hint" style={{ marginTop: 12 }}>
          Fill in the product first — pins are written from its facts.
        </p>
      )}

      {error && <div className="warn" role="alert"><strong>Couldn&rsquo;t generate.</strong> {error}</div>}

      {pins && (
        <div className="pins">
          {pins.map((pin, i) => {
            const titleLen = len(pin.title);
            const descLen = len(pin.description);
            return (
              <article className="pin" key={`${pin.angle}-${i}`}>
                <div className="pin-head">
                  <div>
                    <span className="pin-angle">{ANGLE_LABEL[pin.angle] ?? pin.angle}</span>
                    <span className="pin-intent">{ANGLE_INTENT[pin.angle]}</span>
                  </div>
                  <button className="link-btn" onClick={() => void copyPin(pin, i)}>
                    {copied === i ? "Copied" : "Copy"}
                  </button>
                </div>

                <h3 className="pin-title">{pin.title}</h3>
                <p className="pin-desc">{pin.description}</p>

                <div className="pin-meta">
                  <span className={titleLen > 60 ? "over" : ""}>title {titleLen}/60</span>
                  <span className={descLen < 150 || descLen > 300 ? "over" : ""}>
                    description {descLen}/150–300
                  </span>
                </div>

                <p className="pin-extra"><b>Alt</b> {pin.altText}</p>
                <p className="pin-extra"><b>Design</b> {pin.designNote}</p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
