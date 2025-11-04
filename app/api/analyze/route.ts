import { NextRequest, NextResponse } from "next/server";
import { dualAnalyze } from "@/lib/estimator";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "No file uploaded" }, { status: 400 });
    }

    // Allow empty type as long as filename ends in .pdf
    const isPDF = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isPDF) {
      return NextResponse.json({ ok: false, error: "Only PDF files supported" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const takeoff = await dualAnalyze(new Uint8Array(buf));

    return NextResponse.json({ ok: true, takeoff }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e?.message || "Analyze failed" }, { status: 500 });
  }
}






  
    
