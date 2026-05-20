import assert from "node:assert/strict";
import {
  formatTime,
  getDisplayRange,
  getSelectionStyle
} from "./time-bar-utils";

function main() {
  assert.equal(formatTime(-1), "0:00");
  assert.equal(formatTime(Number.NaN), "0:00");
  assert.equal(formatTime(65.9), "1:05");
  assert.equal(formatTime(600), "10:00");

  assert.equal(
    getDisplayRange({
      durationSeconds: 0,
      selection: { dragStartSeconds: 2, dragEndSeconds: 8 },
      selectedRange: { startSeconds: 20, endSeconds: 40 }
    }),
    null
  );

  assert.deepEqual(
    getDisplayRange({
      durationSeconds: 120,
      selection: null,
      selectedRange: { startSeconds: 30, endSeconds: 45 }
    }),
    { startSeconds: 30, endSeconds: 45 }
  );

  assert.deepEqual(
    getDisplayRange({
      durationSeconds: 120,
      selection: null,
      selectedRange: { startSeconds: -5, endSeconds: 150 }
    }),
    { startSeconds: 0, endSeconds: 120 }
  );

  assert.deepEqual(
    getDisplayRange({
      durationSeconds: 120,
      selection: { dragStartSeconds: 90, dragEndSeconds: 15 },
      selectedRange: { startSeconds: 30, endSeconds: 45 }
    }),
    { startSeconds: 15, endSeconds: 90 }
  );

  assert.deepEqual(
    getDisplayRange({
      durationSeconds: 120,
      selection: { dragStartSeconds: -20, dragEndSeconds: 130 },
      selectedRange: null
    }),
    { startSeconds: 0, endSeconds: 120 }
  );

  assert.deepEqual(
    getSelectionStyle({ startSeconds: 30, endSeconds: 90 }, 120),
    { left: "25%", width: "50%" }
  );
  assert.equal(getSelectionStyle(null, 120), null);
  assert.equal(getSelectionStyle({ startSeconds: 30, endSeconds: 90 }, 0), null);

  console.log("time bar utils tests ok");
}

main();
