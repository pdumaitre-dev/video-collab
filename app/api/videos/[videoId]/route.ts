import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: {
    videoId: string;
  };
}

export async function GET(request: Request, { params }: Params) {
  const id = Number(params.videoId);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid video id" }, { status: 400 });
  }

  try {
    const video = await prisma.video.findUnique({
      where: { id }
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: video.id,
      title: video.title,
      description: video.description,
      sourceUrl: video.sourceUrl,
      durationSeconds: video.durationSeconds
    });
  } catch (error) {
    console.error("Error fetching video", error);
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: 500 }
    );
  }
}

