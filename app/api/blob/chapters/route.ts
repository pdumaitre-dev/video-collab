import { NextResponse } from "next/server";
import { listVideoBlobs } from "@/lib/blob";
import { prisma } from "@/lib/db";

const MAX_LABEL_LENGTH = 80;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

type ChapterRecord = {
  id: number;
  pathname: string;
  label: string;
  seconds: number;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function serializeChapter(chapter: ChapterRecord) {
  return {
    id: chapter.id,
    pathname: chapter.pathname,
    label: chapter.label,
    seconds: chapter.seconds,
    color: chapter.color,
    createdAt: chapter.createdAt.toISOString(),
    updatedAt: chapter.updatedAt.toISOString()
  };
}

async function blobExists(pathname: string) {
  const videos = await listVideoBlobs();
  return videos.some((video) => video.pathname === pathname);
}

function parseDurationSeconds(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return value;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pathname = searchParams.get("pathname");

  if (!pathname || typeof pathname !== "string") {
    return NextResponse.json(
      { error: "pathname query parameter is required" },
      { status: 400 }
    );
  }

  const decoded = decodeURIComponent(pathname).trim();
  if (!decoded) {
    return NextResponse.json(
      { error: "pathname cannot be empty" },
      { status: 400 }
    );
  }

  try {
    if (!(await blobExists(decoded))) {
      return NextResponse.json(
        { error: "Blob video not found" },
        { status: 404 }
      );
    }

    const chapters = await prisma.chapter.findMany({
      where: { pathname: decoded },
      orderBy: [{ seconds: "asc" }, { createdAt: "asc" }]
    });

    return NextResponse.json(chapters.map(serializeChapter));
  } catch (error) {
    console.error("Error fetching blob chapters", error);
    return NextResponse.json(
      { error: "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { pathname, label, seconds, color, durationSeconds } = body as {
    pathname?: string;
    label?: string;
    seconds?: number;
    color?: string | null;
    durationSeconds?: number;
  };

  if (!pathname || typeof pathname !== "string") {
    return NextResponse.json(
      { error: "pathname is required" },
      { status: 400 }
    );
  }

  const trimmedPathname = pathname.trim();
  if (!trimmedPathname) {
    return NextResponse.json(
      { error: "pathname cannot be empty" },
      { status: 400 }
    );
  }

  const trimmedLabel = (label ?? "").trim();
  if (!trimmedLabel) {
    return NextResponse.json(
      { error: "Chapter label is required" },
      { status: 400 }
    );
  }

  if (trimmedLabel.length > MAX_LABEL_LENGTH) {
    return NextResponse.json(
      { error: `Chapter label must be ${MAX_LABEL_LENGTH} characters or fewer` },
      { status: 400 }
    );
  }

  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) {
    return NextResponse.json(
      { error: "seconds must be a non-negative number" },
      { status: 400 }
    );
  }

  const trimmedColor = typeof color === "string" ? color.trim() : null;
  if (trimmedColor && !HEX_COLOR_PATTERN.test(trimmedColor)) {
    return NextResponse.json(
      { error: "color must be a hex value like #3b82f6" },
      { status: 400 }
    );
  }

  try {
    if (!(await blobExists(trimmedPathname))) {
      return NextResponse.json(
        { error: "Blob video not found" },
        { status: 404 }
      );
    }

    const video = await prisma.video.findUnique({
      where: { pathname: trimmedPathname },
      select: { durationSeconds: true }
    });
    const knownDuration =
      parseDurationSeconds(durationSeconds) ??
      parseDurationSeconds(video?.durationSeconds);

    if (knownDuration !== null && seconds > knownDuration) {
      return NextResponse.json(
        { error: "seconds cannot exceed video duration" },
        { status: 400 }
      );
    }

    const chapter = await prisma.chapter.create({
      data: {
        pathname: trimmedPathname,
        label: trimmedLabel,
        seconds,
        color: trimmedColor
      }
    });

    return NextResponse.json(serializeChapter(chapter), { status: 201 });
  } catch (error) {
    console.error("Error creating blob chapter", error);
    return NextResponse.json(
      { error: "Failed to create chapter" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get("id");

  if (!idParam) {
    return NextResponse.json(
      { error: "id query parameter is required" },
      { status: 400 }
    );
  }

  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json(
      { error: "id must be a positive number" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.chapter.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    await prisma.chapter.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blob chapter", error);
    return NextResponse.json(
      { error: "Failed to delete chapter" },
      { status: 500 }
    );
  }
}
