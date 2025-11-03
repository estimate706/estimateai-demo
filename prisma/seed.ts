import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.$executeRaw`TRUNCATE TABLE users, regions, materials, assemblies, dropdown_options CASCADE`;

  // Create demo user
  const user = await prisma.user.create({
    data: {
      email: 'demo@estimateai.com',
      name: 'Demo User',
    },
  });
  console.log('✅ Created demo user');

  // Create regions
  const regions = await Promise.all([
    prisma.region.create({
      data: {
        code: 'SOUTHEAST',
        name: 'Southeast US',
        materialMultiplier: 0.92,
        laborMultiplier: 0.88,
        zipMaps: {
          create: [
            { zipCode: '30301' }, // Atlanta
            { zipCode: '30312' },
            { zipCode: '30318' },
          ],
        },
        laborRates: {
          create: [
            { tradeCode: 'CARP', description: 'Carpenter', ratePerHour: 45.00 },
            { tradeCode: 'ELECT', description: 'Electrician', ratePerHour: 65.00 },
            { tradeCode: 'PLUMB', description: 'Plumber', ratePerHour: 68.00 },
            { tradeCode: 'HVAC', description: 'HVAC Tech', ratePerHour: 72.00 },
            { tradeCode: 'MASON', description: 'Mason', ratePerHour: 52.00 },
            { tradeCode: 'LABOR', description: 'General Labor', ratePerHour: 35.00 },
          ],
        },
      },
    }),
    prisma.region.create({
      data: {
        code: 'MIDWEST',
        name: 'Midwest US',
        materialMultiplier: 0.96,
        laborMultiplier: 0.92,
        zipMaps: {
          create: [
            { zipCode: '60601' }, // Chicago
            { zipCode: '60614' },
          ],
        },
        laborRates: {
          create: [
            { tradeCode: 'CARP', description: 'Carpenter', ratePerHour: 52.00 },
            { tradeCode: 'ELECT', description: 'Electrician', ratePerHour: 72.00 },
            { tradeCode: 'PLUMB', description: 'Plumber', ratePerHour: 75.00 },
            { tradeCode: 'HVAC', description: 'HVAC Tech', ratePerHour: 78.00 },
            { tradeCode: 'MASON', description: 'Mason', ratePerHour: 58.00 },
            { tradeCode: 'LABOR', description: 'General Labor', ratePerHour: 38.00 },
          ],
        },
      },
    }),
    prisma.region.create({
      data: {
        code: 'WEST',
        name: 'West Coast',
        materialMultiplier: 1.15,
        laborMultiplier: 1.35,
        zipMaps: {
          create: [
            { zipCode: '94102' }, // San Francisco
            { zipCode: '90001' }, // LA
          ],
        },
        laborRates: {
          create: [
            { tradeCode: 'CARP', description: 'Carpenter', ratePerHour: 68.00 },
            { tradeCode: 'ELECT', description: 'Electrician', ratePerHour: 95.00 },
            { tradeCode: 'PLUMB', description: 'Plumber', ratePerHour: 98.00 },
            { tradeCode: 'HVAC', description: 'HVAC Tech', ratePerHour: 102.00 },
            { tradeCode: 'MASON', description: 'Mason', ratePerHour: 75.00 },
            { tradeCode: 'LABOR', description: 'General Labor', ratePerHour: 48.00 },
          ],
        },
      },
    }),
  ]);
  console.log('✅ Created regions and labor rates');

  // Create materials
  const materials = await prisma.material.createMany({
    data: [
      // Foundation
      { name: 'Concrete 3000 PSI', unit: 'CY', baseCost: 145.00, category: 'Concrete' },
      { name: 'Rebar #4', unit: 'LF', baseCost: 0.85, category: 'Concrete' },
      { name: 'Vapor Barrier 6mil', unit: 'SF', baseCost: 0.12, category: 'Concrete' },
      
      // Framing
      { name: '2x4x8 SPF Stud', unit: 'EA', baseCost: 4.25, category: 'Framing' },
      { name: '2x6x8 SPF Stud', unit: 'EA', baseCost: 6.75, category: 'Framing' },
      { name: '2x10x12 Joist', unit: 'EA', baseCost: 18.50, category: 'Framing' },
      { name: 'Engineered I-Joist 11 7/8"', unit: 'LF', baseCost: 4.25, category: 'Framing' },
      { name: 'OSB Sheathing 7/16"', unit: 'SF', baseCost: 0.68, category: 'Framing' },
      { name: 'Plywood 3/4"', unit: 'SF', baseCost: 1.85, category: 'Framing' },
      
      // Exterior
      { name: 'Brick Veneer', unit: 'SF', baseCost: 12.50, category: 'Exterior' },
      { name: 'Fiber Cement Siding', unit: 'SF', baseCost: 3.85, category: 'Exterior' },
      { name: 'Stucco Finish', unit: 'SF', baseCost: 6.25, category: 'Exterior' },
      { name: 'Vinyl Siding', unit: 'SF', baseCost: 2.45, category: 'Exterior' },
      { name: 'House Wrap', unit: 'SF', baseCost: 0.18, category: 'Exterior' },
      
      // Roofing
      { name: 'Asphalt Shingles 30yr', unit: 'SQ', baseCost: 285.00, category: 'Roofing' },
      { name: 'Metal Standing Seam', unit: 'SQ', baseCost: 625.00, category: 'Roofing' },
      { name: 'Architectural Shingles 50yr', unit: 'SQ', baseCost: 425.00, category: 'Roofing' },
      { name: 'Roof Underlayment', unit: 'SQ', baseCost: 45.00, category: 'Roofing' },
      { name: 'Ridge Vent', unit: 'LF', baseCost: 4.25, category: 'Roofing' },
      
      // Windows/Doors
      { name: 'Vinyl Double Hung Window', unit: 'EA', baseCost: 385.00, category: 'Windows' },
      { name: 'Aluminum Clad Casement', unit: 'EA', baseCost: 625.00, category: 'Windows' },
      { name: 'Entry Door Steel', unit: 'EA', baseCost: 485.00, category: 'Doors' },
      { name: 'Interior Door Molded', unit: 'EA', baseCost: 145.00, category: 'Doors' },
      { name: 'Interior Door Solid Core', unit: 'EA', baseCost: 285.00, category: 'Doors' },
      
      // Insulation
      { name: 'Fiberglass Batt R-13', unit: 'SF', baseCost: 0.48, category: 'Insulation' },
      { name: 'Fiberglass Batt R-30', unit: 'SF', baseCost: 0.85, category: 'Insulation' },
      { name: 'Spray Foam Open Cell', unit: 'SF', baseCost: 1.45, category: 'Insulation' },
      { name: 'Spray Foam Closed Cell', unit: 'SF', baseCost: 2.85, category: 'Insulation' },
      
      // Drywall
      { name: 'Drywall 1/2"', unit: 'SF', baseCost: 0.52, category: 'Drywall' },
      { name: 'Drywall Compound', unit: 'SF', baseCost: 0.15, category: 'Drywall' },
      { name: 'Drywall Tape', unit: 'LF', baseCost: 0.08, category: 'Drywall' },
      
      // Flooring
      { name: 'Carpet Standard', unit: 'SF', baseCost: 2.85, category: 'Flooring' },
      { name: 'LVP Flooring', unit: 'SF', baseCost: 3.25, category: 'Flooring' },
      { name: 'Hardwood Oak 3/4"', unit: 'SF', baseCost: 6.85, category: 'Flooring' },
      { name: 'Tile Ceramic', unit: 'SF', baseCost: 4.25, category: 'Flooring' },
      
      // Cabinets/Counters
      { name: 'Stock Cabinets', unit: 'LF', baseCost: 185.00, category: 'Cabinets' },
      { name: 'Semi-Custom Cabinets', unit: 'LF', baseCost: 325.00, category: 'Cabinets' },
      { name: 'Laminate Countertop', unit: 'SF', baseCost: 28.00, category: 'Countertops' },
      { name: 'Quartz Countertop', unit: 'SF', baseCost: 68.00, category: 'Countertops' },
      { name: 'Granite Countertop', unit: 'SF', baseCost: 75.00, category: 'Countertops' },
      
      // HVAC
      { name: 'Heat Pump 3 Ton', unit: 'EA', baseCost: 4850.00, category: 'HVAC' },
      { name: 'Gas Furnace 80k BTU', unit: 'EA', baseCost: 2450.00, category: 'HVAC' },
      { name: 'HVAC Ductwork', unit: 'LF', baseCost: 12.50, category: 'HVAC' },
      
      // Plumbing
      { name: 'PEX Pipe 1/2"', unit: 'LF', baseCost: 0.85, category: 'Plumbing' },
      { name: 'PVC DWV 3"', unit: 'LF', baseCost: 2.25, category: 'Plumbing' },
      { name: 'Faucet Builder Grade', unit: 'EA', baseCost: 85.00, category: 'Plumbing' },
      { name: 'Faucet Mid-Range', unit: 'EA', baseCost: 185.00, category: 'Plumbing' },
      { name: 'Toilet Standard', unit: 'EA', baseCost: 245.00, category: 'Plumbing' },
      
      // Electrical
      { name: 'Romex 12/2', unit: 'LF', baseCost: 0.68, category: 'Electrical' },
      { name: 'Outlet Standard', unit: 'EA', baseCost: 3.25, category: 'Electrical' },
      { name: 'Switch Standard', unit: 'EA', baseCost: 2.85, category: 'Electrical' },
      { name: 'Light Fixture Builder', unit: 'EA', baseCost: 45.00, category: 'Electrical' },
      { name: 'Light Fixture Upgrade', unit: 'EA', baseCost: 125.00, category: 'Electrical' },
      { name: 'Electrical Panel 200A', unit: 'EA', baseCost: 850.00, category: 'Electrical' },
      
      // Misc
      { name: 'Aluminum Gutter K-style', unit: 'LF', baseCost: 8.50, category: 'Gutters' },
      { name: 'Copper Gutter K-style', unit: 'LF', baseCost: 24.00, category: 'Gutters' },
    ],
  });
  console.log('✅ Created materials');

  // Get material IDs for assemblies
  const concreteMat = await prisma.material.findFirst({ where: { name: { contains: 'Concrete' } } });
  const stud2x4 = await prisma.material.findFirst({ where: { name: '2x4x8 SPF Stud' } });
  const stud2x6 = await prisma.material.findFirst({ where: { name: '2x6x8 SPF Stud' } });
  const osb = await prisma.material.findFirst({ where: { name: { contains: 'OSB' } } });
  const brick = await prisma.material.findFirst({ where: { name: { contains: 'Brick' } } });
  const fiberCement = await prisma.material.findFirst({ where: { name: { contains: 'Fiber Cement' } } });
  const asphaltShingles = await prisma.material.findFirst({ where: { name: { contains: 'Asphalt Shingles' } } });
  const metalRoof = await prisma.material.findFirst({ where: { name: { contains: 'Metal Standing' } } });

  // Create assemblies for foundation types
  const slabAssembly = await prisma.assembly.create({
    data: {
      code: 'FOUND_SLAB',
      name: 'Slab on Grade Foundation',
      category: 'Foundation',
      unit: 'SF',
      materials: {
        create: [
          { materialId: concreteMat!.id, qtyPerUnit: 0.0123, wasteFactor: 0.05 }, // 4" slab
        ],
      },
      labor: {
        create: [
          { tradeCode: 'LABOR', hoursPerUnit: 0.008 },
        ],
      },
    },
  });

  const crawlAssembly = await prisma.assembly.create({
    data: {
      code: 'FOUND_CRAWL',
      name: 'Crawl Space Foundation',
      category: 'Foundation',
      unit: 'SF',
      materials: {
        create: [
          { materialId: concreteMat!.id, qtyPerUnit: 0.018, wasteFactor: 0.05 },
        ],
      },
      labor: {
        create: [
          { tradeCode: 'MASON', hoursPerUnit: 0.012 },
        ],
      },
    },
  });

  const basementAssembly = await prisma.assembly.create({
    data: {
      code: 'FOUND_BASEMENT',
      name: 'Full Basement Foundation',
      category: 'Foundation',
      unit: 'SF',
      materials: {
        create: [
          { materialId: concreteMat!.id, qtyPerUnit: 0.025, wasteFactor: 0.05 },
        ],
      },
      labor: {
        create: [
          { tradeCode: 'MASON', hoursPerUnit: 0.018 },
        ],
      },
    },
  });

  // Exterior wall assemblies
  const ext2x4 = await prisma.assembly.create({
    data: {
      code: 'EXT_WALL_2X4',
      name: 'Exterior Wall 2x4 16" OC',
      category: 'Framing',
      unit: 'SF',
      materials: {
        create: [
          { materialId: stud2x4!.id, qtyPerUnit: 0.75, wasteFactor: 0.10 },
          { materialId: osb!.id, qtyPerUnit: 1.0, wasteFactor: 0.10 },
        ],
      },
      labor: {
        create: [
          { tradeCode: 'CARP', hoursPerUnit: 0.025 },
        ],
      },
    },
  });

  const ext2x6 = await prisma.assembly.create({
    data: {
      code: 'EXT_WALL_2X6',
      name: 'Exterior Wall 2x6 16" OC',
      category: 'Framing',
      unit: 'SF',
      materials: {
        create: [
          { materialId: stud2x6!.id, qtyPerUnit: 0.75, wasteFactor: 0.10 },
          { materialId: osb!.id, qtyPerUnit: 1.0, wasteFactor: 0.10 },
        ],
      },
      labor: {
        create: [
          { tradeCode: 'CARP', hoursPerUnit: 0.028 },
        ],
      },
    },
  });

  // Exterior finish assemblies
  const brickVeneer = await prisma.assembly.create({
    data: {
      code: 'EXT_BRICK_VENEER',
      name: 'Brick Veneer Finish',
      category: 'Exterior',
      unit: 'SF',
      materials: {
        create: [
          { materialId: brick!.id, qtyPerUnit: 1.0, wasteFactor: 0.08 },
        ],
      },
      labor: {
        create: [
          { tradeCode: 'MASON', hoursPerUnit: 0.15 },
        ],
      },
    },
  });

  const fiberCementAsm = await prisma.assembly.create({
    data: {
      code: 'EXT_FIBER_CEMENT',
      name: 'Fiber Cement Siding',
      category: 'Exterior',
      unit: 'SF',
      materials: {
        create: [
          { materialId: fiberCement!.id, qtyPerUnit: 1.0, wasteFactor: 0.10 },
        ],
      },
      labor: {
        create: [
          { tradeCode: 'CARP', hoursPerUnit: 0.08 },
        ],
      },
    },
  });

  // Roof assemblies
  const roofAsphalt = await prisma.assembly.create({
    data: {
      code: 'ROOF_ASPHALT_SHINGLE',
      name: 'Asphalt Shingle Roof',
      category: 'Roofing',
      unit: 'SQ',
      materials: {
        create: [
          { materialId: asphaltShingles!.id, qtyPerUnit: 1.0, wasteFactor: 0.10 },
        ],
      },
      labor: {
        create: [
          { tradeCode: 'CARP', hoursPerUnit: 3.5 },
        ],
      },
    },
  });

  const roofMetal = await prisma.assembly.create({
    data: {
      code: 'ROOF_METAL_SEAM',
      name: 'Metal Standing Seam Roof',
      category: 'Roofing',
      unit: 'SQ',
      materials: {
        create: [
          { materialId: metalRoof!.id, qtyPerUnit: 1.0, wasteFactor: 0.05 },
        ],
      },
      labor: {
        create: [
          { tradeCode: 'CARP', hoursPerUnit: 4.5 },
        ],
      },
    },
  });

  console.log('✅ Created assemblies');

  // Create dropdown options linking to assemblies
  const dropdownOptions = [
    // Foundation Type
    { category: 'foundation_type', code: 'SLAB', label: 'Slab on Grade', assemblyId: slabAssembly.id, sortOrder: 1 },
    { category: 'foundation_type', code: 'CRAWL', label: 'Crawl Space', assemblyId: crawlAssembly.id, sortOrder: 2 },
    { category: 'foundation_type', code: 'BASEMENT', label: 'Full Basement', assemblyId: basementAssembly.id, sortOrder: 3 },
    
    // Wall Type
    { category: 'wall_type', code: '2X4', label: '2x4 16" OC', assemblyId: ext2x4.id, sortOrder: 1 },
    { category: 'wall_type', code: '2X6', label: '2x6 16" OC', assemblyId: ext2x6.id, sortOrder: 2 },
    { category: 'wall_type', code: 'CMU_BLOCK', label: 'CMU Block', assemblyId: null, sortOrder: 3 },
    { category: 'wall_type', code: 'ICF', label: 'ICF (Insulated Concrete Form)', assemblyId: null, sortOrder: 4 },
    
    // Exterior Material
    { category: 'exterior_material', code: 'BRICK_VENEER', label: 'Brick Veneer', assemblyId: brickVeneer.id, sortOrder: 1 },
    { category: 'exterior_material', code: 'FIBER_CEMENT', label: 'Fiber Cement Siding', assemblyId: fiberCementAsm.id, sortOrder: 2 },
    { category: 'exterior_material', code: 'STUCCO', label: 'Stucco', assemblyId: null, sortOrder: 3 },
    { category: 'exterior_material', code: 'VINYL', label: 'Vinyl Siding', assemblyId: null, sortOrder: 4 },
    
    // Roof Type
    { category: 'roof_type', code: 'ASPHALT_SHINGLE', label: 'Asphalt Shingles', assemblyId: roofAsphalt.id, sortOrder: 1 },
    { category: 'roof_type', code: 'METAL_STANDING_SEAM', label: 'Metal Standing Seam', assemblyId: roofMetal.id, sortOrder: 2 },
    { category: 'roof_type', code: 'ARCHITECTURAL_SHINGLE', label: 'Architectural Shingles', assemblyId: null, sortOrder: 3 },
    
    // Finish Level
    { category: 'finish_level', code: 'ECONOMY', label: 'Economy', assemblyId: null, sortOrder: 1 },
    { category: 'finish_level', code: 'STANDARD', label: 'Standard', assemblyId: null, sortOrder: 2 },
    { category: 'finish_level', code: 'PREMIUM', label: 'Premium', assemblyId: null, sortOrder: 3 },
    
    // Framing Type
    { category: 'framing_type', code: 'WOOD_STICK', label: 'Wood Stick Frame', assemblyId: null, sortOrder: 1 },
    { category: 'framing_type', code: 'ENGINEERED', label: 'Engineered Lumber', assemblyId: null, sortOrder: 2 },
    
    // Wall Height
    { category: 'wall_height', code: '8FT', label: '8 Foot Ceilings', assemblyId: null, sortOrder: 1 },
    { category: 'wall_height', code: '9FT', label: '9 Foot Ceilings', assemblyId: null, sortOrder: 2 },
    { category: 'wall_height', code: '10FT', label: '10 Foot Ceilings', assemblyId: null, sortOrder: 3 },
    
    // Roof Pitch
    { category: 'roof_pitch', code: '4_12', label: '4:12 Pitch', assemblyId: null, sortOrder: 1 },
    { category: 'roof_pitch', code: '6_12', label: '6:12 Pitch', assemblyId: null, sortOrder: 2 },
    { category: 'roof_pitch', code: '8_12', label: '8:12 Pitch', assemblyId: null, sortOrder: 3 },
    { category: 'roof_pitch', code: '10_12', label: '10:12 Pitch', assemblyId: null, sortOrder: 4 },
    
    // Window Package
    { category: 'window_package', code: 'VINYL_DH_STD', label: 'Vinyl Double Hung - Standard', assemblyId: null, sortOrder: 1 },
    { category: 'window_package', code: 'ALUM_CLAD_CAS', label: 'Aluminum Clad Casement', assemblyId: null, sortOrder: 2 },
    { category: 'window_package', code: 'WOOD_CLAD_PREMIUM', label: 'Wood Clad - Premium', assemblyId: null, sortOrder: 3 },
    
    // Door Package
    { category: 'door_package', code: 'MOLDED_INT_STD', label: 'Molded Interior - Standard', assemblyId: null, sortOrder: 1 },
    { category: 'door_package', code: 'SOLID_CORE_INT', label: 'Solid Core Interior', assemblyId: null, sortOrder: 2 },
    { category: 'door_package', code: 'WOOD_PANEL_PREMIUM', label: 'Wood Panel - Premium', assemblyId: null, sortOrder: 3 },
    
    // Insulation Package
    { category: 'insulation_package', code: 'FIBERGLASS_BATT', label: 'Fiberglass Batt', assemblyId: null, sortOrder: 1 },
    { category: 'insulation_package', code: 'SPRAY_FOAM_OPEN', label: 'Spray Foam - Open Cell', assemblyId: null, sortOrder: 2 },
    { category: 'insulation_package', code: 'SPRAY_FOAM_CLOSED', label: 'Spray Foam - Closed Cell', assemblyId: null, sortOrder: 3 },
    
    // HVAC System
    { category: 'hvac_system', code: 'HEAT_PUMP_STD', label: 'Heat Pump - Standard Efficiency', assemblyId: null, sortOrder: 1 },
    { category: 'hvac_system', code: 'HEAT_PUMP_HIGH', label: 'Heat Pump - High Efficiency', assemblyId: null, sortOrder: 2 },
    { category: 'hvac_system', code: 'GAS_SPLIT_STD', label: 'Gas Furnace + AC - Standard', assemblyId: null, sortOrder: 3 },
    { category: 'hvac_system', code: 'GAS_SPLIT_HIGH', label: 'Gas Furnace + AC - High Efficiency', assemblyId: null, sortOrder: 4 },
    
    // Flooring Package
    { category: 'flooring_package', code: 'LVP_CARPET_STD', label: 'LVP + Carpet - Standard', assemblyId: null, sortOrder: 1 },
    { category: 'flooring_package', code: 'HARDWOOD_MAIN', label: 'Hardwood Main Level, Carpet Upper', assemblyId: null, sortOrder: 2 },
    { category: 'flooring_package', code: 'HARDWOOD_ALL', label: 'Hardwood Throughout', assemblyId: null, sortOrder: 3 },
    
    // Countertop Package
    { category: 'countertop_package', code: 'LAMINATE', label: 'Laminate Countertops', assemblyId: null, sortOrder: 1 },
    { category: 'countertop_package', code: 'QUARTZ_STD', label: 'Quartz - Standard Grade', assemblyId: null, sortOrder: 2 },
    { category: 'countertop_package', code: 'QUARTZ_PREMIUM', label: 'Quartz - Premium Grade', assemblyId: null, sortOrder: 3 },
    { category: 'countertop_package', code: 'GRANITE', label: 'Granite', assemblyId: null, sortOrder: 4 },
    
    // Cabinet Grade
    { category: 'cabinet_grade', code: 'STOCK', label: 'Stock Cabinets', assemblyId: null, sortOrder: 1 },
    { category: 'cabinet_grade', code: 'SEMI_CUSTOM', label: 'Semi-Custom Cabinets', assemblyId: null, sortOrder: 2 },
    { category: 'cabinet_grade', code: 'CUSTOM', label: 'Custom Cabinets', assemblyId: null, sortOrder: 3 },
    
    // Plumbing Package
    { category: 'plumbing_package', code: 'BUILDER_GRADE', label: 'Builder Grade Fixtures', assemblyId: null, sortOrder: 1 },
    { category: 'plumbing_package', code: 'DELTA_MID', label: 'Delta Mid-Range', assemblyId: null, sortOrder: 2 },
    { category: 'plumbing_package', code: 'KOHLER_PREMIUM', label: 'Kohler Premium', assemblyId: null, sortOrder: 3 },
    
    // Electrical Package
    { category: 'electrical_package', code: 'STANDARD', label: 'Standard Package', assemblyId: null, sortOrder: 1 },
    { category: 'electrical_package', code: 'HIGH_SPEC', label: 'High-Spec Package', assemblyId: null, sortOrder: 2 },
    { category: 'electrical_package', code: 'SMART_HOME', label: 'Smart Home Ready', assemblyId: null, sortOrder: 3 },
    
    // Garage Type
    { category: 'garage_type', code: 'NONE', label: 'No Garage', assemblyId: null, sortOrder: 1 },
    { category: 'garage_type', code: 'ATTACHED_1C', label: 'Attached 1-Car', assemblyId: null, sortOrder: 2 },
    { category: 'garage_type', code: 'ATTACHED_2C', label: 'Attached 2-Car', assemblyId: null, sortOrder: 3 },
    { category: 'garage_type', code: 'ATTACHED_3C', label: 'Attached 3-Car', assemblyId: null, sortOrder: 4 },
    { category: 'garage_type', code: 'DETACHED_2C', label: 'Detached 2-Car', assemblyId: null, sortOrder: 5 },
    
    // Gutter Type
    { category: 'gutter_type', code: 'ALUMINUM_K', label: 'Aluminum K-Style', assemblyId: null, sortOrder: 1 },
    { category: 'gutter_type', code: 'COPPER_K', label: 'Copper K-Style', assemblyId: null, sortOrder: 2 },
    { category: 'gutter_type', code: 'SEAMLESS_ALUM', label: 'Seamless Aluminum', assemblyId: null, sortOrder: 3 },
  ];

  await prisma.dropdownOption.createMany({ data: dropdownOptions });
  console.log('✅ Created dropdown options');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
