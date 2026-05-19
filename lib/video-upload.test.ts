import assert from "node:assert/strict";
import {
  buildVideoBlobPath,
  formatBytes,
  getMaxVideoFileSizeBytes,
  normalizeVideoName,
  validateVideoFile
} from "./video-upload";

assert.equal(validateVideoFile({ name: "clip.mp4", size: 100, type: "video/mp4" }), null);
assert.equal(validateVideoFile({ name: "clip.MOV", size: 100, type: "video/quicktime" }), null);

assert.equal(
  validateVideoFile({ name: "clip.exe", size: 100, type: "video/mp4" }),
  "Choose an .mp4, .mov, or .webm video."
);
assert.equal(
  validateVideoFile({ name: "clip.mp4", size: 100, type: "application/octet-stream" }),
  "The selected file does not look like a video."
);
assert.equal(
  validateVideoFile({ name: "clip.webm", size: 0, type: "video/webm" }),
  "The selected file is empty."
);
assert.equal(
  validateVideoFile({
    name: "clip.mp4",
    size: getMaxVideoFileSizeBytes() + 1,
    type: "video/mp4"
  }),
  "The selected file exceeds the 500.0 MB limit."
);

assert.equal(
  buildVideoBlobPath("videos/My Ballet: Take 1!.mp4"),
  "videos/My-Ballet-Take-1-.mp4"
);
assert.equal(buildVideoBlobPath("   "), "videos/upload.mp4");

assert.equal(normalizeVideoName("  Rehearsal review  ", "fallback.mp4"), "Rehearsal review");
assert.equal(normalizeVideoName("   ", "fallback.mp4"), "fallback");

assert.equal(formatBytes(1024), "1.0 KB");
assert.equal(formatBytes(-1), "0 B");

console.log("video-upload tests ok");
