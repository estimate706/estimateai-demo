import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const name = formData.get('name') as string;
    const zipCode = formData.get('zipCode') as string | null;

    if (!file || !userId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { email: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userId,
          name: userId,
        },
      });
    }

    // Find region by zip code if provided
    let regionId: string | null = null;
    if (zipCode) {
      const zipMap = await prisma.regionZipMap.findFirst({
        where: { zipCode },
        include: { region: true },
      });
      regionId = zipMap?.regionId || null;
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name,
        zipCode: zipCode || undefined,
        regionId: regionId || undefined,
        status: 'uploaded',
      },
    });

    // Convert file to base64 for storage (in real app, use blob storage)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // Store base64 in project (temporary - in production use Vercel Blob)
    await prisma.project.update({
      where: { id: project.id },
      data: {
        pdfBlobUrl: `data:application/pdf;base64,${base64}`,
      },
    });

    return NextResponse.json({
      success: true,
      projectId: project.id,
      userId: user.id,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
