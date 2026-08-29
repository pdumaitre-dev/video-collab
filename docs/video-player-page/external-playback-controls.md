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
- `onEnded` => `isPlaying = false`, unless a comment range is selected (see below)

## Range preview loop

While a time range is selected for a new comment (`selectedRange` in `VideoPageShell`):

- **Playing:** `onTimeUpdate` keeps playback inside `[startSeconds, endSeconds)` and seeks back to `startSeconds` at the range end.
- **Paused:** Selection stays active; the playhead can be scrubbed anywhere. Play clamps into the range and resumes looping.
- **Clears when:** the comment is submitted, another range is selected, or `selectedRange` is cleared.

Play/pause state is not forced on range selection — a paused video stays paused until the user presses play.
