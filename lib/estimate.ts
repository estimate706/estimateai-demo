// lib/estimate.ts
import type { MergedEstimate, TakeoffResult } from "@/lib/types";
import { openaiAnalyzePDF } from "@/lib/providers/openai";
import { anthropicAnalyzePDF } from "@/lib/providers/anthropic";

export async function runDualModelTakeoff(pdfBytes: Uint8Array): Promise<MergedEstimate> {
  console.log("[Estimate] Starting analysis...");
  
  // Run both (but Claude will return empty immediately)
  const [oai, claude] = await Promise.allSettled([
    openaiAnalyzePDF(pdfBytes),
    anthropicAnalyzePDF(pdfBytes),
  ]);

  const oaiRes = oai.status === "fulfilled" ? oai.value : undefined;
  const claudeRes = claude.status === "fulfilled" ? claude.value : undefined;

  // If OpenAI failed, we have nothing
  if (!oaiRes || oaiRes.items.length === 0) {
    return {
      items: [],
      summary: "Analysis failed - no results from OpenAI.",
      confidence: 0,
      sources: { openai: oaiRes, anthropic: claudeRes },
    };
  }

  // Use OpenAI results
  console.log(`[Estimate] OpenAI returned ${oaiRes.items.length} items`);

  return {
    items: oaiRes.items,
    summary: oaiRes.summary,
    confidence: oaiRes.confidence,
    sources: { openai: oaiRes, anthropic: claudeRes },
  };
}
