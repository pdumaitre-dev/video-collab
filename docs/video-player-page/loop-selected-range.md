# Loop Selected Range

When a comment or draft time range is active, playback can loop between `startSeconds` and `endSeconds`.

## Behavior

- **Comment click:** Seeks to the comment start, enables looping, and starts playback. Click the same comment again to deselect and stop looping.
- **Draft range:** Drag-selecting a range on the time bar enables looping until the comment is saved or the range is replaced.
- **Loop snap:** On `timeupdate`, when `currentTime >= endSeconds`, playback snaps back to `startSeconds`.
- **Pause:** Pressing pause (play/pause button) disables looping. Re-enable with the **Loop range** toggle or by selecting a comment/range again.
- **Toggle:** The **Loop range** checkbox in the comments panel header controls looping explicitly. It is disabled when no comment or draft range is selected.

## Key Files

- `app/videos/[videoId]/VideoPageShell.tsx` — loop state, `timeupdate` handler, toggle UI
- `components/CommentList.tsx` — comment selection trigger (`onSelect`)

## No Backend Changes

Looping is client-side only; no API or schema changes.
