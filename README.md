# Video Collab

Next.js 14 app for annotating videos with time-range comments. Videos live in Vercel Blob. Metadata and comments live in Neon PostgreSQL via Prisma.

## Stack

- Next.js 14 App Router
- React 18 + TypeScript
- Prisma 6 + Neon (`@prisma/adapter-neon`, HTTP transport at runtime)
- Vercel Blob
- Tailwind CSS

## Requirements

- Node.js 24+ (see `.nvmrc`; Vercel deployments use Node 24.x)
- `DATABASE_URL` — Neon PostgreSQL connection string (pooled URL recommended)
- `BLOB_READ_WRITE_TOKEN` — required for Blob upload/list/playback flows
- Optional: `BLOB_ACCESS=private|public` (`private` by default)

## Quickstart

1. Use Node 24 and install dependencies.

```bash
nvm use
npm install
```

`postinstall` runs `prisma generate` automatically. Use `npm run prisma:generate` if you need to regenerate manually.

2. Set env vars in `.env` (copy from `.env.example`) or inject them in your shell.

```bash
# Neon dashboard → Connection string (pooled)
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
BLOB_READ_WRITE_TOKEN="..."
# optional
BLOB_ACCESS="private"
```

The app runtime uses `@prisma/adapter-neon` in `lib/db.ts`. `DATABASE_URL` must be a Neon URL — a local `localhost:5432` Postgres URL will not work.

3. Apply Prisma migrations (on a machine with normal Postgres wire access to Neon).

```bash
npx prisma migrate deploy
```

4. Start the app.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Main Flows

- `/` and `/videos` list video files from the Blob `videos/` prefix.
- `/videos/upload` uploads a video into Blob and creates a `Video` record with a `publicId`.
- `/videos/[videoId]` resolves either a stored `publicId` or a raw pathname and opens the annotation UI.
- Comments for Blob videos are stored in the `Comment_blob` table, keyed by Blob pathname.

## Notes

- Public Blob mode uses direct Blob URLs for playback.
- Private Blob mode streams through `/api/blob/stream`; the client preloads the file into a blob URL so seeking still works.
- The older static-file sample flow under `public/videos/` is legacy/manual-test material, not the primary product path.
- Cursor Cloud agents: follow the ordered bootstrap in `AGENTS.md` (Node 24, env, sandbox network, smoke-test data assumptions).

## Docs

- `docs/architecture.md` — structure, data model, Neon/Prisma connectivity
- `docs/storage/vercel-blob.md` — Blob setup and playback
- `docs/video-player-page/external-playback-controls.md`
- `AGENTS.md` — agent/cloud setup and gotchas
