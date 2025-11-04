// lib/types.ts

export type Unit = "ea" | "lf" | "sf" | "sq" | "cf";

export type TakeoffItem = {
  category: string;
  description: string;
  unit: Unit;
  qty: number;
  notes?: string;
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
};
