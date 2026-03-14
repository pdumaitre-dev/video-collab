# Docs

Current docs:

- `architecture.md`: app structure, runtime flow, and data model.
- `storage/vercel-blob.md`: Blob setup, upload flow, playback, and pathname rules.
- `video-player-page/external-playback-controls.md`: play/pause control behavior.
- `style-reference.md`: UI tokens and layout rules.

Files to review or remove:

- `../lib/blob-storage.ts`: appears unused.
- `../prisma/seed.ts`: still documents/seeds the older static sample flow.
- `../app/videos/watch/[filename]/page.tsx`: legacy static-file route, not part of the main UI flow.

