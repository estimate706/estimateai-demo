import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { analyzePDFWithClaude } from '@/lib/ai-service';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, analysisType = 'detailed' } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
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

    // Analyze with Claude
    const analysis = await analyzePDFWithClaude(base64Data, analysisType);

    // Save measurements to database
    const measurements = [];
    const m = analysis.measurements;
    
    if (m.grossSqFt) measurements.push({ featureType: 'grossSqFt', valueNum: m.grossSqFt, projectId });
    if (m.firstFloorSqFt) measurements.push({ featureType: 'firstFloorSqFt', valueNum: m.firstFloorSqFt, projectId });
    if (m.secondFloorSqFt) measurements.push({ featureType: 'secondFloorSqFt', valueNum: m.secondFloorSqFt, projectId });
    if (m.overallWidthFt) measurements.push({ featureType: 'overallWidthFt', valueNum: m.overallWidthFt, projectId });
    if (m.overallDepthFt) measurements.push({ featureType: 'overallDepthFt', valueNum: m.overallDepthFt, projectId });
    if (m.wallHeightFt) measurements.push({ featureType: 'wallHeightFt', valueNum: m.wallHeightFt, projectId });
    if (m.bedroomCount) measurements.push({ featureType: 'bedroomCount', valueNum: m.bedroomCount, projectId });
    if (m.bathroomCount) measurements.push({ featureType: 'bathroomCount', valueNum: m.bathroomCount, projectId });
    if (m.windowCount) measurements.push({ featureType: 'windowCount', valueNum: m.windowCount, projectId });
    if (m.doorCount) measurements.push({ featureType: 'doorCount', valueNum: m.doorCount, projectId });
    if (m.garageSize) measurements.push({ featureType: 'garageSize', valueText: m.garageSize, projectId });
    if (m.roofPitch) measurements.push({ featureType: 'roofPitch', valueText: m.roofPitch, projectId });
    if (m.foundationType) measurements.push({ featureType: 'foundationType', valueText: m.foundationType, projectId });

    if (measurements.length > 0) {
      await prisma.aIMeasurement.createMany({
        data: measurements,
      });
    }

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'analyzed' },
    });

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze PDF',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
