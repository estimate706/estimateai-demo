// lib/providers/anthropic.ts
import type { TakeoffResult, TakeoffItem } from "@/lib/types";

const WORKING_MODEL = "claude-3-5-sonnet-20240620";

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

export async function anthropicAnalyzePDF(pdfBytes: Uint8Array): Promise<TakeoffResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.log("[Anthropic] No API key - skipping");
    return {
      source: "anthropic",
      summary: "Claude not configured.",
      confidence: 0,
      items: [],
    };
  }

  try {
    // Convert PDF to base64 image (first page only for now)
    const base64Pdf = Buffer.from(pdfBytes).toString("base64");

    const systemPrompt = `You are an expert construction estimator. Extract measurable quantities from construction plans.

Return ONLY valid JSON (no markdown):
{
  "items": [
    {
      "category": "concrete" | "framing" | "roofing" | "siding" | "windows_doors" | "drywall" | "flooring" | "insulation" | "mechanical" | "plumbing" | "electrical" | "finishes" | "other",
      "description": "clear description",
      "unit": "ea" | "lf" | "sf" | "sq" | "cy" | "cf" | "bf",
      "qty": <number>,
      "notes": ["sheet ref"],
      "confidence": <0-1>
    }
  ],
  "summary": "brief summary",
  "confidence": <0-1>
}`;

    console.log(`[Anthropic] Using model: ${WORKING_MODEL} with IMAGE`);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: WORKING_MODEL,
        max_tokens: 4096,
        temperature: 0.2,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/png",
                  data: base64Pdf,
                },
              },
              {
                type: "text",
                text: "Analyze this construction plan and extract ALL measurable quantities.",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Anthropic] API Error:", errorText);
      throw new Error(`Claude API failed (${response.status})`);
    }

    const data: any = await response.json();
    const textContent = data?.content?.find((c: any) => c.type === "text");
    
    if (!textContent) {
      throw new Error("No text in Claude response");
    }

    let jsonText = String(textContent.text ?? "").trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
    }

    const parsed = JSON.parse(jsonText);
    const items = normalizeItems(parsed);

    console.log(`[Anthropic] Extracted ${items.length} items`);

    return {
      source: "anthropic",
      items,
      summary: String(parsed?.summary ?? "Extraction complete."),
      confidence: Math.max(0, Math.min(1, Number(parsed?.confidence ?? 0.6))),
    };

  } catch (error) {
    console.error("[Anthropic] Error:", error);
    return {
      source: "anthropic",
      items: [],
      summary: `Claude unavailable: ${error instanceof Error ? error.message : "Unknown"}`,
      confidence: 0,
    };
  }
}




