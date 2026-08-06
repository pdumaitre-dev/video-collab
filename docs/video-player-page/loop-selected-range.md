# Loop Selected Range

The video page loops either a selected comment range or an unsaved timeline range. Looping is client-only and does not change stored comments.

## Behavior

- Selecting a comment seeks to its start, enables **Loop range**, and starts playback.
- Dragging a new timeline range replaces the selected comment, enables looping, and preserves the drag-end preview position until playback wraps.
- Playback wraps to `startSeconds` when it reaches `endSeconds`, including ranges that end at the media duration.
- Re-clicking the selected comment, pausing, saving the draft comment, or deleting the selected comment disables looping.
- Turning **Loop range** off keeps the active selection. Turning it back on resumes playback and seeks to the range start only when the playhead is outside the range.
- Clicking within the active range keeps looping. Clicking outside it disables looping without clearing the selection.

## Implementation

`app/videos/[videoId]/VideoPageShell.tsx` owns the active range and playback state. `components/TimeBar.tsx` reports click, drag, and drag lifecycle events so range wrapping cannot interfere with timeline interaction.

Boundary decisions live in `lib/range-loop.ts` and use a 50 ms end tolerance.
