# External Playback Controls

This page documents how playback is controlled on the video page when using an external play/pause button.

## Control Strategy

- External-first playback control.
- Native video play/pause controls are hidden.
- Playback state displayed in UI is driven by media events from the video element.

## Event Contract

`VideoPlayer` exposes playback lifecycle callbacks:

- `onPlay`: fired when media begins playback.
- `onPause`: fired when media is paused.
- `onEnded`: fired when playback reaches the end.

`VideoPageShell` listens to these events and updates local `isPlaying` state.

## Source of Truth

- `HTMLVideoElement` state and events are the source of truth.
- Do not optimistically flip `isPlaying` on button click.
- The external button only invokes `video.play()` / `video.pause()`; resulting events update the UI.

## Error Handling

- `video.play()` returns a promise and can reject due to browser autoplay/user-gesture policies.
- Keep UI state event-driven and log playback errors for diagnostics.

## Coherency Rules

- `onPlay` => `isPlaying = true`
- `onPause` => `isPlaying = false`
- `onEnded` => `isPlaying = false`

This guarantees consistent UI state during normal playback, pause interactions, and end-of-media transitions.
