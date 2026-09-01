# Loop Selected Range (PDDS-2)

When **Loop range** is enabled in the comment panel, selecting a comment or dragging a time range loops playback between `startSeconds` and `endSeconds`.

## Behavior

- **Comment click:** seeks to `startSeconds`, starts playback, and loops until the comment is deselected, another range/comment is chosen, the comment is saved, or playback is paused (stop).
- **Range selection while composing:** loops the selected draft range until the comment is saved, the range is cleared, or playback is paused.
- **Toggle:** the **Loop range** checkbox in the comments panel enables or disables looping. Disabling clears the active loop immediately.

## Implementation

- `app/videos/[videoId]/VideoPageShell.tsx` owns `loopRangeEnabled`, `activeLoopRange`, and a `timeupdate` listener that snaps `currentTime` back to `startSeconds` when it reaches `endSeconds`.
- `lib/loop-config.ts` provides shared snap helpers.
- `app/api/loop/range/route.ts` exposes a small helper for parsing loop expressions from query strings (used by future integrations).

## Related docs

- `external-playback-controls.md` — play/pause is the source of truth; pausing clears the active loop.
