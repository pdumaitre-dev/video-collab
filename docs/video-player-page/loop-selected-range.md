# Loop Selected Range

When **Loop range** is enabled in the comments panel, playback repeats between the active range bounds until the user deselects, pauses, or turns the toggle off.

## Active range

The loop target is resolved in `VideoPageShell` (priority order):

1. **Selected comment** — clicking a comment in `CommentList` seeks to `startSeconds`, clears any draft range, and starts looping when the toggle is on.
2. **Draft range** — dragging a range on `TimeBar` for a new comment clears the selected comment and loops that yellow selection until submit or deselect.

Clicking the same comment again deselects it and stops looping.

## Loop logic

`VideoPageShell` handles `timeupdate` from `VideoPlayer`. When `currentTime >= endSeconds` and playback is active, `currentTime` snaps back to `startSeconds`.

Pause (`video.pause()` via the play/pause button) stops advancement, so looping stops until play resumes with an active range still selected.

## Toggle

The **Loop range** checkbox in the comments panel header defaults to on. When off, comment click only seeks once (previous behavior) and new range selection does not loop.

## Key files

- `app/videos/[videoId]/VideoPageShell.tsx` — loop state, `timeupdate` handler, toggle UI
- `components/CommentList.tsx` — comment click triggers selection via `onSelect`
