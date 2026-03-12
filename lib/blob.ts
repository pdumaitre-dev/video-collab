import { list, get, head } from "@vercel/blob";

const BLOB_VIDEO_PREFIX = "videos/";
const BLOB_ACCESS = (process.env.BLOB_ACCESS as "private" | "public") ?? "private";

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm"];

export type BlobVideo = {
  pathname: string;
  url: string;
  filename: string;
  size?: number;
};

/**
 * List video blobs from Vercel Blob storage.
 * Uses the "videos/" prefix to scope video files.
 */
export async function listVideoBlobs(): Promise<BlobVideo[]> {
  const { blobs } = await list({
    prefix: BLOB_VIDEO_PREFIX,
    limit: 1000
  });

  const filtered = blobs.filter(
    (b) =>
      VIDEO_EXTENSIONS.some((ext) =>
        b.pathname.toLowerCase().endsWith(ext)
      )
  );

  return filtered.map((b) => ({
    pathname: b.pathname,
    url: b.url,
    filename: b.pathname.replace(BLOB_VIDEO_PREFIX, "").split("/").pop() ?? b.pathname,
    size: b.size
  }));
}

/**
 * Get blob metadata by pathname.
 * Returns null if the blob does not exist.
 */
export async function getBlobMetadata(pathname: string) {
  try {
    const metadata = await head(pathname);
    return metadata;
  } catch {
    return null;
  }
}

/**
 * Get a readable stream for a blob (used for private blobs).
 * For public blobs, the URL from list() can be used directly.
 * Returns null if the blob is not found.
 */
export async function getBlobStream(pathname: string) {
  return get(pathname, { access: BLOB_ACCESS });
}

/**
 * Build the URL to use for video playback.
 * For private blobs, streams through our API. For public blobs, the direct URL can be used.
 */
export function getVideoPlaybackUrl(blob: BlobVideo): string {
  if (BLOB_ACCESS === "public") {
    return blob.url;
  }
  return `/api/blob/stream?pathname=${encodeURIComponent(blob.pathname)}`;
}
