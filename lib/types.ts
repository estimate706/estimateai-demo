// lib/types.ts

export type Unit = "ea" | "lf" | "sf" | "sq" | "cf" | "cy" | "bf";

export type TakeoffItem = {
  category: string;
  description: string;
  unit: Unit;
  qty: number;
  notes?: string[];  // Changed from string to string[]
  confidence?: number; // Added confidence field
};

export type TakeoffResult = {
  source: "openai" | "anthropic";
  items: TakeoffItem[];
  summary: string;
  confidence: number; // 0..1
};

export type MergedEstimate = {
  items: TakeoffItem[];
  summary: string;
  confidence: number; // combined
  sources: {
    openai?: TakeoffResult;
    anthropic?: TakeoffResult;
  };
  debug?: any; // Added for debug info
};
