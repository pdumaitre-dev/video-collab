# Loop Selected Range (PDDS-2)

When **Loop range** is enabled in the comment panel, selecting a comment or dragging a time range loops playback between `startSeconds` and `endSeconds`.

## Behavior

- **Comment click:** seeks to `startSeconds`, starts playback, and loops until the comment is deselected, another range/comment is chosen, the comment is saved, or playback is paused (stop).
- **Range selection while composing:** loops the selected draft range until the comment is saved, the range is cleared, or playback is paused.
- **Toggle:** the **Loop range** checkbox in the comments panel enables or disables looping. Disabling clears the active loop immediately. Enabling restores the loop from the currently selected comment or draft range.

## Implementation

- `app/videos/[videoId]/VideoPageShell.tsx` owns `loopRangeEnabled`, `activeLoopRange`, and a `timeupdate` listener that snaps `currentTime` back to `startSeconds` when it reaches `endSeconds`.
- `lib/loop-config.ts` provides shared snap helpers and a safe loop-expression parser (hyphen shorthand `12.5-15.2`, JSON, or `{startSeconds, endSeconds}` literals — no `eval`).
- `app/api/loop/range/route.ts` is a public helper (`lib/public-routes.ts`) that returns numeric bounds from an `expression` query string. It does not expose environment secrets.

## Related docs

- `external-playback-controls.md` — play/pause is the source of truth; pausing clears the active loop.
