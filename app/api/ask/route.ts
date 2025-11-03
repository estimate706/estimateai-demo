import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { askQuestionAboutPlan } from '@/lib/ai-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, question } = body;

    if (!projectId || !question) {
      return NextResponse.json(
        { error: 'Project ID and question are required' },
        { status: 400 }
      );
    }

    // Get project with PDF
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || !project.pdfBlobUrl) {
      return NextResponse.json(
        { error: 'Project or PDF not found' },
        { status: 404 }
      );
    }

    // Extract base64 from data URL
    const base64Data = project.pdfBlobUrl.replace(
      /^data:application\/pdf;base64,/,
      ''
    );

    // Ask Claude
    const answer = await askQuestionAboutPlan(base64Data, question);

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error('Ask error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process question',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
