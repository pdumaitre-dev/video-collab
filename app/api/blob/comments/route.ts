import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { listVideoBlobs } from "@/lib/blob";

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
    const comments = await prisma.comment_blob.findMany({
      where: { pathname: decoded },
      orderBy: [{ startSeconds: "asc" }, { createdAt: "asc" }]
    });

    return NextResponse.json(
      comments.map((c) => ({
        id: c.id,
        pathname: c.pathname,
        startSeconds: c.startSeconds,
        endSeconds: c.endSeconds,
        text: c.text,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString()
      }))
    );
  } catch (error) {
    console.error("Error fetching blob comments", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
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

  const { pathname, startSeconds, endSeconds, text } = body as {
    pathname?: string;
    startSeconds?: number;
    endSeconds?: number;
    text?: string;
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
    const videos = await listVideoBlobs();
    const blob = videos.find((v) => v.pathname === trimmedPathname);

    if (!blob) {
      return NextResponse.json(
        { error: "Blob video not found" },
        { status: 404 }
      );
    }

    const comment = await prisma.comment_blob.create({
      data: {
        pathname: trimmedPathname,
        startSeconds,
        endSeconds,
        text: trimmed
      }
    });

    return NextResponse.json(
      {
        id: comment.id,
        pathname: comment.pathname,
        startSeconds: comment.startSeconds,
        endSeconds: comment.endSeconds,
        text: comment.text,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString()
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating blob comment", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, pathname } = body as {
    id?: number;
    pathname?: string;
  };

  if (!Number.isInteger(id) || (id ?? 0) <= 0) {
    return NextResponse.json(
      { error: "id must be a positive integer" },
      { status: 400 }
    );
  }

  if (!pathname || typeof pathname !== "string" || !pathname.trim()) {
    return NextResponse.json(
      { error: "pathname is required" },
      { status: 400 }
    );
  }

  try {
    const deleted = await prisma.comment_blob.deleteMany({
      where: { id, pathname: pathname.trim() }
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blob comment", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
