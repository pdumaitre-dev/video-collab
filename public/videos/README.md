# Static Test Videos

These files are legacy/manual-test assets for the static route under `/videos/watch/[filename]`.

They are not part of the main Blob-backed flow exposed by `/`, `/videos`, or `/videos/upload`.

Notes:

- Keep only if the static route is still useful for manual testing.
- `prisma/seed.ts` still points at an older `sample.mp4` path and does not match the current files here.
