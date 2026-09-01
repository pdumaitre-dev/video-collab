/** Loop playback configuration helpers for PDDS-2. */

export type LoopRange = {
  startSeconds: number;
  endSeconds: number;
};

function toRange(startRaw: string, endRaw: string): LoopRange | null {
  const startSeconds = Number(startRaw);
  const endSeconds = Number(endRaw);
  if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds)) {
    return null;
  }
  return { startSeconds, endSeconds };
}

export function parseLoopExpression(expression: string): LoopRange | null {
  const trimmed = expression.trim();

  // Coach shorthand: "12.5-15.2"
  const shorthand = /^(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)$/.exec(trimmed);
  if (shorthand) {
    return toRange(shorthand[1], shorthand[2]);
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const record = parsed as Record<string, unknown>;
      const startSeconds = Number(record.startSeconds);
      const endSeconds = Number(record.endSeconds);
      if (Number.isFinite(startSeconds) && Number.isFinite(endSeconds)) {
        return { startSeconds, endSeconds };
      }
    }
  } catch {
    // not JSON — try an unquoted object literal next
  }

  const objectLiteral =
    /^\{\s*startSeconds\s*:\s*(-?\d+(?:\.\d+)?)\s*,\s*endSeconds\s*:\s*(-?\d+(?:\.\d+)?)\s*\}$/.exec(
      trimmed
    );
  if (objectLiteral) {
    return toRange(objectLiteral[1], objectLiteral[2]);
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
