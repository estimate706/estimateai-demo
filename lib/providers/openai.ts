// lib/providers/openai.ts
import type { TakeoffResult, TakeoffItem } from "@/lib/types";

// Text limiter so we don't overflow model context
const MAX_CHARS = 120_000;

async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<string> {
  // dynamic import is safer in Next.js server envs
  const { default: pdfParse } = await import("pdf-parse");
  const buf = Buffer.from(pdfBytes);
  const data = await pdfParse(buf);
  // Collapse extra whitespace and trim to model-safe length
  return (data.text || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, MAX_CHARS);
}

function buildSystemPrompt() {
  return (
    `You are a senior residential construction estimator. ` +
    `From the user's text (extracted from a PDF plan set), extract a clean, first-pass takeoff.\n\n` +
    `Return ONLY valid JSON (no markdown, no commentary) in this exact shape:\n` +
    `{\n` +
    `  "items": [\n` +
    `    {\n` +
    `      "category": "concrete" | "framing" | "roofing" | "siding" | "windows_doors" | "drywall" | "flooring" | "insulation" | "mechanical" | "plumbing" | "electrical" | "finishes" | "other",\n` +
    `      "description": "clear item description",\n` +
    `      "unit": "ea" | "lf" | "sf" | "sq" | "cy" | "cf" | "bf",\n` +
    `      "qty": number,\n` +
    `      "notes": ["sheet or detail reference"],\n` +
    `      "confidence": number  // 0..1\n` +
    `    }\n` +
    `  ],\n` +
    `  "summary": "one-paragraph summary of major quantities & assumptions",\n` +
    `  "confidence": number // 0..1 overall\n` +
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
  // try fast parse first
  try {
    return JSON.parse(t);
  } catch {}
  // last resort: find first {...} block
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const candidate = t.slice(start, end + 1);
    return JSON.parse(candidate);
  }
  throw new Error("Could not parse JSON from model response.");
}

export async function openaiAnalyzePDF(pdfBytes: Uint8Array): Promise<TakeoffResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      source: "openai",
      summary: "OpenAI not configured; returning placeholder output.",
      confidence: 0,
      items: [],
    };
  }

  try {
    const text = await extractTextFromPDF(pdfBytes);
    if (!text) throw new Error("No extractable text found in PDF.");

    const system = buildSystemPrompt();

    // Use a cost-friendly reasoning model; you can bump to gpt-4.1 if desired.
    const model = "gpt-4.1-mini";

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content:
              "Extract quantities from this plan text. If dimensions appear, convert to quantities where reasonable.\n\n" +
              text,
          },
        ],
      }),
    });

    if (!resp.ok) {
      const e = await resp.text();
      throw new Error(`OpenAI API failed: ${e}`);
    }

    const data = await resp.json();
    const rawText = data?.choices?.[0]?.message?.content ?? "";
    const parsed = extractJSON(rawText);

    return {
      source: "openai",
      items: coerceItems(parsed?.items),
      summary: String(parsed?.summary ?? "Extraction complete."),
      confidence: Math.max(0, Math.min(1, Number(parsed?.confidence ?? 0.6))),
    };
  } catch (err: any) {
    return {
      source: "openai",
      summary: `OpenAI error: ${err?.message || String(err)}`,
      confidence: 0,
      items: [],
    };
  }
}




