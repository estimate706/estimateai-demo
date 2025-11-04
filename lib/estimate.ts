// lib/estimate.ts
import type { MergedEstimate, TakeoffResult } from "@/lib/types";
import { openaiAnalyzePDF } from "@/lib/providers/openai";
import { anthropicAnalyzePDF } from "@/lib/providers/anthropic";

export async function runDualModelTakeoff(pdfBytes: Uint8Array): Promise<MergedEstimate> {
  // Run both in parallel
  const [oai, claude] = await Promise.allSettled([
    openaiAnalyzePDF(pdfBytes),
    anthropicAnalyzePDF(pdfBytes),
  ]);

  const oaiRes = (oai.status === "fulfilled" ? oai.value : undefined) as TakeoffResult | undefined;
  const claudeRes = (claude.status === "fulfilled" ? claude.value : undefined) as
    | TakeoffResult
    | undefined;

  // Pick primary items from the model that returned more (or default OpenAI)
  const primary =
    (oaiRes && claudeRes
      ? oaiRes.items.length >= claudeRes.items.length
        ? oaiRes
        : claudeRes
      : oaiRes || claudeRes) ?? {
      source: "openai" as const,
      items: [],
      summary: "No model response.",
      confidence: 0,
    };

  const summaryParts = [
    oaiRes ? `OpenAI: ${oaiRes.summary}` : "OpenAI: unavailable",
    claudeRes ? `Claude: ${claudeRes.summary}` : "Claude: unavailable",
  ];

  const confidence = Math.max(oaiRes?.confidence ?? 0, claudeRes?.confidence ?? 0);

  return {
    items: primary.items,
    summary: summaryParts.join("\n\n"),
    confidence,
    sources: { openai: oaiRes, anthropic: claudeRes },
  };
}
