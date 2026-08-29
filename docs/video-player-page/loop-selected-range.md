# Loop Selected Range

PDDS-2 adds client-side loop playback for selected annotation ranges.

## Behavior

- Selecting a comment seeks to its `startSeconds`, starts playback, and loops until another range replaces it or looping is disabled.
- A draft range selected on the timebar also becomes the loop target until the comment is saved or another selection replaces it.
- Draft selections take priority over selected comments.
- `Loop range` in the comments panel enables or disables wrapping without clearing the active selection.
- Looping is handled in `VideoPageShell` through `VideoPlayer` `onTimeUpdate`; no API or schema changes are involved.

## Wrap Rule

When loop mode is enabled and the active range is at least `0.1s` long:

```text
if currentTime >= endSeconds:
  currentTime = startSeconds
```

## Key Files

- `app/videos/[videoId]/VideoPageShell.tsx`
- `components/VideoPlayer.tsx`
- `components/CommentList.tsx`
