# External Playback Controls

Playback on the video page is controlled by an external play/pause button in `app/videos/[videoId]/VideoPageShell.tsx`.

## Rules

- The button calls `video.play()` or `video.pause()` through `videoRef`.
- UI state stays event-driven.
- The video element is the source of truth.
- Range looping is owned by `VideoPageShell`: when the comment panel `Loop range` toggle is on, selecting a saved comment or draft range activates a loop that seeks back to `startSeconds` once `timeupdate` reaches `endSeconds`.
- Pausing playback, saving/dismissing a draft range, deleting the selected comment, or seeking elsewhere clears the active loop.

## Event Contract

`VideoPlayer` exposes playback lifecycle callbacks:

- `onPlay`
- `onPause`
- `onEnded`

`VideoPageShell` maps them to `isPlaying`.

## Why

- `video.play()` can reject.
- Event-driven state avoids UI drift.
- `onEnded` resets the button state without extra logic.

## State Mapping

- `onPlay` => `isPlaying = true`
- `onPause` => `isPlaying = false`
- `onEnded` => `isPlaying = false`

## Range Looping

- Default: enabled.
- Saved comments: selecting a comment seeks to `startSeconds` and arms the selected range.
- Draft comments: selecting a timeline range seeks to `startSeconds` and arms that range until the draft is saved, dismissed, replaced, or deselected.
- Toggle off: selection still works, but playback only seeks once.
