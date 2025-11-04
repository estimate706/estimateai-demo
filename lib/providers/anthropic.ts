// lib/providers/anthropic.ts
import type { TakeoffResult } from "@/lib/types";

/**
 * Deploy-safe placeholder for the demo.
 * We'll wire real Claude PDF parsing next; this just keeps types happy and the app green.
 */
export async function anthropicAnalyzePDF(_pdfBytes: Uint8Array): Promise<TakeoffResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      source: "anthropic",
      summary: "Claude not configured; returning placeholder output.",
      confidence: 0,
      items: [],
    };
  }

  // Temporary “agreeing” placeholder.
  return {
    source: "anthropic",
    summary:
      "Claude placeholder: agrees with OpenAI’s takeoff for demo purposes. (Full Claude PDF flow coming next.)",
    confidence: 0.55,
    items: [],
  };
}


