import type { Connect, Plugin } from "vite";
import type { ServerResponse } from "node:http";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { EXTRACTION_SYSTEM, PINS_SYSTEM } from "./prompts.js";

/**
 * Dev-server middleware exposing two endpoints to the panel UI.
 *
 * The Anthropic SDK runs here, in Node — the API key is read from .env and
 * never reaches the browser bundle. The UI calls same-origin /api/* routes,
 * so there's no CORS handling and no key in client code.
 */

const MODEL = "claude-sonnet-4-6";

const ExtractionSchema = z.object({
  brand: z.string(),
  name: z.string(),
  texture: z.string(),
  scent: z.string(),
  claims: z.array(z.string()),
  ingredients: z.array(z.string()),
  sizeOrNet: z.string(),
  legibilityNotes: z.string(),
});

const PinSchema = z.object({
  angle: z.enum(["problem-led", "comparison", "routine", "ingredient-led"]),
  title: z.string(),
  description: z.string(),
  altText: z.string(),
  designNote: z.string(),
});

const PinsSchema = z.object({ pins: z.array(PinSchema) });

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    // Packaging photos are sent as base64, so the default body cap is too low.
    const LIMIT = 12 * 1024 * 1024;
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > LIMIT) reject(new Error("Image too large — keep it under 8MB."));
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

/** Surfaces the actionable part of an SDK error rather than a raw stack. */
function explain(error: unknown): { status: number; message: string } {
  if (error instanceof Anthropic.AuthenticationError) {
    return { status: 401, message: "The API key was rejected. Check ANTHROPIC_API_KEY in .env." };
  }
  if (error instanceof Anthropic.RateLimitError) {
    return { status: 429, message: "Rate limited by the API. Wait a moment and try again." };
  }
  if (error instanceof Anthropic.BadRequestError) {
    return { status: 400, message: `The API rejected the request: ${error.message}` };
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return { status: 503, message: "Couldn't reach the API. Check your connection." };
  }
  if (error instanceof Anthropic.APIError) {
    return { status: error.status ?? 500, message: error.message };
  }
  return { status: 500, message: error instanceof Error ? error.message : "Unknown error." };
}

export function anthropicPlugin(): Plugin {
  return {
    name: "luxeskinfinds-panel-anthropic",
    configureServer(server) {
      server.middlewares.use("/api", async (req, res, next) => {
        if (req.method !== "POST") return next();

        const route = (req.url ?? "").split("?")[0];
        if (route !== "/extract" && route !== "/pins") return next();

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          return json(res, 500, {
            error:
              "No ANTHROPIC_API_KEY found. Copy .env.example to .env, add your key, and restart the dev server.",
          });
        }

        const client = new Anthropic({ apiKey });

        try {
          const payload = JSON.parse(await readBody(req));

          if (route === "/extract") {
            const { imageBase64, mediaType, listingText } = payload as {
              imageBase64?: string;
              mediaType?: string;
              listingText?: string;
            };

            if (!imageBase64 && !listingText?.trim()) {
              return json(res, 400, { error: "Provide a photo, listing text, or both." });
            }

            const content: Anthropic.ContentBlockParam[] = [];
            if (imageBase64 && mediaType) {
              content.push({
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                  data: imageBase64,
                },
              });
            }
            content.push({
              type: "text",
              text: listingText?.trim()
                ? `Read the packaging in the image, if one is supplied.\n\nListing text supplied by the user (treat as authoritative alongside the image):\n"""\n${listingText.trim()}\n"""`
                : "Read the packaging in the image. No listing text was supplied, so the image is your only source.",
            });

            const response = await client.messages.parse({
              model: MODEL,
              max_tokens: 16000,
              system: EXTRACTION_SYSTEM,
              thinking: { type: "adaptive" },
              messages: [{ role: "user", content }],
              output_config: { format: zodOutputFormat(ExtractionSchema) },
            });

            if (!response.parsed_output) {
              return json(res, 502, { error: "The model returned an unreadable response. Try again." });
            }
            return json(res, 200, response.parsed_output);
          }

          // ---- /pins ----
          const { product } = payload as { product: unknown };
          if (!product) return json(res, 400, { error: "No product supplied." });

          const response = await client.messages.parse({
            model: MODEL,
            max_tokens: 16000,
            system: PINS_SYSTEM,
            thinking: { type: "adaptive" },
            messages: [
              {
                role: "user",
                content: `Write four pin ideas for this product. Use only these facts.\n\n${JSON.stringify(product, null, 2)}`,
              },
            ],
            output_config: { format: zodOutputFormat(PinsSchema) },
          });

          if (!response.parsed_output) {
            return json(res, 502, { error: "The model returned an unreadable response. Try again." });
          }
          return json(res, 200, response.parsed_output);
        } catch (error) {
          const { status, message } = explain(error);
          return json(res, status, { error: message });
        }
      });
    },
  };
}
