import Link from "next/link";
import { readdirSync } from "fs";
import { join } from "path";

const VIDEO_EXTENSIONS = [".mp4", ".mov"];

function getVideosFromPublicFolder(): string[] {
  const videosDir = join(process.cwd(), "public", "videos");
  try {
    const files = readdirSync(videosDir);
    return files.filter(
      (file) =>
        VIDEO_EXTENSIONS.some((ext) =>
          file.toLowerCase().endsWith(ext)
        )
    );
  } catch {
    return [];
  }
}

export default function VideosPickerPage() {
  const videos = getVideosFromPublicFolder();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Pick a video</h2>
      {videos.length === 0 ? (
        <p className="text-sm text-slate-400">
          No videos found in public/videos. Add .mp4 or .mov files to get
          started.
        </p>
      ) : (
        <ul className="space-y-2">
          {videos.map((filename) => (
            <li
              key={filename}
              className="rounded-md border border-slate-800 bg-slate-900/60 p-3 transition-colors hover:border-slate-500 hover:bg-slate-900/80"
            >
              <Link
                href={`/videos/watch/${encodeURIComponent(filename)}`}
                className="flex items-center gap-2"
              >
                <span className="font-medium">{filename}</span>
                <span className="text-xs text-slate-500">
                  ({filename.split(".").pop()?.toUpperCase()})
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
