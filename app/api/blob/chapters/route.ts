import { NextResponse } from "next/server";
import { listVideoBlobs } from "@/lib/blob";
import { prisma } from "@/lib/db";

const MAX_LABEL_LENGTH = 80;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

type ChapterResponse = {
  id: number;
  pathname: string;
  label: string;
  seconds: number;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

function serializeChapter(chapter: {
  id: number;
  pathname: string;
  label: string;
  seconds: number;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ChapterResponse {
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

function validateLabel(label: unknown): string | NextResponse {
  if (typeof label !== "string") {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  const trimmed = label.trim();
  if (!trimmed) {
    return NextResponse.json(
      { error: "label cannot be empty" },
      { status: 400 }
    );
  }

  if (trimmed.length > MAX_LABEL_LENGTH) {
    return NextResponse.json(
      { error: `label must be ${MAX_LABEL_LENGTH} characters or fewer` },
      { status: 400 }
    );
  }

  return trimmed;
}

function validateSeconds(
  seconds: unknown,
  durationSeconds: unknown
): number | NextResponse {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
    return NextResponse.json(
      { error: "seconds must be a finite number" },
      { status: 400 }
    );
  }

  if (seconds < 0) {
    return NextResponse.json(
      { error: "seconds must be greater than or equal to 0" },
      { status: 400 }
    );
  }

  if (
    typeof durationSeconds === "number" &&
    Number.isFinite(durationSeconds) &&
    durationSeconds > 0 &&
    seconds > durationSeconds + 0.25
  ) {
    return NextResponse.json(
      { error: "seconds cannot exceed the video duration" },
      { status: 400 }
    );
  }

  return seconds;
}

function validateColor(color: unknown): string | null | NextResponse {
  if (color === undefined || color === null || color === "") {
    return null;
  }

  if (typeof color !== "string" || !HEX_COLOR_PATTERN.test(color)) {
    return NextResponse.json(
      { error: "color must be a hex color such as #3b82f6" },
      { status: 400 }
    );
  }

  return color.toLowerCase();
}

async function assertBlobExists(pathname: string): Promise<NextResponse | null> {
  const videos = await listVideoBlobs();
  const blob = videos.find((v) => v.pathname === pathname);

  if (!blob) {
    return NextResponse.json(
      { error: "Blob video not found" },
      { status: 404 }
    );
  }

  return null;
}

async function syncVideoDuration(
  pathname: string,
  durationSeconds: unknown
): Promise<void> {
  if (
    typeof durationSeconds !== "number" ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0
  ) {
    return;
  }

  await prisma.video.updateMany({
    where: {
      pathname,
      OR: [
        { durationSeconds: null },
        { durationSeconds: { not: durationSeconds } }
      ]
    },
    data: { durationSeconds }
  });
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

  const decoded = decodeURIComponent(pathname);

  try {
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

  const validatedLabel = validateLabel(label);
  if (validatedLabel instanceof NextResponse) return validatedLabel;

  const validatedSeconds = validateSeconds(seconds, durationSeconds);
  if (validatedSeconds instanceof NextResponse) return validatedSeconds;

  const validatedColor = validateColor(color);
  if (validatedColor instanceof NextResponse) return validatedColor;

  try {
    const blobError = await assertBlobExists(trimmedPathname);
    if (blobError) return blobError;

    await syncVideoDuration(trimmedPathname, durationSeconds);

    const chapter = await prisma.chapter.create({
      data: {
        pathname: trimmedPathname,
        label: validatedLabel,
        seconds: validatedSeconds,
        color: validatedColor
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

export async function PATCH(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, label, seconds, color, durationSeconds } = body as {
    id?: number;
    label?: string;
    seconds?: number;
    color?: string | null;
    durationSeconds?: number;
  };

  if (typeof id !== "number" || !Number.isFinite(id) || id <= 0) {
    return NextResponse.json(
      { error: "id must be a positive number" },
      { status: 400 }
    );
  }

  const validatedLabel = validateLabel(label);
  if (validatedLabel instanceof NextResponse) return validatedLabel;

  const validatedSeconds = validateSeconds(seconds, durationSeconds);
  if (validatedSeconds instanceof NextResponse) return validatedSeconds;

  const validatedColor = validateColor(color);
  if (validatedColor instanceof NextResponse) return validatedColor;

  try {
    const existing = await prisma.chapter.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    await syncVideoDuration(existing.pathname, durationSeconds);

    const chapter = await prisma.chapter.update({
      where: { id },
      data: {
        label: validatedLabel,
        seconds: validatedSeconds,
        color: validatedColor
      }
    });

    return NextResponse.json(serializeChapter(chapter));
  } catch (error) {
    console.error("Error updating blob chapter", error);
    return NextResponse.json(
      { error: "Failed to update chapter" },
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
