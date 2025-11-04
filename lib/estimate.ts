// lib/estimate.ts
import type { MergedEstimate, TakeoffResult, TakeoffItem } from "@/lib/types";
import { openaiAnalyzePDF } from "@/lib/providers/openai";
import { anthropicAnalyzePDF } from "@/lib/providers/anthropic";

export async function runDualModelTakeoff(pdfBytes: Uint8Array): Promise<MergedEstimate> {
  // Run both in parallel
  const [oai, claude] = await Promise.allSettled([
    openaiAnalyzePDF(pdfBytes),
    anthropicAnalyzePDF(pdfBytes),
  ]);

  const oaiRes = oai.status === "fulfilled" ? oai.value : undefined;
  const claudeRes = claude.status === "fulfilled" ? claude.value : undefined;

  if (!oaiRes && !claudeRes) {
    return {
      items: [],
      summary: "Both models failed to analyze the PDF.",
      confidence: 0,
      sources: { openai: undefined, anthropic: undefined },
    };
  }

  // If only one model succeeded, return its results
  if (!oaiRes) {
    return {
      items: claudeRes!.items,
      summary: `Claude only: ${claudeRes!.summary}`,
      confidence: claudeRes!.confidence * 0.85,
      sources: { openai: undefined, anthropic: claudeRes },
    };
  }

  if (!claudeRes) {
    return {
      items: oaiRes.items,
      summary: `OpenAI only: ${oaiRes.summary}`,
      confidence: oaiRes.confidence * 0.85,
      sources: { openai: oaiRes, anthropic: undefined },
    };
  }

  // Simple fusion - just combine both results
  const allItems = [...oaiRes.items, ...claudeRes.items];

  // Remove exact duplicates
  const uniqueItems = allItems.filter((item, index, self) =>
    index === self.findIndex((t) => (
      t.category === item.category &&
      t.description === item.description &&
      t.unit === item.unit &&
      Math.abs(t.qty - item.qty) < 0.01
    ))
  );

  const avgConfidence = (oaiRes.confidence + claudeRes.confidence) / 2;

  return {
    items: uniqueItems,
    summary: `OpenAI: ${oaiRes.summary}\n\nClaude: ${claudeRes.summary}`,
    confidence: avgConfidence,
    sources: { openai: oaiRes, anthropic: claudeRes },
  };
}
