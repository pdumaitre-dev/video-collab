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
- `onEnded` => `isPlaying = false`

## Loop Range

`VideoPageShell` owns selected-range looping. When **Loop range** is enabled, the active range is:

- the selected comment range, after clicking a comment, or
- the draft range selected on the time bar while adding a comment.

`onTimeUpdate` keeps playback inside the active range by seeking back to `startSeconds` once `currentTime >= endSeconds`. Saving a draft comment clears the draft range. Direct time-bar seeks clear the active comment/draft selection; drag preview seeks do not, and loop enforcement is suspended while a range drag is in progress.
