import { head, list } from "@vercel/blob";

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".m4v"];

export type VideoBlob = {
  pathname: string;
  url: string;
  contentType: string;
  title: string;
};

function getFilename(pathname: string): string {
  const segments = pathname.split("/");
  return segments[segments.length - 1] ?? pathname;
}

export function formatVideoTitle(pathname: string): string {
  return decodeURIComponent(getFilename(pathname));
}

export function decodeVideoId(videoId: string): string | null {
  try {
    return decodeURIComponent(videoId);
  } catch {
    return null;
  }
}

export function encodeVideoId(pathname: string): string {
  return encodeURIComponent(pathname);
}

function isVideoBlob(pathname: string, contentType?: string): boolean {
  if (contentType?.startsWith("video/")) {
    return true;
  }

  const lowercasePath = pathname.toLowerCase();
  return VIDEO_EXTENSIONS.some((extension) => lowercasePath.endsWith(extension));
}

export async function listVideoBlobs(): Promise<VideoBlob[]> {
  const { blobs } = await list({
    limit: 1000
  });

  return blobs
    .filter((blob) => isVideoBlob(blob.pathname))
    .map((blob) => ({
      pathname: blob.pathname,
      url: blob.url,
      contentType: "video/*",
      title: formatVideoTitle(blob.pathname)
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function getVideoBlob(pathname: string): Promise<VideoBlob | null> {
  try {
    const blob = await head(pathname);
    if (!isVideoBlob(blob.pathname, blob.contentType)) {
      return null;
    }

    return {
      pathname: blob.pathname,
      url: blob.url,
      contentType: blob.contentType ?? "video/mp4",
      title: formatVideoTitle(blob.pathname)
    };
  } catch {
    return null;
  }
}
