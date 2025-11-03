// lib/ai-service.ts
// Minimal OpenAI-only service for PDF analysis (deploy-safe)

type TakeoffResult = {
  summary: string;
  items: Array<{
    category: string;        // e.g., "Framing Lumber"
    description: string;     // e.g., "2x4 SPF #2"
    quantity: string;        // keep as string for units, e.g., "120 lf", "42 pcs"
    unit_cost?: string;      // optional, if model infers
    notes?: string;
  }>;
};

function toJsonSafe(text: string): TakeoffResult {
  try {
    return JSON.parse(text);
  } catch {
    // Fallback shape if model returns plain text
    return {
      summary: text.slice(0, 600),
      items: [],
    };
  }
}

export async function analyzePdfWithOpenAI(pdfBase64: string): Promise<TakeoffResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  // We’ll send the PDF as base64 and ask the model to reason over it.
  // (For production, consider the Files API + server-side page image conversion for best vision results.)
  const systemPrompt = `
You are an estimating assistant for residential construction.
You will receive a construction plan PDF encoded as base64.
Extract a *first-pass* material + labor takeoff and return JSON with this shape:

{
  "summary": "1-3 sentence overview of scope (levels, footprint, key notes).",
  "items": [
    {
      "category": "Framing Lumber | Foundation | Roofing | Windows | Doors | Siding | Drywall | Flooring | Electrical | Plumbing | HVAC | Sitework | Other",
      "description": "what & where (sizes/specs if visible)",
      "quantity": "number with units when possible (e.g., '120 lf', '42 pcs', '380 sf')",
      "unit_cost": "optional if confident; otherwise omit",
      "notes": "assumptions or sheet refs, optional"
    }
  ]
}

Only include fields shown above. If pages are unclear, state assumptions in 'notes'.
`;

  const userInstruction = `
Here is a construction drawing PDF as base64 below. If any sheet titles, schedules, or details are visible,
use them to infer quantities. If dimensions are missing, note assumptions in 'notes'. Produce concise, practical items.
`;

  // OpenAI Responses API (JSON-ish request; we’ll parse the text reply)
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      input: [
        {
          role: "system",
          content: [{ type: "text", text: systemPrompt }],
        },
        {
          role: "user",
          content: [
            { type: "text", text: userInstruction },
            // NOTE: Using generic input_text here; for best results later we’ll switch
            // to the Files API or page-image conversion for model vision.
            { type: "input_text", text: pdfBase64 },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI error: ${errText}`);
  }

  const data = await res.json();

  // The Responses API returns content in data.output[0].content[0].text (commonly).
  const text =
    data?.output?.[0]?.content?.[0]?.text ??
    data?.content?.[0]?.text ??
    data?.output_text ??
    JSON.stringify(data);

  return toJsonSafe(text);
}
