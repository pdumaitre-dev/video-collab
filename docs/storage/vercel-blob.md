# Vercel Blob

Videos are stored in Vercel Blob under the `videos/` prefix. The database stores metadata and comments, not the video bytes.

## Required Env

- `BLOB_READ_WRITE_TOKEN`
- Optional: `BLOB_ACCESS=private|public`

## Path Rules

- Upload path format: `videos/<sanitized-filename>`
- Allowed extensions in the app: `.mp4`, `.mov`, `.webm`
- Uploads do not add a random Blob suffix

## Runtime Flow

### Listing

- `lib/blob.ts` lists blobs with the `videos/` prefix.
- `/` and `/videos` show those results.
- If a Blob pathname also has a `Video` row, the UI uses its `publicId` and saved display name.

### Upload

- `POST /api/blob/upload`
- Validates file type and size.
- Uploads the file to Blob.
- Creates a `Video` row with:
  - `publicId`
  - `name`
  - `pathname`
  - `sourceUrl`

### Playback

- Public mode: use the direct Blob URL.
- Private mode: use `GET /api/blob/stream?pathname=...`.
- `app/videos/[videoId]/page.tsx` resolves either a stored `publicId` or a raw pathname.

### Comments

- `GET /api/blob/comments?pathname=...`
- `POST /api/blob/comments`
- `DELETE /api/blob/comments` with `{ id, pathname }`
- Comments are stored in `Comment_blob`, keyed by Blob pathname.

## Private Playback Tradeoff

The private stream route does not support Range requests. To preserve seeking, `components/VideoPlayer.tsx` downloads the whole file, creates a blob URL, and plays from that local URL.

- Upside: seeking and range selection work.
- Downside: playback waits for a full download and uses more memory.

Use `BLOB_ACCESS=public` if direct Blob URLs are acceptable.

## Key Files

- `lib/blob.ts`
- `lib/video-upload.ts`
- `app/api/blob/upload/route.ts`
- `app/api/blob/stream/route.ts`
- `app/api/blob/comments/route.ts`
- `components/VideoPlayer.tsx`
