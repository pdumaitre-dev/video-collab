# Loop Selected Range (PDDS-2)

When a comment is selected on the video page, playback can repeat between that comment's `startSeconds` and `endSeconds`.

## UI

- **Loop range** checkbox in the comments panel header (`VideoPageShell`).
- When enabled and a comment is selected, a mono timestamp line shows the active repeat window.

## Behavior

1. Click a comment in `CommentList` → seek to `startSeconds`, clear any in-progress time-bar selection, and start playback when loop is enabled.
2. Click the same comment again → deselect it and stop looping for that comment.
3. On each `timeupdate`, if loop is enabled, playback is active, and `currentTime >= endSeconds`, seek back to `startSeconds`.
4. A small epsilon (`0.05s`) before `endSeconds` avoids missing the loop boundary on sparse `timeupdate` events.

## Files

- `app/videos/[videoId]/VideoPageShell.tsx` — loop state, `timeupdate` handler, toggle, comment-select wiring.
- `components/CommentList.tsx` — comment click → `onSelect` (unchanged contract).

No API or schema changes.
