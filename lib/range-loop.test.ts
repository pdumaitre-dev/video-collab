import { describe, expect, it } from "vitest";
import {
  isOutsidePlaybackRange,
  rangeReachesMediaEnd,
  shouldWrapPlayback
} from "./range-loop";

const range = { startSeconds: 10, endSeconds: 20 };

describe("shouldWrapPlayback", () => {
  it("wraps at the selected range end", () => {
    expect(
      shouldWrapPlayback({
        currentTime: 19.96,
        range,
        isLoopEnabled: true,
        isPaused: false,
        isTimelineDragging: false
      })
    ).toBe(true);
  });

  it.each([
    { isLoopEnabled: false, isPaused: false, isTimelineDragging: false },
    { isLoopEnabled: true, isPaused: true, isTimelineDragging: false },
    { isLoopEnabled: true, isPaused: false, isTimelineDragging: true }
  ])("does not wrap inactive playback: %o", (playbackState) => {
    expect(
      shouldWrapPlayback({
        currentTime: 20,
        range,
        ...playbackState
      })
    ).toBe(false);
  });

  it("does not wrap without an active range", () => {
    expect(
      shouldWrapPlayback({
        currentTime: 20,
        range: null,
        isLoopEnabled: true,
        isPaused: false,
        isTimelineDragging: false
      })
    ).toBe(false);
  });
});

describe("isOutsidePlaybackRange", () => {
  it.each([9.94, 20.06])("detects an outside seek at %s", (timeSeconds) => {
    expect(isOutsidePlaybackRange(timeSeconds, range)).toBe(true);
  });

  it.each([9.95, 10, 20, 20.05])(
    "keeps an in-range seek active at %s",
    (timeSeconds) => {
      expect(isOutsidePlaybackRange(timeSeconds, range)).toBe(false);
    }
  );
});

describe("rangeReachesMediaEnd", () => {
  it("matches a range ending at the media duration", () => {
    expect(rangeReachesMediaEnd({ startSeconds: 10, endSeconds: 30 }, 30)).toBe(
      true
    );
  });

  it("does not match a range ending before the media duration", () => {
    expect(rangeReachesMediaEnd(range, 30)).toBe(false);
  });
});
