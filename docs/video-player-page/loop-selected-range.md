# Loop Selected Range

The video page can loop the active comment or draft selection range from the comments panel.

## Rules

- **Loop range** defaults on in the comments panel.
- Clicking a comment seeks to `startSeconds`, starts playback, and loops until the selection is cleared or the toggle is turned off.
- Clicking the selected comment again clears it.
- Clicking the timeline clears the selected comment or draft range.
- Dragging a draft range takes precedence over a selected comment and loops the draft range until submit or clear.
- Turning **Loop range** off preserves seek-only behavior.

## Implementation

`app/videos/[videoId]/VideoPageShell.tsx` derives the active loop range from the draft range first, then the selected comment. On `timeupdate`, if playback reaches `endSeconds`, it snaps the video back to `startSeconds`.

`components/TimeBar.tsx` reports whether a seek came from a timeline click or drag so the shell can clear selection on clicks without clearing a newly dragged range.
