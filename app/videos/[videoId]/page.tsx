import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import VideoPageShell, { type CommentData } from "./VideoPageShell";

interface PageProps {
  params: {
    videoId: string;
  };
}

export default async function VideoPage({ params }: PageProps) {
  const id = Number(params.videoId);

  // #region agent log
  fetch(
    "http://127.0.0.1:7854/ingest/74efb10a-2f05-42cd-aded-96a74bcb668c",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "07a926"
      },
      body: JSON.stringify({
        sessionId: "07a926",
        runId: "initial",
        hypothesisId: "H1",
        location: "app/videos/[videoId]/page.tsx:14",
        message: "VideoPage params and parsed id",
        data: {
          rawVideoId: params.videoId,
          parsedId: id,
          isFinite: Number.isFinite(id)
        },
        timestamp: Date.now()
      })
    }
  ).catch(() => {});
  // #endregion

  if (!Number.isFinite(id)) {
    notFound();
  }

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

    // #region agent log
    fetch(
      "http://127.0.0.1:7854/ingest/74efb10a-2f05-42cd-aded-96a74bcb668c",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "07a926"
        },
        body: JSON.stringify({
          sessionId: "07a926",
          runId: "initial",
          hypothesisId: "H1",
          location: "app/videos/[videoId]/page.tsx:29",
          message: "Result of prisma.video.findUnique in VideoPage",
          data: {
            id,
            found: Boolean(video),
            videoId: video?.id ?? null
          },
          timestamp: Date.now()
        })
      }
    ).catch(() => {});
    // #endregion
  } catch (error) {
    // #region agent log
    fetch(
      "http://127.0.0.1:7854/ingest/74efb10a-2f05-42cd-aded-96a74bcb668c",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "07a926"
        },
        body: JSON.stringify({
          sessionId: "07a926",
          runId: "initial",
          hypothesisId: "H2",
          location: "app/videos/[videoId]/page.tsx:45",
          message: "Error thrown by prisma.video.findUnique in VideoPage",
          data: {
            id,
            error: error instanceof Error ? error.message : String(error)
          },
          timestamp: Date.now()
        })
      }
    ).catch(() => {});
    // #endregion
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
