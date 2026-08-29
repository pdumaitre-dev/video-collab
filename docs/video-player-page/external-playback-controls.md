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

## Range Looping

- `VideoPageShell` owns selected-range looping for comments and draft comment ranges.
- The comments panel shows a `Loop range` switch; it defaults on.
- Clicking a saved comment seeks to `startSeconds` and loops back there when playback reaches `endSeconds`.
- Drag-selecting a draft range loops that range until the comment is saved or another seek/selection clears it.
- Plain timebar clicks clear the active loop selection; drag preview seeks do not.
- Looping is client-only. No API or schema changes are required.
