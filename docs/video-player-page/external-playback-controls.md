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

## Loop Selected Range

`VideoPageShell` loops playback within the currently active range (comment click, or a range selected while drafting a comment).

- **Active range** (`activeLoopRange`, memoized): an in-progress `selectedRange` takes priority; otherwise the `selectedComment`'s range. Selecting a range and selecting a comment are mutually exclusive — each handler clears the other.
- **Loop mechanism**: `handleTimeUpdate` (wired to `VideoPlayer` `onTimeUpdate`) seeks back to `startSeconds` once `currentTime >= endSeconds`. No API or schema changes.
- **Comment click**: seeks to `startSeconds` and starts playback so the loop is immediately visible.
- **Toggle**: a "Loop range" switch in the comments panel header controls `loopEnabled` (default on). When off, `handleTimeUpdate` only tracks time.
- **Stops when**: the range/comment is dismissed (new range selected, comment deselected, or comment submitted → `selectedRange` cleared) or the toggle is turned off. Pausing halts the loop naturally.
