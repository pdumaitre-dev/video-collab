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

## Range Looping

`VideoPageShell` owns loop playback for selected ranges. When **Loop range** is enabled in the comments panel:

- Selecting a comment seeks to `startSeconds` and loops playback back to `startSeconds` whenever `currentTime >= endSeconds`.
- Selecting a draft range on the timebar uses that range for looping until the comment is saved or another range/comment/seek replaces it.
- Clicking the timebar to seek or pausing playback clears the active range loop.

This is client-only behavior; comments, videos, APIs, and schema are unchanged.
