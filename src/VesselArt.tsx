import type { Vessel } from "./types";

/** Stable per-id hue, ported from the site's ProductImage. */
export function hueFor(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 997;
  return (330 + (hash % 80)) % 360;
}

/** Packaging silhouettes — same paths as luxeskinfinds/src/components/ProductImage.tsx. */
export function VesselArt({ vessel }: { vessel: Vessel }) {
  const s = {
    fill: "none",
    stroke: "white",
    strokeWidth: 1.6,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };

  switch (vessel) {
    case "dropper":
      return (
        <g {...s}>
          <rect x="35" y="4" width="10" height="16" rx="3" />
          <path d="M36 20h8" />
          <rect x="34" y="20" width="12" height="7" rx="1.5" />
          <rect x="23" y="27" width="34" height="77" rx="7" />
          <path d="M23 46h34" strokeOpacity="0.5" />
        </g>
      );
    case "jar":
      return (
        <g {...s}>
          <rect x="15" y="28" width="50" height="15" rx="3.5" />
          <rect x="18" y="43" width="44" height="45" rx="7" />
          <path d="M18 62h44" strokeOpacity="0.5" />
        </g>
      );
    case "pump":
      return (
        <g {...s}>
          <path d="M38 6h-9a3 3 0 0 0-3 3v3" />
          <rect x="36" y="6" width="8" height="18" rx="2" />
          <rect x="30" y="24" width="20" height="6" rx="1.5" />
          <rect x="20" y="30" width="40" height="74" rx="8" />
          <path d="M20 50h40" strokeOpacity="0.5" />
        </g>
      );
    case "spray":
      return (
        <g {...s}>
          <path d="M27 12h-6" />
          <rect x="27" y="5" width="26" height="14" rx="2.5" />
          <rect x="34" y="19" width="12" height="5" rx="1" />
          <rect x="24" y="24" width="32" height="80" rx="6" />
          <path d="M24 44h32" strokeOpacity="0.5" />
        </g>
      );
    case "tube":
      return (
        <g {...s}>
          <rect x="33" y="4" width="14" height="11" rx="2.5" />
          <path d="M25 15h30v83a6 6 0 0 1-6 6H31a6 6 0 0 1-6-6z" />
          <path d="M25 96h30" strokeOpacity="0.5" />
        </g>
      );
    case "sachet":
      return (
        <g {...s}>
          <rect x="14" y="14" width="52" height="82" rx="3" />
          <path d="M14 26h52" strokeOpacity="0.6" />
          <path d="M20 21h6M32 21h6M44 21h6" strokeOpacity="0.4" />
          <circle cx="40" cy="60" r="15" strokeOpacity="0.45" />
        </g>
      );
    case "bottle":
    default:
      return (
        <g {...s}>
          <rect x="30" y="4" width="20" height="13" rx="2.5" />
          <rect x="34" y="17" width="12" height="8" rx="1" />
          <path d="M46 25a10 10 0 0 0 10 10v62a7 7 0 0 1-7 7H31a7 7 0 0 1-7-7V35a10 10 0 0 0 10-10z" />
          <path d="M25 52h30" strokeOpacity="0.5" />
        </g>
      );
  }
}

export function VesselTile({ id, vessel, brand }: { id: string; vessel: Vessel; brand: string }) {
  const h = hueFor(id || "placeholder");
  const h2 = (h + 16) % 360;
  return (
    <div
      className="vessel-slot"
      style={{
        backgroundColor: `hsl(${h} 32% 93%)`,
        backgroundImage: [
          `radial-gradient(at 25% 20%, hsl(${h} 46% 88%) 0px, transparent 60%)`,
          `radial-gradient(at 78% 82%, hsl(${h2} 42% 90%) 0px, transparent 55%)`,
        ].join(", "),
      }}
    >
      <svg viewBox="0 0 80 110" style={{ height: "68%", opacity: 0.5 }} aria-hidden="true">
        <VesselArt vessel={vessel} />
      </svg>
      {brand && <span className="vessel-brand">{brand}</span>}
    </div>
  );
}
