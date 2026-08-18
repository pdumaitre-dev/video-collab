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
- `onEnded` => `isPlaying = false`, unless a loop range is active (see below)

## Loop range

When **Loop range** is on and a comment or draft range is selected, `VideoPageShell` wraps `currentTime` back to `startSeconds` on `timeupdate`. That wrap is a programmatic seek and does **not** go through the play/pause button.

- Pause still comes from the video `pause` event; looping does not advance while paused.
- Intra-range wraps must not fire `onEnded`. If the native `ended` event fires because the range includes the file end, the shell seeks to `startSeconds` and calls `play()` instead of clearing `isPlaying`.
- Timeline click-seeks clear the loop target. Drag-seeks during range selection do not.

See `loop-selected-range.md`.
