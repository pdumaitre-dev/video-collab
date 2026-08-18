# Loop Selected Range

When **Loop range** is enabled and a comment or draft range is selected, playback repeats between `startSeconds` and `endSeconds` until the selection is cleared or the toggle is turned off.

## Active range

Resolved in `VideoPageShell` (priority order):

1. **Draft range** — dragging a range on `TimeBar` clears the selected comment and loops that yellow selection until submit, another range, or a timeline click.
2. **Selected comment** — clicking a comment in `CommentList` seeks to `startSeconds`, clears any draft range, and starts playback when the toggle is on.

Clicking the same comment again deselects it and stops looping. A timeline **click** (not a range drag) clears both the draft range and the selected comment.

## Loop logic

`VideoPageShell` handles `timeupdate` from `VideoPlayer`. While playing, when `currentTime >= endSeconds - 0.05s`, `currentTime` snaps back to `startSeconds`. Native `ended` also wraps when the active range includes the video end. Wrap is suspended while a TimeBar range drag is in progress so the playhead can follow the cursor.

Pause (`video.pause()` via the play/pause button) stops advancement. The toggle stays armed so resume continues looping.

## Toggle

The **Loop range** checkbox sits in the comments panel header. It is disabled until a loop target exists, and defaults back to on when the target changes. When off, comment click only seeks once (previous behavior). When on, the panel shows `Repeating m:ss – m:ss`.

## Key files

- `app/videos/[videoId]/VideoPageShell.tsx` — loop state, `timeupdate` wrap, toggle UI
- `components/TimeBar.tsx` — click vs drag seek source; click clears selection
- `components/CommentList.tsx` — comment click triggers selection via `onSelect`
