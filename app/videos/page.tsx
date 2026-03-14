import Link from "next/link";
import {
  listVideoBlobs,
  type BlobVideo
} from "@/lib/blob";
import { prisma } from "@/lib/db";
import NavButton from "@/components/ui/NavButton";

export const dynamic = "force-dynamic";

export default async function VideosPickerPage() {
  let videos: BlobVideo[];
  let storedVideoMap = new Map<string, { publicId: string; name: string }>();
  try {
    videos = await listVideoBlobs();

    const storedVideos = await prisma.video.findMany({
      where: {
        pathname: {
          in: videos.map((video) => video.pathname)
        }
      },
      select: {
        pathname: true,
        publicId: true,
        name: true
      }
    });

    storedVideoMap = new Map(
      storedVideos
        .filter(
          (
            video
          ): video is { pathname: string; publicId: string; name: string } =>
            video.pathname != null
        )
        .map((video) => [
          video.pathname,
          { publicId: video.publicId, name: video.name }
        ])
    );
  } catch (error) {
    console.error("Error listing video blobs", error);
    videos = [];
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-lg font-semibold text-fg-primary">
          Pick a video
        </h2>
        <NavButton href="/videos/upload" variant="primary">
          Upload video
          <svg
            aria-hidden
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </NavButton>
      </div>
      {videos.length === 0 ? (
        <p className="text-sm text-fg-secondary">
          No videos found in Vercel Blob storage. Upload .mp4, .mov, or .webm
          files to the &quot;videos/&quot; prefix in your Blob store to get
          started.
        </p>
      ) : (
        <ul className="space-y-2">
          {videos.map((video) => {
            const storedVideo = storedVideoMap.get(video.pathname);
            const videoId = storedVideo?.publicId ?? encodeURIComponent(video.pathname);
            const displayName = storedVideo?.name ?? video.filename;

            return (
              <li
                key={video.pathname}
                className="rounded-lg border border-white/[0.08] bg-surface-card p-4 transition-colors hover:border-white/[0.12] hover:bg-surface-elevated"
              >
                <Link
                  href={`/videos/${videoId}`}
                  className="flex items-center gap-2 no-underline"
                >
                  <span className="font-medium text-fg-primary">{displayName}</span>
                  <span className="text-xs text-fg-muted">
                    ({video.filename.split(".").pop()?.toUpperCase()})
                  </span>
                  {video.size != null && (
                    <span className="text-xs text-fg-muted">
                      ({(video.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
