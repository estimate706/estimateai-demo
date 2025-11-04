// lib/providers/anthropic.ts
import type { TakeoffResult, TakeoffItem } from "@/lib/types";

export async function anthropicAnalyzePDF(pdfBytes: Uint8Array): Promise<TakeoffResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      source: "anthropic",
      summary: "Claude not configured; returning placeholder output.",
      confidence: 0,
      items: [],
    };
  }

  try {
    const base64Pdf = Buffer.from(pdfBytes).toString("base64");

    const systemPrompt = `You are an expert construction estimator. Extract quantities from plan sets with precision.

Return ONLY this JSON structure (no markdown):
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
  "summary": "extraction summary",
  "confidence": <0-1>
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",  // FIXED MODEL NAME
        max_tokens: 4096,
        temperature: 0.2,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API failed: ${errorText}`);
    }

    const data: any = await response.json();
    const textContent = data?.content?.find((c: any) => c.type === "text");
    
    if (!textContent) {
      throw new Error("No text content in Claude response");
    }

    let jsonText = textContent.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
    }

    const parsed = JSON.parse(jsonText);

    const items: TakeoffItem[] = Array.isArray(parsed.items)
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

    return {
      source: "anthropic",
      items,
      summary: String(parsed?.summary ?? "Extraction complete."),
      confidence: Math.max(0, Math.min(1, Number(parsed?.confidence ?? 0.6))),
    };
  } catch (error) {
    console.error("Claude analysis error:", error);
    return {
      source: "anthropic",
      summary: `Claude error: ${error instanceof Error ? error.message : "Unknown error"}`,
      confidence: 0,
      items: [],
    };
  }
}


