# External Playback Controls

Playback on the video page is controlled by an external play/pause button in `app/videos/[videoId]/VideoPageShell.tsx`.

## Rules

- The button calls `video.play()` or `video.pause()` through `videoRef`.
- UI state stays event-driven.
- The video element is the source of truth.

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
- `onEnded` => `isPlaying = false` (unless a comment range is selected; see below)

## Range preview loop

While a yellow selection range is active on `TimeBar` (until submit or a new range replaces it):

- If playback is running, `VideoPageShell` rewinds to `startSeconds` when time reaches `endSeconds` (and if play drifts before `startSeconds`).
- If the video was paused when the range was selected, it stays paused; play/pause still toggles only playback, not the selection.
- Resuming play with the play button snaps to `startSeconds` when the playhead is outside the range, then loops.
- Pausing during the loop keeps the selection; play resumes the loop from the paused position (still within the range).
- Submitting a comment clears `selectedRange` and stops looping.
