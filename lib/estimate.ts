// lib/estimate.ts
import type { MergedEstimate } from "@/lib/types";
import { openaiAnalyzePDF } from "@/lib/providers/openai";

export async function runDualModelTakeoff(pdfBytes: Uint8Array): Promise<MergedEstimate> {
  try {
    const oai = await openaiAnalyzePDF(pdfBytes);

    return {
      items: oai.items,
      summary: oai.summary,         // no Claude messaging
      confidence: oai.confidence,
      sources: { openai: oai, anthropic: undefined }, // explicit: Claude disabled
    };
  } catch (err: any) {
    return {
      items: [],
      summary: `OpenAI analysis failed: ${err?.message ?? "Unknown error"}`,
      confidence: 0,
      sources: { openai: undefined, anthropic: undefined },
    };
  }
}


