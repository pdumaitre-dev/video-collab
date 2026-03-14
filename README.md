# Video Collab

Next.js 14 app for annotating videos with time-range comments. Videos live in Vercel Blob. Metadata and comments live in PostgreSQL via Prisma.

## Stack

- Next.js 14 App Router
- React 18 + TypeScript
- Prisma + PostgreSQL
- Vercel Blob
- Tailwind CSS

## Requirements

- Node.js 24+
- `DATABASE_URL`
- `BLOB_READ_WRITE_TOKEN`
- Optional: `BLOB_ACCESS=private|public` (`private` by default)

## Quickstart

1. Install dependencies.

```bash
npm install
```

2. Set env vars.

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"
BLOB_READ_WRITE_TOKEN="..."
# optional
BLOB_ACCESS="private"
```

3. Apply Prisma migrations and generate the client.

```bash
npx prisma migrate deploy
npx prisma generate
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

## Docs

- `docs/architecture.md`
- `docs/storage/vercel-blob.md`
- `docs/video-player-page/external-playback-controls.md`

