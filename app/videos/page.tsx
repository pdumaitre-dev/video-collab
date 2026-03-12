import Link from "next/link";
import {
  listVideoBlobs,
  type BlobVideo
} from "@/lib/blob";
import { prisma } from "@/lib/db";

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
        <h2 className="text-lg font-semibold">Pick a video</h2>
        <Link
          href="/videos/upload"
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          Upload a video →
        </Link>
      </div>
      {videos.length === 0 ? (
        <p className="text-sm text-slate-400">
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
                className="rounded-md border border-slate-800 bg-slate-900/60 p-3 transition-colors hover:border-slate-500 hover:bg-slate-900/80"
              >
                <Link
                  href={`/videos/${videoId}`}
                  className="flex items-center gap-2"
                >
                  <span className="font-medium">{displayName}</span>
                  <span className="text-xs text-slate-500">
                    ({video.filename.split(".").pop()?.toUpperCase()})
                  </span>
                  {video.size != null && (
                    <span className="text-xs text-slate-500">
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
