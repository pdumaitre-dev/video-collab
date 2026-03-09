import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const videos = await prisma.video.findMany({
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(
      videos.map((v) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        sourceUrl: v.sourceUrl,
        durationSeconds: v.durationSeconds
      }))
    );
  } catch (error) {
    console.error("Error fetching videos", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

