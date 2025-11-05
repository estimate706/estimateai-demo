// lib/estimate.ts
import type { MergedEstimate } from "@/lib/types";
import { openaiAnalyzePDF } from "@/lib/providers/openai";

export async function runDualModelTakeoff(pdfBytes: Uint8Array): Promise<MergedEstimate> {
  console.log("[Estimate] Starting OpenAI-only analysis...");
  
  try {
    const result = await openaiAnalyzePDF(pdfBytes);
    
    if (!result || result.items.length === 0) {
      return {
        items: [],
        summary: "No items extracted from PDF. Please check if the PDF contains readable text.",
        confidence: 0,
        sources: { openai: result, anthropic: undefined },
      };
    }

    console.log(`[Estimate] Successfully extracted ${result.items.length} items`);

    return {
      items: result.items,
      summary: result.summary,
      confidence: result.confidence,
      sources: { openai: result, anthropic: undefined },
    };
  } catch (error) {
    console.error("[Estimate] Fatal error:", error);
    return {
      items: [],
      summary: `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      confidence: 0,
      sources: { openai: undefined, anthropic: undefined },
    };
  }
}


