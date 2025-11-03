// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { analyzePdfWithOpenAI } from '@/lib/ai-service';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    // Expect multipart/form-data with a "file" field (PDF)
    const formData = await req.formData();
    const file = formData.get('file') as unknown as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    // Convert to base64
    const buf = Buffer.from(await file.arrayBuffer());
    const pdfBase64 = buf.toString('base64');

    // Analyze via OpenAI-only service
    const result = await analyzePdfWithOpenAI(pdfBase64);

    // Return structured JSON
    return NextResponse.json({ ok: true, result }, { status: 200 });
  } catch (err: any) {
    console.error('analyze error:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}




  
    
