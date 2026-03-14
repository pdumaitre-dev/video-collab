# Vercel Blob Storage

This application uses [Vercel Blob](https://vercel.com/docs/vercel-blob) for video file storage. Video assets are stored in a Blob store and served through the app, keeping the database focused on metadata and comments.

## Setup

### 1. Create a Blob store

1. Go to your project's [Storage tab](https://vercel.com/d?to=%2F%5Bteam%5D%2F%5Bproject%5D%2Fstores) on Vercel
2. Select **Create Database**, then choose **Blob**
3. Set access to **Private** or **Public** (see [Access levels](#access-levels) below)
4. Choose a name and create the store

### 2. Environment variables

When you create a Blob store, Vercel automatically adds:

- `BLOB_READ_WRITE_TOKEN` – Required for all Blob SDK operations

For local development, pull the token:

```bash
vercel env pull
```

### 3. Optional: Blob access level

Set `BLOB_ACCESS` in `.env` to match your store:

- `private` (default) – Videos are streamed through `/api/blob/stream`
- `public` – Videos use direct Blob URLs for better performance

## How it works

### Video listing (`/videos`)

The `/videos` page lists videos from the Blob store using the `list()` SDK method with the `videos/` prefix. Only files with `.mp4`, `.mov`, or `.webm` extensions are shown.

### Video playback (`/videos/[videoId]`)

The `videoId` is a URL-encoded pathname (e.g. `videos%2Fsample.mp4`). The app fetches the blob and serves it:
- **Private store**: Streams via `GET /api/blob/stream?pathname=...`
- **Public store**: Uses the direct Blob URL

### Video loading and seeking

When videos are served through the API stream (`/api/blob/stream`), the route does not support HTTP Range requests. Without Range support, the browser cannot seek to arbitrary positions—it can only play linearly from the start. This breaks time-range selection: when users drag on the time bar to select a range for a comment, the video preview stays stuck on the first frame.

**Our approach: full fetch → blob URL**

For URLs that point to `/api/blob/stream`, the `VideoPlayer` component fetches the entire video, creates an in-memory blob URL with `URL.createObjectURL()`, and uses that as the video source. Once loaded, the full video is available in memory, so seeking and time-range selection work instantly.

- **Why**: The API stream returns a full response without Range support. Preloading into a blob URL is a client-side workaround that enables seeking without changing the server.
- **When**: Applied only when `src` includes `/api/blob/stream` (private blob playback). Direct URLs (public blobs, static files, CDN) are used as-is and support Range natively.
- **Trade-offs**: The full video must download before playback starts. For large videos, this increases initial load time and memory usage. For public blobs, use `BLOB_ACCESS=public` to avoid this path and get direct CDN URLs with Range support.

| Source | Loading strategy | Seeking |
|--------|------------------|---------|
| `/api/blob/stream` (private) | Full fetch → blob URL | Works after load |
| Direct blob URL (public) | Native | Works immediately |
| Static file, CDN | Native | Works immediately |

### Uploading videos

Upload files to the `videos/` prefix in your Blob store. You can use:

- **Vercel CLI**: `vercel blob upload <file> videos/filename.mp4`
- **SDK**: `put()` from `@vercel/blob` (see [Using the Blob SDK](https://vercel.com/docs/vercel-blob/using-blob-sdk))

Example with the SDK:

```ts
import { put } from "@vercel/blob";

const blob = await put("videos/my-video.mp4", file, {
  access: "private", // or "public"
  addRandomSuffix: false
});
```

## Key files

| File | Purpose |
|------|---------|
| `lib/blob.ts` | Blob helpers: `listVideoBlobs()`, `getBlobStream()`, `getVideoPlaybackUrl()` |
| `app/api/blob/stream/route.ts` | Streams private blobs for video playback |
| `components/VideoPlayer.tsx` | Video element; preloads API stream URLs as blob URLs for seeking support |
| `app/videos/page.tsx` | Lists videos from Blob storage |
| `app/videos/[videoId]/page.tsx` | Serves blob videos from pathname |

## Access levels

- **Private**: Blobs require authentication. The app streams them through `/api/blob/stream`. Use when videos should not be publicly accessible.
- **Public**: Blobs have direct URLs. Better for performance (no server round-trip) and CDN caching. Use when videos can be publicly viewed.

## References

- [Vercel Blob documentation](https://vercel.com/docs/vercel-blob)
- [Using the Blob SDK](https://vercel.com/docs/vercel-blob/using-blob-sdk)
- [Vercel CLI blob commands](https://vercel.com/docs/cli/blob)
