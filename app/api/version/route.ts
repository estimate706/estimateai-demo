import { NextResponse } from "next/server";
import { CLAUDE_MODEL, OPENAI_MODEL } from "@/lib/config"; // ✅ Correct import path

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    deployedAt: new Date().toISOString(),
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown",
    models: {
      anthropic: CLAUDE_MODEL,
      openai: OPENAI_MODEL,
    },
    env: {
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    },
  });
}

