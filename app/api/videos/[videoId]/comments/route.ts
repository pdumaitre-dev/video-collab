import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: {
    videoId: string;
  };
}

export async function GET(request: Request, { params }: Params) {
  const videoId = Number(params.videoId);

  if (!Number.isFinite(videoId)) {
    return NextResponse.json({ error: "Invalid video id" }, { status: 400 });
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { videoId },
      orderBy: [{ startSeconds: "asc" }, { createdAt: "asc" }]
    });

    return NextResponse.json(
      comments.map((c) => ({
        id: c.id,
        videoId: c.videoId,
        startSeconds: c.startSeconds,
        endSeconds: c.endSeconds,
        text: c.text,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      }))
    );
  } catch (error) {
    console.error("Error fetching comments", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  const videoId = Number(params.videoId);

  if (!Number.isFinite(videoId)) {
    return NextResponse.json({ error: "Invalid video id" }, { status: 400 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { startSeconds, endSeconds, text } = body as {
    startSeconds?: number;
    endSeconds?: number;
    text?: string;
  };

  if (
    typeof startSeconds !== "number" ||
    typeof endSeconds !== "number" ||
    !Number.isFinite(startSeconds) ||
    !Number.isFinite(endSeconds)
  ) {
    return NextResponse.json(
      { error: "startSeconds and endSeconds must be numbers" },
      { status: 400 }
    );
  }

  if (!(startSeconds >= 0 && startSeconds < endSeconds)) {
    return NextResponse.json(
      { error: "Invalid time range" },
      { status: 400 }
    );
  }

  const trimmed = (text ?? "").trim();

  if (!trimmed) {
    return NextResponse.json(
      { error: "Comment text is required" },
      { status: 400 }
    );
  }

  try {
    const video = await prisma.video.findUnique({
      where: { id: videoId }
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        videoId,
        startSeconds,
        endSeconds,
        text: trimmed
      }
    });

    return NextResponse.json(
      {
        id: comment.id,
        videoId: comment.videoId,
        startSeconds: comment.startSeconds,
        endSeconds: comment.endSeconds,
        text: comment.text,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating comment", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

