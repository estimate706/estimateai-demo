// lib/providers/anthropic.ts
import type { TakeoffResult, TakeoffItem } from "@/lib/types";

const PRIMARY_MODEL = "claude-3-5-sonnet-latest";
const FALLBACK_MODEL = "claude-3-sonnet-20240229";

// Helper: normalize items coming back from model JSON
function normalizeItems(parsed: any): TakeoffItem[] {
  return Array.isArray(parsed?.items)
    ? parsed.items
        .map((i: any) => ({
          category: String(i?.category ?? "other").toLowerCase(),
          description: String(i?.description ?? "").trim(),
          unit: String(i?.unit ?? "ea").toLowerCase(),
          qty: Number(i?.qty ?? 0),
          notes: Array.isArray(i?.notes)
            ? i.notes.map((n: any) => String(n)).slice(0, 5)
            : i?.notes
            ? [String(i.notes)]
            : undefined,
          confidence: Math.max(0, Math.min(1, Number(i?.confidence ?? 0.6))),
        }))
        .filter((item: TakeoffItem) => item.qty > 0 && item.description)
    : [];
}

async function callClaude({
  apiKey,
  model,
  base64Pdf,
}: {
  apiKey: string;
  model: string;
  base64Pdf: string;
}): Promise<TakeoffResult> {
  // System prompt
  const systemPrompt = `You are an expert construction estimator. Extract measurable quantities from residential plan sets with precision.

Return ONLY this JSON (no markdown code fences):
{
  "items": [
    {
      "category": "concrete" | "framing" | "roofing" | "siding" | "windows_doors" | "drywall" | "flooring" | "insulation" | "mechanical" | "plumbing" | "electrical" | "finishes" | "other",
      "description": "clear item description",
      "unit": "ea" | "lf" | "sf" | "sq" | "cy" | "cf" | "bf",
      "qty": <number>,
      "notes": ["sheet reference"],
      "confidence": <0-1>
    }
  ],
  "summary": "short extraction summary",
  "confidence": <0-1>
}`;

  /**
   * NOTE on Anthropic PDF support:
   * Some accounts don’t yet have “document” attachments enabled.
   * If that’s the case, Anthropic may 1) reject the model, or 2) accept model but reject the document.
   * We still try, but handle errors cleanly so OpenAI can provide results.
   */
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            // Attempt a PDF document attachment. If the account lacks this feature,
            // the try/catch above will capture the error and we’ll fall back/skip.
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Pdf,
              },
            },
            {
              type: "text",
              text: "Analyze this plan set and extract ALL measurable quantities.",
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    const err: any = (() => {
      try {
        return JSON.parse(text);
      } catch {
        return { error: { type: "unknown_error", message: text } };
      }
    })();

    // Propagate a structured error so caller knows if it’s a model-not-found case
    const msg = err?.error?.message || text;
    const type = err?.error?.type || "unknown_error";
    const requestId = err?.request_id;
    const composed = `Claude API failed: ${JSON.stringify({ type, message: msg, request_id: requestId })}`;
    const e = new Error(composed) as any;
    e._anthropicType = type;
    throw e;
  }

  const data: any = await res.json();
  const textContent = data?.content?.find((c: any) => c.type === "text");
  if (!textContent) {
    throw new Error("Claude response had no text content");
  }

  // Strip any accidental backticks
  let jsonText = String(textContent.text ?? "").trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
  }

  const parsed = JSON.parse(jsonText);
  const items = normalizeItems(parsed);

  return {
    source: "anthropic",
    items,
    summary: String(parsed?.summary ?? "Extraction complete."),
    confidence: Math.max(0, Math.min(1, Number(parsed?.confidence ?? 0.6))),
  };
}

export async function anthropicAnalyzePDF(pdfBytes: Uint8Array): Promise<TakeoffResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      source: "anthropic",
      summary: "Claude not configured.",
      confidence: 0,
      items: [],
    };
  }

  const base64Pdf = Buffer.from(pdfBytes).toString("base64");

  // 1) Try the primary alias
  try {
    return await callClaude({ apiKey, model: PRIMARY_MODEL, base64Pdf });
  } catch (err: any) {
    // If the model alias isn’t available on this account, Anthropic returns not_found_error.
    if (err?._anthropicType === "not_found_error") {
      // 2) Retry with a broadly-available model
      try {
        return await callClaude({ apiKey, model: FALLBACK_MODEL, base64Pdf });
      } catch (err2: any) {
        // Give a clean “Claude unavailable” response so OpenAI can still drive the result
        return {
          source: "anthropic",
          items: [],
          summary:
            `Claude unavailable for your account (fallback also failed): ` +
            (err2?.message || "Unknown error"),
          confidence: 0,
        };
      }
    }

    // Other errors: degrade gracefully
    return {
      source: "anthropic",
      items: [],
      summary: `Claude error: ${err?.message || "Unknown error"}`,
      confidence: 0,
    };
  }
}





