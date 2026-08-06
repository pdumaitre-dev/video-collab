export const LOOP_END_EPSILON_SECONDS = 0.05;

export type PlaybackRange = {
  startSeconds: number;
  endSeconds: number;
};

export function isOutsidePlaybackRange(
  timeSeconds: number,
  range: PlaybackRange,
  epsilonSeconds = LOOP_END_EPSILON_SECONDS
): boolean {
  return (
    timeSeconds < range.startSeconds - epsilonSeconds ||
    timeSeconds > range.endSeconds + epsilonSeconds
  );
}

export function shouldWrapPlayback({
  currentTime,
  range,
  isLoopEnabled,
  isPaused,
  isTimelineDragging
}: {
  currentTime: number;
  range: PlaybackRange | null;
  isLoopEnabled: boolean;
  isPaused: boolean;
  isTimelineDragging: boolean;
}): boolean {
  return Boolean(
    range &&
      isLoopEnabled &&
      !isPaused &&
      !isTimelineDragging &&
      currentTime >= range.endSeconds - LOOP_END_EPSILON_SECONDS
  );
}

export function rangeReachesMediaEnd(
  range: PlaybackRange | null,
  durationSeconds: number
): boolean {
  return Boolean(
    range &&
      durationSeconds > 0 &&
      range.endSeconds >= durationSeconds - LOOP_END_EPSILON_SECONDS
  );
}
