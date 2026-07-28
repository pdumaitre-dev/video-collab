# Loop Selected Range (PDDS-2)

Client-only loop playback in `app/videos/[videoId]/VideoPageShell.tsx` for the active comment or draft time range.

## Active loop target

1. Draft `selectedRange` on the timeline (takes precedence).
2. Else the comment row highlighted in `CommentList`.

No target → loop UI hidden.

## Behavior

- When the target changes, playback seeks to `startSeconds`, **Loop range** turns on (default), and `play()` is attempted (browser autoplay rules may leave the player paused).
- On `timeupdate`, when `currentTime >= endSeconds - 0.05`, the player snaps to `startSeconds` and keeps playing.
- **Loop range** off keeps the selection but stops wrapping.
- Pause (external button) turns loop off; resume does not re-arm until the user toggles loop or changes the target.

## Stop / disable loop

- Toggle **Loop range** off.
- External pause.
- Re-click the selected comment (deselect).
- Timeline click seek outside the active range (`TimeBar` passes `source: "click"`).
- Save comment (clears draft range) or delete the selected comment.

## Related files

- `components/TimeBar.tsx` — click vs drag seek; suppresses click-after-drag.
- `components/CommentList.tsx` — selection only; loop logic stays in the shell.
- `docs/video-player-page/external-playback-controls.md` — play/pause contract.
