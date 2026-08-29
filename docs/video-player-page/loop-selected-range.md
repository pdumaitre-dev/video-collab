# Loop Selected Range

`VideoPageShell.tsx` loops playback over the active range (a selected comment, or an in-progress drag selection) so users can repeat a short clip without manually re-seeking. No API or schema changes.

## Behavior

- Selecting a comment in `CommentList.tsx` seeks to `startSeconds` and loops back there every time playback reaches `endSeconds`, while the comment stays selected.
- Selecting a new range on the time bar (drafting a comment) loops the same way until the comment is submitted (via `CommentForm.tsx`) or a different range/comment is selected.
- Selecting a comment or a new range clears the other (only one active range loops at a time).
- Clicking an already-selected comment deselects it, stopping the loop.
- A "Loop range" checkbox in the comments panel (`VideoPageShell.tsx`) toggles the behavior on/off; default on.

## Implementation

- `activeLoopRange` (`useMemo` in `VideoPageShell.tsx`): the draft `selectedRange` if present, otherwise the selected comment's range.
- `handleTimeUpdate`: wraps the `onTimeUpdate` callback from `VideoPlayer`; when `currentTime >= activeLoopRange.endSeconds` and looping is enabled, snaps `videoRef.current.currentTime` back to `activeLoopRange.startSeconds`.
- Does not modify `VideoPlayer.tsx` or `TimeBar.tsx` (both out of scope per `style-reference.md`).
