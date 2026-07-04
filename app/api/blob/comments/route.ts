import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { listVideoBlobs } from "@/lib/blob";

type BlobCommentRecord = {
  id: number;
  pathname: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type BlobCommentResponse = {
  id: number;
  pathname: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  replies: BlobCommentResponse[];
};

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
      orderBy: [{ startSeconds: "asc" }, { createdAt: "asc" }, { id: "asc" }]
    });

    return NextResponse.json(buildCommentTree(comments));
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

  const { pathname, startSeconds, endSeconds, text, parentId } = body as {
    pathname?: string;
    startSeconds?: number;
    endSeconds?: number;
    text?: string;
    parentId?: number | null;
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

  const hasParentId = parentId !== undefined && parentId !== null;
  if (hasParentId && (!Number.isInteger(parentId) || parentId <= 0)) {
    return NextResponse.json(
      { error: "parentId must be a positive integer" },
      { status: 400 }
    );
  }

  if (!hasParentId) {
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

    const parent = hasParentId
      ? await prisma.comment_blob.findUnique({
          where: { id: parentId }
        })
      : null;

    if (hasParentId && !parent) {
      return NextResponse.json(
        { error: "Parent comment not found" },
        { status: 404 }
      );
    }

    if (parent && parent.pathname !== trimmedPathname) {
      return NextResponse.json(
        { error: "Parent comment does not belong to this video" },
        { status: 400 }
      );
    }

    const resolvedStartSeconds = parent?.startSeconds ?? startSeconds;
    const resolvedEndSeconds = parent?.endSeconds ?? endSeconds;

    if (
      typeof resolvedStartSeconds !== "number" ||
      typeof resolvedEndSeconds !== "number"
    ) {
      return NextResponse.json(
        { error: "startSeconds and endSeconds must be numbers" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment_blob.create({
      data: {
        pathname: trimmedPathname,
        startSeconds: resolvedStartSeconds,
        endSeconds: resolvedEndSeconds,
        text: trimmed,
        parentId: parent?.id ?? null
      }
    });

    return NextResponse.json(
      {
        id: comment.id,
        pathname: comment.pathname,
        startSeconds: comment.startSeconds,
        endSeconds: comment.endSeconds,
        text: comment.text,
        parentId: comment.parentId,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        replies: []
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

function buildCommentTree(comments: BlobCommentRecord[]): BlobCommentResponse[] {
  const nodes = new Map<number, BlobCommentResponse>();

  for (const comment of comments) {
    nodes.set(comment.id, serializeComment(comment));
  }

  const roots: BlobCommentResponse[] = [];

  for (const comment of comments) {
    const node = nodes.get(comment.id);
    if (!node) continue;

    const parent = comment.parentId ? nodes.get(comment.parentId) : undefined;
    if (parent) {
      parent.replies.push(node);
      continue;
    }

    roots.push(node);
  }

  return roots;
}

function serializeComment(comment: BlobCommentRecord): BlobCommentResponse {
  return {
    id: comment.id,
    pathname: comment.pathname,
    startSeconds: comment.startSeconds,
    endSeconds: comment.endSeconds,
    text: comment.text,
    parentId: comment.parentId,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    replies: []
  };
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
    const existing = await prisma.comment_blob.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    await prisma.comment_blob.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blob comment", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
