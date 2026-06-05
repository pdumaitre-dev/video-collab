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

## Selected Range Looping

- The comments panel exposes a `Loop range` toggle, enabled by default.
- When enabled, selecting a saved comment seeks to `startSeconds` and loops playback back to `startSeconds` once `currentTime >= endSeconds`.
- Selecting a draft range on the timebar uses the same loop behavior while the range remains selected for comment entry.
- Looping stops when the user clicks elsewhere on the timebar, saves the draft comment, deletes the selected comment, or turns the toggle off.
- Pausing playback suspends the loop without clearing the selected range/comment; resuming playback continues the same loop when the toggle remains on.
- No API or schema state is stored for loop preference; it is local to the page session.

## Why

- `video.play()` can reject.
- Event-driven state avoids UI drift.
- `onEnded` resets the button state unless an active selected-range loop restarts playback.

## State Mapping

- `onPlay` => `isPlaying = true`
- `onPause` => `isPlaying = false`
- `onEnded` => `isPlaying = false` when no selected-range loop is active
