import Link from "next/link";
import {
  listVideoBlobs,
  getVideoPlaybackUrl,
  type BlobVideo
} from "@/lib/blob";

export default async function VideosPickerPage() {
  let videos: BlobVideo[];
  try {
    videos = await listVideoBlobs();
  } catch (error) {
    console.error("Error listing video blobs", error);
    videos = [];
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Pick a video</h2>
      {videos.length === 0 ? (
        <p className="text-sm text-slate-400">
          No videos found in Vercel Blob storage. Upload .mp4, .mov, or .webm
          files to the &quot;videos/&quot; prefix in your Blob store to get
          started.
        </p>
      ) : (
        <ul className="space-y-2">
          {videos.map((video) => {
            const playbackUrl = getVideoPlaybackUrl(video);
            const videoId = encodeURIComponent(video.pathname);

            return (
              <li
                key={video.pathname}
                className="rounded-md border border-slate-800 bg-slate-900/60 p-3 transition-colors hover:border-slate-500 hover:bg-slate-900/80"
              >
                <Link
                  href={`/videos/${videoId}`}
                  className="flex items-center gap-2"
                >
                  <span className="font-medium">{video.filename}</span>
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
