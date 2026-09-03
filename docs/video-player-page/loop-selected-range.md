# Loop Selected Range

When a comment or draft time range is selected, playback can repeat between `startSeconds` and `endSeconds` until the selection is cleared or **Loop range** is turned off.

Logic lives in `app/videos/[videoId]/VideoPageShell.tsx` (shared by `/videos/[videoId]` and the legacy `FileVideoPageShell` watch path). No API or schema changes.

## Active target

Draft `selectedRange` wins over a selected comment. If neither is set, there is no loop target and the toggle is hidden.

## Toggle

**Loop range** sits in the comments panel header.

- Shown only when a loop target exists.
- Defaults **on** whenever the target changes (new comment, new draft range, or re-select).
- Off: selection stays; playback does not wrap.
- Accessible name: `Loop selected range`.
- When on, helper text shows `Repeating {start} – {end}`.

## Playback

- **Comment click:** seek to `startSeconds` and call `video.play()`. Re-clicking the same comment deselects it and stops looping.
- **Draft range:** keep the drag-end playhead (smoke-test compatible). Looping starts when the user presses play.
- **`timeupdate`:** if loop is armed, playing, and `currentTime >= endSeconds - 0.05`, snap to `startSeconds`.
- **`ended`:** if the range runs to EOF, wrap and play again instead of stopping.
- **Pause:** stops playback only; the toggle stays armed for resume.
- Clicking a comment while a draft range exists clears the draft so the comment becomes the loop target.

## Timeline

`TimeBar` reports seek source:

- **`click`:** clear draft range and selected comment (loop target gone), then seek.
- **`drag`:** live scrub only; does not clear the target.
- Completing a range drag suppresses the trailing `click` so the new draft range is not immediately cleared.
- Live drag seeks do not wrap the playhead; wrap is paused until mouseup.

## Stop conditions

Looping stops (or rebinds) when:

- **Loop range** is off
- The draft range is saved or cleared
- The selected comment is deleted or deselected
- A timeline **click** (not a drag-select) clears the target
- A different comment or draft range is selected (new target; toggle resets on)
