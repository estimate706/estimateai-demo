import { NextRequest, NextResponse } from 'next/server';
import { calculateEstimate, saveEstimate } from '@/lib/pricing';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, overheadPct = 10, profitPct = 10 } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Calculate estimate
    const breakdown = await calculateEstimate(projectId, overheadPct, profitPct);

    // Get project to find regionId
    const { prisma } = await import('@/lib/db');
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    // Save estimate to database
    const estimate = await saveEstimate(
      projectId,
      breakdown,
      project?.regionId || null,
      overheadPct,
      profitPct
    );

    return NextResponse.json({
      success: true,
      estimate: {
        id: estimate.id,
        ...breakdown,
      },
    });
  } catch (error) {
    console.error('Estimate error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate estimate',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
