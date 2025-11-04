// lib/providers/anthropic.ts
import type { TakeoffResult } from "@/lib/types";

export async function anthropicAnalyzePDF(_pdfBytes: Uint8Array): Promise<TakeoffResult> {
  // Claude disabled - using OpenAI only
  console.log("[Anthropic] Skipped (disabled)");
  
  return {
    source: "anthropic",
    summary: "Claude disabled - OpenAI handling analysis.",
    confidence: 0,
    items: [],
  };
}




