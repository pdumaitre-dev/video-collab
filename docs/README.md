# Docs

Current docs:

- `architecture.md`: app structure, Neon/Prisma connectivity, runtime flow, data model, and CI.
- Root `AGENTS.md`: Cursor Cloud bootstrap, sandbox network, smoke-test data prerequisites.
- `storage/vercel-blob.md`: Blob setup, upload flow, playback, and pathname rules.
- `video-player-page/external-playback-controls.md`: play/pause control behavior.
- `video-player-page/loop-selected-range.md`: selected comment and draft range loop behavior.
- `style-reference.md`: UI tokens and layout rules.
- `design-system-figma.md`: capturing the design system page into Figma.

Files to review or remove:

- `../lib/blob-storage.ts`: appears unused.
- `../prisma/seed.ts`: legacy `Video` + `Comment` seed only (Neon adapter); does not seed Blob or smoke fixtures.
- `../app/videos/watch/[filename]/page.tsx`: legacy static-file route, not part of the main UI flow.

