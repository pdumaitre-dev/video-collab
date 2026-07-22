# External Playback Controls

Playback on the video page is controlled by an external play/pause button in `app/videos/[videoId]/VideoPageShell.tsx`.

## Rules

- The button calls `video.play()` or `video.pause()` through `videoRef`.
- UI state stays event-driven.
- The video element is the source of truth.
- The "Loop range" toggle applies to the currently selected comment. When enabled, `timeupdate` seeks back to the comment's `startSeconds` after playback reaches `endSeconds`.

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
- Looping stays client-only because comment ranges already contain `startSeconds` and `endSeconds`.

## State Mapping

- `onPlay` => `isPlaying = true`
- `onPause` => `isPlaying = false`
- `onEnded` => `isPlaying = false`
