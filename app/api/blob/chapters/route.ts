import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { listVideoBlobs } from "@/lib/blob";

const DEFAULT_CHAPTER_COLOR = "#60a5fa";
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const MAX_LABEL_LENGTH = 80;

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
    const chapters = await prisma.chapter_blob.findMany({
      where: { pathname: decoded },
      orderBy: [{ seconds: "asc" }, { createdAt: "asc" }]
    });

    return NextResponse.json(
      chapters.map((chapter) => ({
        id: chapter.id,
        pathname: chapter.pathname,
        label: chapter.label,
        seconds: chapter.seconds,
        color: chapter.color,
        createdAt: chapter.createdAt.toISOString(),
        updatedAt: chapter.updatedAt.toISOString()
      }))
    );
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

  const normalizedColor =
    typeof color === "string" && color.trim()
      ? color.trim()
      : DEFAULT_CHAPTER_COLOR;

  if (!HEX_COLOR_PATTERN.test(normalizedColor)) {
    return NextResponse.json(
      { error: "color must be a hex color in #RRGGBB format" },
      { status: 400 }
    );
  }

  try {
    const videos = await listVideoBlobs();
    const blob = videos.find((video) => video.pathname === trimmedPathname);

    if (!blob) {
      return NextResponse.json(
        { error: "Blob video not found" },
        { status: 404 }
      );
    }

    const chapter = await prisma.chapter_blob.create({
      data: {
        pathname: trimmedPathname,
        label: trimmedLabel,
        seconds,
        color: normalizedColor
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
    const existing = await prisma.chapter_blob.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    await prisma.chapter_blob.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blob chapter", error);
    return NextResponse.json(
      { error: "Failed to delete chapter" },
      { status: 500 }
    );
  }
}
