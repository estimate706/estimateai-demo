import type { Prisma } from '@prisma/client';
import { prisma } from './db';

// Define the structure for an estimate breakdown
interface EstimateBreakdown {
  materials: number;
  labor: number;
  overhead: number;
  profitPct: number;
  totalAmount: number;
}

// This function calculates a basic estimate breakdown
export function calculateEstimate(
  materials: number,
  labor: number,
  overheadPct = 10,
  profitPct = 15
): EstimateBreakdown {
  const overhead = (materials + labor) * (overheadPct / 100);
  const subtotal = materials + labor + overhead;
  const profit = subtotal * (profitPct / 100);
  const totalAmount = subtotal + profit;

  return {
    materials,
    labor,
    overhead,
    profitPct,
    totalAmount,
  };
}

// This function saves an estimate record to the database
export async function saveEstimateToDB(
  projectId: string,
  breakdown: EstimateBreakdown
) {
  try {
    const estimate = await prisma.estimate.create({
      data: {
        projectId,
        materials: breakdown.materials,
        labor: breakdown.labor,
        overhead: breakdown.overhead,
        profitPct: breakdown.profitPct,
        totalAmount: breakdown.totalAmount,
        breakdownJson: JSON.parse(JSON.stringify(breakdown)) as Prisma.InputJsonValue,
      },
    });

    return estimate;
  } catch (error: any) {
    console.error('Error saving estimate to DB:', error.message || error);
    throw new Error('Failed to save estimate to database.');
  }
}

// This function retrieves an estimate from the database
export async function getEstimateByProjectId(projectId: string) {
  try {
    const estimate = await prisma.estimate.findFirst({
      where: { projectId },
    });
    return estimate;
  } catch (error: any) {
    console.error('Error fetching estimate:', error.message || error);
    throw new Error('Failed to fetch estimate.');
  }
}

