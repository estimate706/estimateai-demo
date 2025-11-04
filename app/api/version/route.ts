import { NextResponse } from "next/server";
import { CLAUDE_MODEL, OPENAI_MODEL } from "@/lib/config";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    deployedAt: new Date().toISOString(),
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown",
    models: {
      anthropic: CLAUDE_MODEL,
      openai: OPENAI_MODEL,
    },
  });
}
