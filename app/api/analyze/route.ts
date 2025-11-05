import { NextRequest, NextResponse } from "next/server";
import { openaiAnalyzePDF } from "@/lib/providers/openai";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
    }
    const isPDF = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isPDF) {
      return NextResponse.json({ ok: false, error: "Only PDF files supported" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const oai = await openaiAnalyzePDF(new Uint8Array(buf));

    // Return only OpenAI results
    return NextResponse.json(
      {
        ok: true,
        takeoff: {
          items: oai.items,
          summary: oai.summary,
          confidence: oai.confidence,
          sources: { openai: oai, anthropic: undefined },
        },
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Analyze failed" },
      { status: 500 }
    );
  }
}







  
    
