# Named Timeline Chapters

Chapters are named point bookmarks on Blob-backed videos. They help reviewers jump to known sections such as "Adagio", "Solo", or "Coda" without scrubbing.

## Data

- `Chapter_blob` stores chapters by Blob `pathname`.
- Fields: `label`, `seconds`, optional hex `color`, timestamps.
- `POST /api/blob/chapters` accepts `durationSeconds` when the client knows it. The route validates chapter position against that duration and updates `Video.durationSeconds` for the pathname.

## UI

- `ChapterForm` adds a chapter at the current playhead time.
- `TimeBar` renders chapter ticks above saved green comment ranges.
- `ChapterList` is stacked above comments in the right panel. Clicking a chapter seeks the video to its timestamp.

## API

- `GET /api/blob/chapters?pathname=videos/example.mp4`
- `POST /api/blob/chapters`
- `PATCH /api/blob/chapters?id=<chapterId>`
- `DELETE /api/blob/chapters?id=<chapterId>`

All writes validate the Blob pathname or existing chapter, label length, non-negative seconds, optional duration bounds, and optional hex color.
