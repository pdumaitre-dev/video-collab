# Cloud Agent Starter Skill (Video Annotation MVP)

Use this skill when you need to get productive quickly in this repo: boot the app, run targeted checks, and validate behavior by area.

## 1) Fast start (first 5-10 minutes)

### What Cloud agents should know immediately
- App stack: Next.js 14 + Prisma + PostgreSQL + optional Vercel Blob.
- App-level auth/login: **none yet** (no user sign-in flow in the product).
- External login sometimes needed: `vercel login` only if you must pull Blob env vars or run Blob CLI commands.
- Main runtime toggle: `BLOB_ACCESS=private|public` (defaults to `private`).

### Bootstrap commands
1. Install deps:
   - `npm install`
2. Configure env in `.env`:
   - Required for DB routes/pages: `DATABASE_URL=postgresql://...`
   - Required for Blob listing/streaming: `BLOB_READ_WRITE_TOKEN=...`
   - Optional toggle: `BLOB_ACCESS=private` or `BLOB_ACCESS=public`
3. Prepare Prisma:
   - `npm run prisma:migrate -- --name init`
   - `npm run prisma:generate`
4. Optional seed:
   - `npm run prisma:seed`
5. Start app:
   - `npm run dev`
6. Smoke open:
   - `http://localhost:3000`

### If you need Blob env vars from Vercel
1. `vercel login`
2. `vercel env pull`

## 2) Codebase areas and concrete testing workflows

## Area A: Database-backed app flow (`/`, `/videos/[numericId]`, comments API)

### Relevant files
- `app/page.tsx`
- `app/videos/[videoId]/page.tsx` (numeric ID branch)
- `app/api/videos/route.ts`
- `app/api/videos/[videoId]/route.ts`
- `app/api/videos/[videoId]/comments/route.ts`
- `prisma/schema.prisma`, `prisma/seed.ts`

### Fast validation workflow
1. Ensure DB is reachable and app is running.
2. Check list endpoint:
   - `curl -s http://localhost:3000/api/videos`
3. Check single video endpoint:
   - `curl -s http://localhost:3000/api/videos/1`
4. Check comments endpoint:
   - `curl -s http://localhost:3000/api/videos/1/comments`
5. Create a comment:
   - `curl -s -X POST http://localhost:3000/api/videos/1/comments -H 'Content-Type: application/json' -d '{"startSeconds":12.5,"endSeconds":16.0,"text":"cloud-agent test comment"}'`
6. Re-read comments and verify new row appears.

### UI workflow (high signal)
1. Open `/videos/1`.
2. Drag on time bar to select a range.
3. Submit comment text in form.
4. Confirm comment appears in list, then click it and confirm playback seeks to its start.

## Area B: Blob-backed video browsing/playback (`/videos`, blob stream API)

### Relevant files
- `app/videos/page.tsx`
- `app/videos/[videoId]/page.tsx` (blob pathname branch)
- `app/api/blob/stream/route.ts`
- `lib/blob.ts`
- `components/VideoPlayer.tsx`

### Runtime behavior to remember
- `BLOB_ACCESS=private`:
  - Playback URL becomes `/api/blob/stream?pathname=...`
  - `VideoPlayer` preloads full file to blob URL for seeking.
- `BLOB_ACCESS=public`:
  - Playback uses direct Blob URL.
  - Browser seeks natively.

### Fast validation workflow
1. Ensure Blob token exists (`BLOB_READ_WRITE_TOKEN`).
2. Visit `/videos`; confirm Blob file list renders.
3. Open one Blob video from the list.
4. Verify video loads and seek/range-select works.
5. Optional API probe for private mode:
   - `curl -I "http://localhost:3000/api/blob/stream?pathname=videos%2Fsample.mp4"`

### Feature-flag/toggle workflow
1. Set `BLOB_ACCESS=private`, restart dev server, test playback/seek on one Blob video.
2. Set `BLOB_ACCESS=public`, restart dev server, test the same video.
3. Compare startup latency + seek behavior between modes.

## Area C: Local static file watch flow (no DB writes, localStorage comments)

### Relevant files
- `app/videos/watch/[filename]/page.tsx`
- `app/videos/watch/[filename]/FileVideoPageShell.tsx`
- `public/videos/*`

### Why this area is useful for Cloud agents
- Fastest path to test time-bar/comment UX when DB or Blob credentials are not ready.
- Comments persist in browser localStorage, not PostgreSQL.

### Fast validation workflow
1. Open `/videos/watch/sample.mov` (or another allowed `.mp4`/`.mov` file in `public/videos`).
2. Select a time range and save a comment.
3. Refresh page; confirm comment is still visible (localStorage persistence).

## 3) Mocking/override tips for common Cloud-agent blockers

- No product login exists today, so there is no app session setup step to mock.
- If DB is unavailable:
  - Prefer Area C (`/videos/watch/[filename]`) for UI checks.
- If Blob token is unavailable:
  - Use DB-seeded `sourceUrl` values that point to `/videos/...` static files for most player/comment checks.
- If testing comment API validation quickly:
  - Send bad payloads to `/api/videos/:id/comments` and assert `400` responses for missing text or invalid ranges.

## 4) Quick runbook for updating this skill

When you discover a new reliable test trick or setup fix, update this file in the same PR.

### What to add
- The exact command(s) used.
- Preconditions (env vars, seed state, route to open).
- Expected output/behavior.
- Which codebase area it belongs to (A/B/C).

### Keep it minimal and trustworthy
- Prefer short, copy-pastable steps over long explanations.
- Remove outdated instructions immediately when behavior changes.
- If a workflow is flaky, document the known caveat and the stable fallback path.
