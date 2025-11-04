// lib/config.ts
export const CLAUDE_MODEL =
  (process.env.ANTHROPIC_MODEL || "").trim() || "claude-3-5-sonnet-latest";

export const OPENAI_MODEL =
  (process.env.OPENAI_MODEL || "").trim() || "gpt-4.1-mini";

// Guard against old snapshot sneaking in
if (/claude-3-5-sonnet-20241022/i.test(CLAUDE_MODEL)) {
  throw new Error(
    "Blocked deprecated Claude model (claude-3-5-sonnet-20241022). Use claude-3-5-sonnet-latest."
  );
}
