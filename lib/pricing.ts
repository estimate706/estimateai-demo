import { prisma } from './db';
import { Decimal } from '@prisma/client/runtime/library';

interface ProjectQuantities {
  grossSqFt: number;
  firstFloorSqFt: number;
  secondFloorSqFt: number;
  overallWidthFt: number;
  overallDepthFt: number;
  wallHeightFt: number;
  windowCount: number;
  doorCount: number;
}

interface LineItem {
  type: 'material' | 'labor';
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  extended: number;
  notes?: string;
}

interface EstimateBreakdown {
  lineItems: LineItem[];
  subtotalMaterial: number;
  subtotalLabor: number;
  overhead: number;
  profit: number;
  totalAmount: number;
}

export async function calculateEstimate(
  projectId: string,
  overheadPct: number = 10,
  profitPct: number = 10
): Promise<EstimateBreakdown> {
  // Get project with all related data
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      measurements: true,
      selections: {
        include: {
          option: {
            include: {
              assembly: {
                include: {
                  materials: {
                    include: {
                      material: true,
                    },
                  },
                  labor: true,
                },
              },
            },
          },
        },
      },
      region: true,
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // Extract quantities from measurements
  const quantities = extractQuantities(project.measurements);
  
  const lineItems: LineItem[] = [];
  let subtotalMaterial = 0;
  let subtotalLabor = 0;

  // Process each user selection
  for (const selection of project.selections) {
    const option = selection.option;
    if (!option?.assembly) continue;

    const assembly = option.assembly;
    const units = calculateUnitsForAssembly(assembly.code, assembly.unit, quantities);

    // Process materials in assembly
    for (const assemblyMat of assembly.materials) {
      const material = assemblyMat.material;
      const qtyPerUnit = Number(assemblyMat.qtyPerUnit);
      const wasteFactor = Number(assemblyMat.wasteFactor);
      
      const totalQty = units * qtyPerUnit * (1 + wasteFactor);
      const unitCost = await getMaterialCost(
        material.id,
        project.regionId || null
      );
      const extended = totalQty * unitCost;

      lineItems.push({
        type: 'material',
        category: assembly.category,
        description: material.name,
        quantity: totalQty,
        unit: material.unit,
        unitCost,
        extended,
        notes: assembly.name,
      });

      subtotalMaterial += extended;
    }

    // Process labor in assembly
    for (const assemblyLabor of assembly.labor) {
      const hoursPerUnit = Number(assemblyLabor.hoursPerUnit);
      const totalHours = units * hoursPerUnit;
      
      const laborRate = await getLaborRate(
        project.regionId || null,
        assemblyLabor.tradeCode
      );
      const extended = totalHours * laborRate;

      lineItems.push({
        type: 'labor',
        category: assembly.category,
        description: `${assemblyLabor.tradeCode} Labor`,
        quantity: totalHours,
        unit: 'HR',
        unitCost: laborRate,
        extended,
        notes: assembly.name,
      });

      subtotalLabor += extended;
    }
  }

  const overhead = (subtotalMaterial + subtotalLabor) * (overheadPct / 100);
  const profit = (subtotalMaterial + subtotalLabor + overhead) * (profitPct / 100);
  const totalAmount = subtotalMaterial + subtotalLabor + overhead + profit;

  return {
    lineItems,
    subtotalMaterial,
    subtotalLabor,
    overhead,
    profit,
    totalAmount,
  };
}

function extractQuantities(measurements: any[]): ProjectQuantities {
  const getValue = (featureType: string): number => {
    const measurement = measurements.find(m => m.featureType === featureType);
    return measurement?.valueNum ? Number(measurement.valueNum) : 0;
  };

  return {
    grossSqFt: getValue('grossSqFt') || getValue('gross_heated_sf') || 2000,
    firstFloorSqFt: getValue('firstFloorSqFt') || getValue('first_floor_sf') || 1000,
    secondFloorSqFt: getValue('secondFloorSqFt') || getValue('second_floor_sf') || 0,
    overallWidthFt: getValue('overallWidthFt') || getValue('overall_width_ft') || 40,
    overallDepthFt: getValue('overallDepthFt') || getValue('overall_depth_ft') || 50,
    wallHeightFt: getValue('wallHeightFt') || 9,
    windowCount: getValue('windowCount') || getValue('window_count_total') || 15,
    doorCount: getValue('doorCount') || getValue('door_count_total') || 8,
  };
}

function calculateUnitsForAssembly(
  code: string,
  unit: string,
  quantities: ProjectQuantities
): number {
  // Foundation - per square foot
  if (code.includes('FOUND_')) {
    return quantities.grossSqFt;
  }

  // Exterior walls - calculate wall area
  if (code.includes('EXT_WALL_') || code.includes('EXT_')) {
    const perimeter = 2 * (quantities.overallWidthFt + quantities.overallDepthFt);
    const wallArea = perimeter * quantities.wallHeightFt;
    return wallArea;
  }

  // Roof - calculate roof area (with pitch factor)
  if (code.includes('ROOF_')) {
    const roofSqFt = quantities.grossSqFt * 1.2; // 1.2 factor for pitch
    return roofSqFt / 100; // Convert to squares
  }

  // Interior - per square foot
  if (code.includes('INT_') || code.includes('FLOOR_') || code.includes('CEILING_')) {
    return quantities.grossSqFt;
  }

  // Windows - per count
  if (code.includes('WINDOW_')) {
    return quantities.windowCount;
  }

  // Doors - per count
  if (code.includes('DOOR_')) {
    return quantities.doorCount;
  }

  // Default to gross square footage
  return quantities.grossSqFt;
}

async function getMaterialCost(
  materialId: string,
  regionId: string | null
): Promise<number> {
  // Try to get regional override first
  if (regionId) {
    const regionalPrice = await prisma.materialRegionPrice.findUnique({
      where: {
        materialId_regionId: {
          materialId,
          regionId,
        },
      },
    });

    if (regionalPrice) {
      return Number(regionalPrice.costPerUnit);
    }

    // If no override, apply regional multiplier to base cost
    const region = await prisma.region.findUnique({
      where: { id: regionId },
    });

    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });

    if (region && material) {
      const baseCost = Number(material.baseCost);
      const multiplier = Number(region.materialMultiplier);
      return baseCost * multiplier;
    }
  }

  // Fall back to base cost
  const material = await prisma.material.findUnique({
    where: { id: materialId },
  });

  return material ? Number(material.baseCost) : 0;
}

async function getLaborRate(
  regionId: string | null,
  tradeCode: string
): Promise<number> {
  if (!regionId) {
    throw new Error('Region required for labor rates');
  }

  const laborRate = await prisma.laborRate.findUnique({
    where: {
      regionId_tradeCode: {
        regionId,
        tradeCode,
      },
    },
  });

  if (!laborRate) {
    // Default fallback rate
    return 50.0;
  }

  return Number(laborRate.ratePerHour);
}

export async function saveEstimate(
  projectId: string,
  breakdown: EstimateBreakdown,
  regionId: string | null,
  overheadPct: number,
  profitPct: number
) {
  return await prisma.estimate.create({
    data: {
      projectId,
      regionId,
      subtotalMaterial: breakdown.subtotalMaterial,
      subtotalLabor: breakdown.subtotalLabor,
      overheadPct,
      profitPct,
      totalAmount: breakdown.totalAmount,
      breakdownJson: breakdown,
    },
  });
}
