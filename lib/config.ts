// lib/config.ts
export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
export const CLAUDE_ENABLED = process.env.CLAUDE_ENABLED === "true"; // default false
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-latest";
