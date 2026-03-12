import Link from "next/link";
import { listVideoBlobs, type BlobVideo } from "@/lib/blob";

export default async function HomePage() {
  let videos: BlobVideo[];
  try {
    videos = await listVideoBlobs();
  } catch (error) {
    console.error("Error listing video blobs", error);
    videos = [];
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Videos</h2>
        <Link
          href="/videos"
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          Browse Blob storage →
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
            const videoId = encodeURIComponent(video.pathname);
            return (
              <li
                key={video.pathname}
                className="rounded-md border border-slate-800 bg-slate-900/60 p-3 hover:border-slate-500"
              >
                <Link
                  href={`/videos/${videoId}`}
                  className="flex flex-col gap-1"
                >
                  <span className="font-medium">{video.filename}</span>
                  {video.size != null && (
                    <span className="text-xs text-slate-400">
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
