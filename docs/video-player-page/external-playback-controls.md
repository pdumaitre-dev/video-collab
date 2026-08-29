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
- `onTimeUpdate`

`VideoPageShell` maps them to `isPlaying`.

## Why

- `video.play()` can reject.
- Event-driven state avoids UI drift.
- `onEnded` resets the button state without extra logic.

## State Mapping

- `onPlay` => `isPlaying = true`
- `onPause` => `isPlaying = false`
- `onEnded` => `isPlaying = false`

## Selected Range Looping

`VideoPageShell` owns the loop target and toggle state.

- Active loop range priority: draft `selectedRange`, then selected comment range.
- Selecting a comment seeks to `startSeconds` and starts playback.
- `onTimeUpdate` resets playback to `startSeconds` when loop mode is enabled and `currentTime >= endSeconds`.
- The comments panel exposes a `Loop range` toggle; turning it off keeps normal playback while preserving selection state.
- Saving a comment clears draft range looping. Deleting the selected comment clears comment-based looping.
