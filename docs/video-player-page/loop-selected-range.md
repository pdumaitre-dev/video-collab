# Loop Selected Range

The video page can repeat the active annotation range without backend changes.

## Behavior

- Selecting a comment seeks to `startSeconds` and enables **Loop range** by default.
- Drag-selecting a draft range on the timeline enables **Loop range** for that draft range.
- Starting a timeline drag suspends the previous active loop until the new range is selected.
- While enabled, `VideoPageShell` listens to `timeupdate`; when playback reaches `endSeconds`, it seeks back to `startSeconds`.
- Draft ranges take precedence over selected comments.
- Looping stops when the user pauses playback, clicks the timeline outside the active selection, re-clicks the selected comment, deletes the selected comment, or saves the draft comment.

## UI

The comments panel shows a **Loop range** toggle. It is disabled until a comment or draft range is selected and displays the range currently being repeated.

## Key files

- `app/videos/[videoId]/VideoPageShell.tsx`: loop state, `timeupdate` wrap, toggle UI, selection dismissal.
- `components/TimeBar.tsx`: reports whether a seek came from a click or drag so plain timeline clicks can dismiss the active range.
