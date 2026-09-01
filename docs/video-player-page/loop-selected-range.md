# Loop Selected Range

When a comment or draft timeline range is selected, playback can loop between `startSeconds` and `endSeconds`. Client-only; no API or schema change is required for the loop itself.

## Active target

- Draft `selectedRange` wins over a selected comment.
- No target ⇒ no looping and the **Loop range** toggle is hidden.

## Engine

`VideoPageShell` wraps on `timeupdate`. If loop is enabled and `currentTime >= endSeconds - 0.05s`, it seeks back to `startSeconds`. Pause does not disarm the toggle.

## Toggle

Comment panel header: **Loop range** (default on when the target changes). Off keeps the selection but stops wrapping.

## Stop / rebind

- Re-click a comment to deselect.
- Timeline **click** clears the target (and therefore the loop). Drag-select does not; it becomes the new draft target.
- Saving a comment clears the draft range.
- Deleting the selected comment clears that target.

## Selection behavior

- Comment click: seek to start and attempt auto-play.
- Draft range: keep the drag-end playhead (smoke-test compatible); do not auto-play.

## Key files

- `app/videos/[videoId]/VideoPageShell.tsx`
- `components/TimeBar.tsx` (`onSeek` source: `click` | `drag`)
- `components/CommentList.tsx`
