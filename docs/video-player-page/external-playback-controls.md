# External Playback Controls

Playback on the video page is controlled by an external play/pause button in `app/videos/[videoId]/VideoPageShell.tsx`.

## Rules

- The button calls `video.play()` or `video.pause()` through `videoRef`.
- UI state stays event-driven.
- The video element is the source of truth.
- When a time range is selected, playback loops inside that range until the range is cleared, replaced, or submitted as a comment.
- Selecting a range starts the loop from the range start even if the video was paused.
- Pausing during a selected-range loop keeps the selection active; pressing play resumes the loop.

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

For an active selected-range loop, `onEnded` seeks back to the range start and attempts playback again before falling back to the non-loop ended state.
