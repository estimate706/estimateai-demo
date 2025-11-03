import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, category, optionCode } = body;

    if (!projectId || !category || !optionCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Upsert selection (create or update)
    const selection = await prisma.userSelection.upsert({
      where: {
        projectId_category: {
          projectId,
          category,
        },
      },
      update: {
        optionCode,
      },
      create: {
        projectId,
        category,
        optionCode,
      },
    });

    return NextResponse.json({
      success: true,
      selection,
    });
  } catch (error) {
    console.error('Selection error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save selection',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
