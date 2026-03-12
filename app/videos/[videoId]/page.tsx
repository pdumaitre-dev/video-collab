import Link from "next/link";
import { notFound } from "next/navigation";
import FileVideoPageShell from "../watch/[filename]/FileVideoPageShell";
import {
  listVideoBlobs,
  getVideoPlaybackUrl
} from "@/lib/blob";

interface PageProps {
  params: {
    videoId: string;
  };
}

export default async function VideoPage({ params }: PageProps) {
  const { videoId } = params;
  const pathname = decodeURIComponent(videoId);

  try {
    const videos = await listVideoBlobs();
    const blob = videos.find((v) => v.pathname === pathname);

    if (!blob) {
      notFound();
    }

    const sourceUrl = getVideoPlaybackUrl(blob);

    return (
      <div className="space-y-4">
        <Link
          href="/videos"
          className="inline-block text-sm text-slate-400 hover:text-slate-200"
        >
          ← Back to videos
        </Link>
        <FileVideoPageShell
          sourceUrl={sourceUrl}
          title={blob.filename}
          pathname={blob.pathname}
        />
      </div>
    );
  } catch (error) {
    console.error("Error fetching blob video", error);
    notFound();
  }
}
