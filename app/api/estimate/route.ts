// app/api/estimate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { calculateEstimate, saveEstimateToDB } from '@/lib/pricing';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const {
      projectId,
      materials,
      labor,
      overheadPct = 10,
      profitPct = 15,
    } = body as {
      projectId: string;
      materials: number;
      labor: number;
      overheadPct?: number;
      profitPct?: number;
    };

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }
    if (
      typeof materials !== 'number' ||
      typeof labor !== 'number' ||
      Number.isNaN(materials) ||
      Number.isNaN(labor)
    ) {
      return NextResponse.json(
        { error: 'materials and labor must be numbers' },
        { status: 400 }
      );
    }

    // 1) Calculate the estimate breakdown
    const breakdown = calculateEstimate(materials, labor, overheadPct, profitPct);

    // 2) Persist to DB
    const saved = await saveEstimateToDB(projectId, breakdown);

    // 3) Return result
    return NextResponse.json(
      {
        ok: true,
        projectId,
        breakdown,
        saved,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('estimate route error:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Failed to create estimate' },
      { status: 500 }
    );
  }
}

