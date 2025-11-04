// lib/providers/anthropic.ts
import type { TakeoffResult } from "@/lib/types";

export async function anthropicAnalyzePDF(_pdfBytes: Uint8Array): Promise<TakeoffResult> {
  // COMPLETELY DISABLED - NOT USED AT ALL
  return {
    source: "anthropic",
    summary: "",
    confidence: 0,
    items: [],
  };
}




