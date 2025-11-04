// lib/providers/openai.ts
import type { TakeoffResult, TakeoffItem, Unit } from "@/lib/types";

export async function openaiAnalyzePDF(pdfBytes: Uint8Array): Promise<TakeoffResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const base64Pdf = Buffer.from(pdfBytes).toString("base64");

  const sys = `You are a professional construction estimator analyzing plan sets.

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no prose, no code fences
2. Extract quantities from dimension strings, schedules, and room tags
3. Always cite the source sheet in notes array
4. If unsure, estimate conservatively and lower confidence to 0.3-0.5

REQUIRED JSON STRUCTURE:
{
  "items": [
    {
      "category": "concrete" | "framing" | "roofing" | "siding" | "windows_doors" | "drywall" | "flooring" | "insulation" | "mechanical" | "plumbing" | "electrical" | "finishes" | "other",
      "description": "2x6 exterior wall @ 16\\" o.c.",
      "unit": "ea" | "lf" | "sf" | "sq" | "cy" | "cf" | "bf",
      "qty": 245.5,
      "notes": ["Sheet A-102"],
      "confidence": 0.85
    }
  ],
  "summary": "Brief extraction summary",
  "confidence": 0.78
}`;

  const body = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: sys },
      {
        role: "user",
        content: [
          { 
            type: "text", 
            text: "Analyze this construction plan set and extract ALL measurable quantities." 
          },
          { 
            type: "image_url", 
            image_url: { 
              url: `data:application/pdf;base64,${base64Pdf}`,
              detail: "high"
            } 
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API failed: ${errorText}`);
  }

  const data: any = await res.json();
  const textJSON = data?.choices?.[0]?.message?.content ?? "{}";

  let parsed: any;
  try {
    parsed = typeof textJSON === "string" ? JSON.parse(textJSON) : textJSON;
  } catch {
    parsed = { summary: "Model returned non-JSON output.", items: [], confidence: 0.4 };
  }

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
        .filter((item: TakeoffItem) => item.qty > 0 && item.description)
    : [];

  return {
    source: "openai",
    items,
    summary: String(parsed?.summary ?? "No summary provided."),
    confidence: Math.max(0, Math.min(1, Number(parsed?.confidence ?? 0.6))),
  };
}



