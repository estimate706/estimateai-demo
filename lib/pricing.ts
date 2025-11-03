import type { Prisma } from '@prisma/client';
import { prisma } from './db';

// Shape used in the app for quick math + display
export interface EstimateBreakdown {
  materials: number;
  labor: number;
  overhead: number;
  profitPct: number;
  totalAmount: number;
}

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

/**
 * Save the estimate in a JSON column only (schema-agnostic).
 * Your Prisma model should have fields at least:
 *
 * model Estimate {
 *   id            String   @id @default(cuid())
 *   projectId     String
 *   breakdownJson Json
 *   createdAt     DateTime @default(now())
 * }
 */
export async function saveEstimateToDB(
  projectId: string,
  breakdown: EstimateBreakdown
) {
  try {
    const jsonValue = JSON.parse(JSON.stringify(breakdown)) as Prisma.InputJsonValue;

    const estimate = await prisma.estimate.create({
      data: {
        projectId,
        breakdownJson: jsonValue,
      },
    });

    return estimate;
  } catch (error: any) {
    console.error('Error saving estimate to DB:', error?.message || error);
    throw new Error('Failed to save estimate to database.');
  }
}

export async function getEstimateByProjectId(projectId: string) {
  try {
    const estimate = await prisma.estimate.findFirst({
      where: { projectId },
    });
    return estimate;
  } catch (error: any) {
    console.error('Error fetching estimate:', error?.message || error);
    throw new Error('Failed to fetch estimate.');
  }
}
