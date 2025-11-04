// lib/estimate.ts
import type { MergedEstimate, TakeoffResult, TakeoffItem } from "@/lib/types";
import { openaiAnalyzePDF } from "@/lib/providers/openai";
import { anthropicAnalyzePDF } from "@/lib/providers/anthropic";

// IMPROVED: Category normalization
const CATEGORY_ALIASES: Record<string, string> = {
  carpentry: "framing",
  "wood framing": "framing",
  "rough carpentry": "framing",
  roof: "roofing",
  "exterior cladding": "siding",
  cladding: "siding",
  housewrap: "siding",
  glazing: "windows_doors",
  openings: "windows_doors",
  windows: "windows_doors",
  doors: "windows_doors",
  "gypsum board": "drywall",
  gypsum: "drywall",
  "gyp board": "drywall",
  "floor covering": "flooring",
  "floor finish": "flooring",
  trim: "finishes",
  paint: "finishes",
  painting: "finishes",
  hvac: "mechanical",
  mech: "mechanical",
};

// IMPROVED: Unit normalization
const UNIT_ALIASES: Record<string, string> = {
  ea: "ea",
  each: "ea",
  piece: "ea",
  "#": "ea",
  lf: "lf",
  "linear feet": "lf",
  feet: "lf",
  ft: "lf",
  sf: "sf",
  "square feet": "sf",
  sqft: "sf",
  sq: "sq",
  squares: "sq",
  "roofing square": "sq",
  cy: "cy",
  "cubic yards": "cy",
  yard: "cy",
  cf: "cf",
  "cubic feet": "cf",
  bf: "bf",
  "board feet": "bf",
};

function normalizeCategory(cat: string): string {
  const lower = cat.toLowerCase().trim();
  return CATEGORY_ALIASES[lower] || lower;
}

function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase().trim();
  return UNIT_ALIASES[lower] || lower;
}

// IMPROVED: String similarity using Jaro-Winkler
function jaroWinkler(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  if (m === 0 && n ===
