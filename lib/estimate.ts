// lib/estimate.ts
import type { MergedEstimate } from "@/lib/types";
import { openaiAnalyzePDF } from "@/lib/providers/openai";

export async function runDualModelTakeoff(pdfBytes: Uint8Array): Promise<MergedEstimate> {
  // Single-model path for demo: OpenAI only
  const oai = await openaiAnalyzePDF(pdfBytes);

  return {
    items: oai.items,
    summary: `OpenAI: ${oai.summary}`,
    confidence: oai.confidence,
    sources: { openai: oai, anthropic: undefined },
  };
}

