/** Client-side helpers for the panel's two AI endpoints. */

export type Extraction = {
  brand: string;
  name: string;
  texture: string;
  scent: string;
  claims: string[];
  ingredients: string[];
  sizeOrNet: string;
  legibilityNotes: string;
};

export type PinAngle = "problem-led" | "comparison" | "routine" | "ingredient-led";

export type Pin = {
  angle: PinAngle;
  title: string;
  description: string;
  altText: string;
  designNote: string;
};

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ error: "Server returned an unreadable response." }));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status}).`);
  return data as T;
}

/** Strips the `data:image/jpeg;base64,` prefix the API doesn't want. */
export function readFileAsBase64(file: File): Promise<{ base64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve({ base64: dataUrl.split(",")[1] ?? "", dataUrl });
    };
    reader.readAsDataURL(file);
  });
}

export function extractFromPack(input: {
  imageBase64?: string;
  mediaType?: string;
  listingText?: string;
}): Promise<Extraction> {
  return post<Extraction>("/api/extract", input);
}

export function generatePins(product: unknown): Promise<{ pins: Pin[] }> {
  return post<{ pins: Pin[] }>("/api/pins", { product });
}
