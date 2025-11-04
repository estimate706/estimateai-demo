// lib/estimate.ts
import type { MergedEstimate } from "@/lib/types";
import { openaiAnalyzePDF } from "@/lib/providers/openai";

export async function runDualModelTakeoff(pdfBytes: Uint8Array): Promise<MergedEstimate> {
  console.log("[Estimate] Using OpenAI only");
  
  // ONLY call OpenAI - no Claude at all
  const oaiRes = await openaiAnalyzePDF(pdfBytes);

  if (!oaiRes || oaiRes.items.length === 0) {
    return {
      items: [],
      summary: "OpenAI returned no results.",
      confidence: 0,
      sources: { openai: oaiRes, anthropic: undefined },
    };
  }

  return {
    items: oaiRes.items,
    summary: oaiRes.summary,
    confidence: oaiRes.confidence,
    sources: { openai: oaiRes, anthropic: undefined },
  };
}
