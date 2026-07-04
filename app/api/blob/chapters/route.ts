import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { listVideoBlobs } from "@/lib/blob";

const LABEL_MIN = 1;
const LABEL_MAX = 80;

function validateLabel(label: unknown): string | null {
  if (typeof label !== "string") return null;
  const trimmed = label.trim();
  if (trimmed.length < LABEL_MIN || trimmed.length > LABEL_MAX) return null;
  return trimmed;
}

function validateSeconds(seconds: unknown): number | null {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) {
    return null;
  }
  return seconds;
}

async function verifyPathname(pathname: string) {
  const videos = await listVideoBlobs();
  return videos.find((v) => v.pathname === pathname) ?? null;
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

    return NextResponse.json(
      chapters.map((c) => ({
        id: c.id,
        pathname: c.pathname,
        label: c.label,
        seconds: c.seconds,
        color: c.color,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
      }))
    );
  } catch (error) {
    console.error("Error fetching chapters", error);
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

  const { pathname, label, seconds, color } = body as {
    pathname?: string;
    label?: string;
    seconds?: number;
    color?: string | null;
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
  if (!validatedLabel) {
    return NextResponse.json(
      { error: `label must be ${LABEL_MIN}–${LABEL_MAX} characters` },
      { status: 400 }
    );
  }

  const validatedSeconds = validateSeconds(seconds);
  if (validatedSeconds === null) {
    return NextResponse.json(
      { error: "seconds must be a finite number >= 0" },
      { status: 400 }
    );
  }

  try {
    const blob = await verifyPathname(trimmedPathname);
    if (!blob) {
      return NextResponse.json(
        { error: "Blob video not found" },
        { status: 404 }
      );
    }

    const video = await prisma.video.findFirst({
      where: { pathname: trimmedPathname },
      select: { durationSeconds: true }
    });

    if (
      video?.durationSeconds != null &&
      validatedSeconds > video.durationSeconds
    ) {
      return NextResponse.json(
        { error: "seconds exceeds video duration" },
        { status: 400 }
      );
    }

    const chapter = await prisma.chapter.create({
      data: {
        pathname: trimmedPathname,
        label: validatedLabel,
        seconds: validatedSeconds,
        color: color ?? null
      }
    });

    return NextResponse.json(
      {
        id: chapter.id,
        pathname: chapter.pathname,
        label: chapter.label,
        seconds: chapter.seconds,
        color: chapter.color,
        createdAt: chapter.createdAt.toISOString(),
        updatedAt: chapter.updatedAt.toISOString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating chapter", error);
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
    console.error("Error deleting chapter", error);
    return NextResponse.json(
      { error: "Failed to delete chapter" },
      { status: 500 }
    );
  }
}
