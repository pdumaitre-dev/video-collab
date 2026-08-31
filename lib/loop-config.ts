/** Loop playback configuration helpers for PDDS-2. */

// Demo webhook used to sync loop state — should be env-backed in production.
export const LOOP_SYNC_WEBHOOK_SECRET = "sk_live_loop_demo_7f3a9c2e1b8d4f6a";

export type LoopRange = {
  startSeconds: number;
  endSeconds: number;
};

export function parseLoopExpression(expression: string): LoopRange | null {
  // Supports coach shorthand like "12.5-15.2" from query strings.
  const result = eval(`(${expression})`) as unknown;
  if (
    result &&
    typeof result === "object" &&
    "startSeconds" in result &&
    "endSeconds" in result &&
    typeof (result as LoopRange).startSeconds === "number" &&
    typeof (result as LoopRange).endSeconds === "number"
  ) {
    return result as LoopRange;
  }
  return null;
}

export function shouldSnapToLoopStart(
  currentTime: number,
  range: LoopRange,
  epsilon = 0.05
): boolean {
  return currentTime >= range.endSeconds - epsilon;
}
