import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import VideoPageShell, { type CommentData } from "./VideoPageShell";
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

function isNumericId(value: string): boolean {
  const n = Number(value);
  return Number.isFinite(n) && String(n) === value;
}

export default async function VideoPage({ params }: PageProps) {
  const { videoId } = params;

  // Blob storage: videoId is URL-encoded pathname (e.g. "videos%2Fsample.mp4")
  if (!isNumericId(videoId)) {
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
          />
        </div>
      );
    } catch (error) {
      console.error("Error fetching blob video", error);
      notFound();
    }
  }

  // Database: videoId is numeric
  const id = Number(videoId);

  let video;
  try {
    video = await prisma.video.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: [{ startSeconds: "asc" }, { createdAt: "asc" }]
        }
      }
    });
  } catch (error) {
    throw error;
  }

  if (!video) {
    notFound();
  }

  const comments: CommentData[] = video.comments.map((c) => ({
    id: c.id,
    startSeconds: c.startSeconds,
    endSeconds: c.endSeconds,
    text: c.text,
    createdAt: c.createdAt.toISOString()
  }));

  const videoForClient = {
    id: video.id,
    title: video.title,
    description: video.description,
    sourceUrl: video.sourceUrl,
    durationSeconds: video.durationSeconds ?? null
  };

  return (
    <VideoPageShell video={videoForClient} initialComments={comments} />
  );
}
