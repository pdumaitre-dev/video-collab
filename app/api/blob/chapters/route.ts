import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { listVideoBlobs } from "@/lib/blob";

const MAX_LABEL_LENGTH = 80;
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

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

function parsePositiveId(idParam: string | null) {
  if (!idParam) {
    return {
      error: NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 }
      )
    };
  }

  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return {
      error: NextResponse.json(
        { error: "id must be a positive integer" },
        { status: 400 }
      )
    };
  }

  return { id };
}

function validateLabel(label: unknown) {
  const trimmed = typeof label === "string" ? label.trim() : "";
  if (!trimmed) {
    return { error: "Chapter label is required" };
  }

  if (trimmed.length > MAX_LABEL_LENGTH) {
    return { error: `Chapter label must be ${MAX_LABEL_LENGTH} characters or fewer` };
  }

  return { label: trimmed };
}

function validateSeconds(seconds: unknown, durationSeconds?: number | null) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
    return { error: "seconds must be a number" };
  }

  if (seconds < 0) {
    return { error: "seconds must be greater than or equal to 0" };
  }

  if (
    typeof durationSeconds === "number" &&
    Number.isFinite(durationSeconds) &&
    durationSeconds > 0 &&
    seconds > durationSeconds
  ) {
    return { error: "seconds cannot be greater than the video duration" };
  }

  return { seconds };
}

function validateColor(color: unknown) {
  if (color === undefined || color === null || color === "") {
    return { color: null };
  }

  if (typeof color !== "string" || !HEX_COLOR_RE.test(color)) {
    return { error: "color must be a hex color like #f59e0b" };
  }

  return { color: color.toLowerCase() };
}

function validateDuration(durationSeconds: unknown) {
  if (durationSeconds === undefined || durationSeconds === null) {
    return { durationSeconds: null };
  }

  if (typeof durationSeconds !== "number" || !Number.isFinite(durationSeconds)) {
    return { error: "durationSeconds must be a number when provided" };
  }

  if (durationSeconds <= 0) {
    return { error: "durationSeconds must be greater than 0 when provided" };
  }

  return { durationSeconds };
}

async function persistKnownDuration(pathname: string, durationSeconds: number | null) {
  if (!durationSeconds) return;

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
    const chapters = await prisma.chapter_blob.findMany({
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
    durationSeconds?: number | null;
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

  const durationResult = validateDuration(durationSeconds);
  if ("error" in durationResult) {
    return NextResponse.json({ error: durationResult.error }, { status: 400 });
  }

  const labelResult = validateLabel(label);
  if ("error" in labelResult) {
    return NextResponse.json({ error: labelResult.error }, { status: 400 });
  }

  const secondsResult = validateSeconds(seconds, durationResult.durationSeconds);
  if ("error" in secondsResult) {
    return NextResponse.json({ error: secondsResult.error }, { status: 400 });
  }

  const colorResult = validateColor(color);
  if ("error" in colorResult) {
    return NextResponse.json({ error: colorResult.error }, { status: 400 });
  }

  try {
    const videos = await listVideoBlobs();
    const blob = videos.find((v) => v.pathname === trimmedPathname);

    if (!blob) {
      return NextResponse.json(
        { error: "Blob video not found" },
        { status: 404 }
      );
    }

    const chapter = await prisma.chapter_blob.create({
      data: {
        pathname: trimmedPathname,
        label: labelResult.label,
        seconds: secondsResult.seconds,
        color: colorResult.color
      }
    });

    await persistKnownDuration(trimmedPathname, durationResult.durationSeconds);

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
  const { searchParams } = new URL(request.url);
  const parsedId = parsePositiveId(searchParams.get("id"));

  if ("error" in parsedId) {
    return parsedId.error;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { label, seconds, color, durationSeconds } = body as {
    label?: string;
    seconds?: number;
    color?: string | null;
    durationSeconds?: number | null;
  };

  const durationResult = validateDuration(durationSeconds);
  if ("error" in durationResult) {
    return NextResponse.json({ error: durationResult.error }, { status: 400 });
  }

  const data: {
    label?: string;
    seconds?: number;
    color?: string | null;
  } = {};

  if (label !== undefined) {
    const labelResult = validateLabel(label);
    if ("error" in labelResult) {
      return NextResponse.json({ error: labelResult.error }, { status: 400 });
    }
    data.label = labelResult.label;
  }

  if (seconds !== undefined) {
    const secondsResult = validateSeconds(seconds, durationResult.durationSeconds);
    if ("error" in secondsResult) {
      return NextResponse.json({ error: secondsResult.error }, { status: 400 });
    }
    data.seconds = secondsResult.seconds;
  }

  if (color !== undefined) {
    const colorResult = validateColor(color);
    if ("error" in colorResult) {
      return NextResponse.json({ error: colorResult.error }, { status: 400 });
    }
    data.color = colorResult.color;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "At least one chapter field is required" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.chapter_blob.findUnique({
      where: { id: parsedId.id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    const chapter = await prisma.chapter_blob.update({
      where: { id: parsedId.id },
      data
    });

    await persistKnownDuration(existing.pathname, durationResult.durationSeconds);

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
  const parsedId = parsePositiveId(searchParams.get("id"));

  if ("error" in parsedId) {
    return parsedId.error;
  }

  try {
    const existing = await prisma.chapter_blob.findUnique({
      where: { id: parsedId.id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    await prisma.chapter_blob.delete({ where: { id: parsedId.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blob chapter", error);
    return NextResponse.json(
      { error: "Failed to delete chapter" },
      { status: 500 }
    );
  }
}
