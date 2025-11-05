// lib/providers/anthropic.ts
import type { TakeoffResult, TakeoffItem } from "@/lib/types";

const MAX_CHARS = 120_000;

async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<string> {
  const { default: pdfParse } = await import("pdf-parse");
  const buf = Buffer.from(pdfBytes);
  const data = await pdfParse(buf);
  return (data.text || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, MAX_CHARS);
}

function buildSystemPrompt() {
  return (
    `You are a meticulous residential estimator. ` +
    `Cross-check text for material names, dimensions, schedules, and notes. ` +
    `Infer reasonable quantities when unit strings appear (LF, SF, SQ, CY, etc.). ` +
    `Return ONLY valid JSON (no markdown) with this shape:\n` +
    `{\n` +
    `  "items": [\n` +
    `    {\n` +
    `      "category": "concrete" | "framing" | "roofing" | "siding" | "windows_doors" | "drywall" | "flooring" | "insulation" | "mechanical" | "plumbing" | "electrical" | "finishes" | "other",\n` +
    `      "description": "clear item description",\n` +
    `      "unit": "ea" | "lf" | "sf" | "sq" | "cy" | "cf" | "bf",\n` +
    `      "qty": number,\n` +
    `      "notes": ["sheet or detail reference"],\n` +
    `      "confidence": number\n` +
    `    }\n` +
    `  ],\n` +
    `  "summary": "concise summary",\n` +
    `  "confidence": number\n` +
    `}\n`
  );
}

function coerceItems(raw: any): TakeoffItem[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw
    .map((i) => ({
      category: String(i?.category ?? "other").toLowerCase(),
      description: String(i?.description ?? "").trim(),
      unit: String(i?.unit ?? "ea").toLowerCase(),
      qty: Number(i?.qty ?? 0),
      notes: Array.isArray(i?.notes)
        ? i.notes.slice(0, 6).map((n: any) => String(n))
        : i?.notes
        ? [String(i.notes)]
        : undefined,
      confidence: Math.max(0, Math.min(1, Number(i?.confidence ?? 0.6))),
    }))
    .filter((i) => i.description && i.qty > 0);
}

function extractJSON(text: string): any {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  try {
    return JSON.parse(t);
  } catch {}
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(t.slice(start, end + 1));
  }
  throw new Error("Could not parse JSON from Claude response.");
}

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
    const text = await extractTextFromPDF(pdfBytes);
    if (!text) throw new Error("No extractable text found in PDF.");

    const system = buildSystemPrompt();
    const model = "claude-3-5-sonnet-latest";

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 4000,
        system,
        messages: [
          {
            role: "user",
            content:
              "Analyze this plan text (extracted from a PDF) and return the JSON takeoff only:\n\n" +
              text,
          },
        ],
      }),
    });

    if (!resp.ok) {
      const e = await resp.text();
      throw new Error(`Claude API failed: ${e}`);
    }

    const data = await resp.json();
    const textPart = (data?.content || []).find((c: any) => c?.type === "text")?.text ?? "";
    const parsed = extractJSON(textPart);

    return {
      source: "anthropic",
      items: coerceItems(parsed?.items),
      summary: String(parsed?.summary ?? "Extraction complete."),
      confidence: Math.max(0, Math.min(1, Number(parsed?.confidence ?? 0.6))),
    };
  } catch (err: any) {
    return {
      source: "anthropic",
      summary: `Claude error: ${err?.message || String(err)}`,
      confidence: 0,
      items: [],
    };
  }
}





