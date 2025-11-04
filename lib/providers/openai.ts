// lib/providers/openai.ts
import type { TakeoffResult, TakeoffItem, Unit } from "@/lib/types";

export async function openaiAnalyzePDF(pdfBytes: Uint8Array): Promise<TakeoffResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  // 1) Upload PDF to OpenAI Files API
  const form = new FormData();
  form.append("file", new Blob([pdfBytes], { type: "application/pdf" }), "plans.pdf");
  form.append("purpose", "assistants");

  const uploadRes = await fetch("https://api.openai.com/v1/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!uploadRes.ok) throw new Error(`OpenAI file upload failed: ${await uploadRes.text()}`);
  const file = (await uploadRes.json()) as { id: string };

  // 2) IMPROVED PROMPT - Much more detailed and structured
  const sys = `You are a professional construction estimator analyzing plan sets.

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no prose, no code fences
2. Extract quantities from dimension strings, schedules, and room tags
3. For areas: multiply length × width from dimensions
4. For linear items: sum all wall/perimeter lengths
5. Always cite the source sheet (e.g., "A-101", "S-3.1") in notes array
6. If unsure, estimate conservatively and lower confidence to 0.3-0.5

REQUIRED JSON STRUCTURE:
{
  "items": [
    {
      "category": "concrete" | "framing" | "roofing" | "siding" | "windows_doors" | "drywall" | "flooring" | "insulation" | "mechanical" | "plumbing" | "electrical" | "finishes" | "other",
      "description": "2x6 exterior wall @ 16\\" o.c.",
      "unit": "ea" | "lf" | "sf" | "sq" | "cy" | "cf" | "bf",
      "qty": 245.5,
      "notes": ["Sheet A-102", "Wall type W1"],
      "confidence": 0.85
    }
  ],
  "summary": "Brief extraction summary",
  "confidence": 0.78
}

EXAMPLES:
- Wall schedule shows "100 LF of 2x6 wall" → {"category":"framing", "description":"2x6 wall @ 16\\" o.c.", "unit":"lf", "qty":100, "notes":["Wall schedule"], "confidence":0.9}
- Room labeled "12'×15'" → {"category":"flooring", "description":"Room 101 floor area", "unit":"sf", "qty":180, "notes":["Floor plan"], "confidence":0.85}
- Door schedule: "10 EA 3070 doors" → {"category":"windows_doors", "description":"3070 hollow metal door", "unit":"ea", "qty":10, "notes":["Door schedule"], "confidence":0.95}

Extract ALL measurable quantities from:
- Foundation (concrete, rebar, formwork)
- Framing (studs, joists, headers by size)
- Exterior (siding, roofing by type)
- Windows/Doors (count by size/type)
- Interior (drywall, flooring, cabinets)
- MEP rough-in counts`;

  const body = {
    model: "gpt-4.1-mini",
    temperature: 0.2,
    input: [
      { role: "system", content: [{ type: "text", text: sys }] },
      {
        role: "user",
        content: [
          { 
            type: "input_text", 
            text: "Analyze this construction plan set and extract ALL measurable quantities. Focus on accuracy and cite your sources in the notes field." 
          },
          { type: "input_file", file_id: file.id },
        ],
      },
    ],
    response_format: { type: "json_object" },
  } as const;

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`OpenAI response failed: ${await res.text()}`);

  const data: any = await res.json();

  // Safely pull JSON text from the response variations
  const textJSON =
    data?.output?.[0]?.content?.find?.((c: any) => c.type === "output_text")?.text ??
    data?.output_text ??
    data?.content?.[0]?.text ??
    data;

  let parsed: any;
  try {
    parsed = typeof textJSON === "string" ? JSON.parse(textJSON) : textJSON;
  } catch {
    parsed = { summary: "Model returned non-JSON output.", items: [], confidence: 0.4 };
  }

  // IMPROVED: Better normalization of items
  const items: TakeoffItem[] = Array.isArray(parsed.items)
    ? parsed.items
        .map((i: any) => ({
          category: String(i?.category ?? "other").toLowerCase(),
          description: String(i?.description ?? "").trim(),
          unit: (i?.unit ?? "ea") as Unit,
          qty: Number(i?.qty ?? 0),
          notes: Array.isArray(i?.notes) 
            ? i.notes.map((n: any) => String(n)).slice(0, 5)
            : i?.notes 
            ? [String(i.notes)] 
            : undefined,
          confidence: Math.max(0, Math.min(1, Number(i?.confidence ?? 0.6))),
        }))
        .filter((item: TakeoffItem) => item.qty > 0 && item.description) // Remove empty items
    : [];

  const result: TakeoffResult = {
    source: "openai",
    items,
    summary: String(parsed?.summary ?? "No summary provided."),
    confidence: Math.max(0, Math.min(1, Number(parsed?.confidence ?? 0.6))),
  };

  return result;
}



