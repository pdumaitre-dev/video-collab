import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { listVideoBlobs } from "@/lib/blob";

type CommentBlobRecord = {
  id: number;
  pathname: string;
  parentId: number | null;
  startSeconds: number;
  endSeconds: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
};

type CommentBlobResponse = {
  id: number;
  pathname: string;
  parentId: number | null;
  startSeconds: number;
  endSeconds: number;
  text: string;
  createdAt: string;
  updatedAt: string;
  replies: CommentBlobResponse[];
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
      orderBy: [{ startSeconds: "asc" }, { createdAt: "asc" }]
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

  const { pathname, parentId, startSeconds, endSeconds, text } = body as {
    pathname?: string;
    parentId?: number | null;
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

  const normalizedParentId = parentId ?? null;
  if (
    normalizedParentId !== null &&
    (!Number.isInteger(normalizedParentId) || normalizedParentId <= 0)
  ) {
    return NextResponse.json(
      { error: "parentId must be a positive integer" },
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

    const parent =
      normalizedParentId === null
        ? null
        : await prisma.comment_blob.findUnique({
            where: { id: normalizedParentId }
          });

    if (normalizedParentId !== null) {
      if (!parent || parent.pathname !== trimmedPathname) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    } else {
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

    const comment = await prisma.comment_blob.create({
      data: {
        pathname: trimmedPathname,
        parentId: normalizedParentId,
        startSeconds: parent?.startSeconds ?? startSeconds!,
        endSeconds: parent?.endSeconds ?? endSeconds!,
        text: trimmed
      }
    });

    return NextResponse.json(
      {
        id: comment.id,
        pathname: comment.pathname,
        parentId: comment.parentId,
        startSeconds: comment.startSeconds,
        endSeconds: comment.endSeconds,
        text: comment.text,
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

function buildCommentTree(comments: CommentBlobRecord[]): CommentBlobResponse[] {
  const byId = new Map<number, CommentBlobResponse>();
  const roots: CommentBlobResponse[] = [];

  for (const comment of comments) {
    byId.set(comment.id, serializeComment(comment));
  }

  for (const comment of comments) {
    const item = byId.get(comment.id);
    if (!item) continue;

    const parent = comment.parentId ? byId.get(comment.parentId) : null;
    if (parent) {
      parent.replies.push(item);
    } else {
      roots.push(item);
    }
  }

  sortCommentTree(roots);
  return roots;
}

function sortCommentTree(comments: CommentBlobResponse[]) {
  comments.sort(
    (a, b) =>
      a.startSeconds - b.startSeconds ||
      Date.parse(a.createdAt) - Date.parse(b.createdAt)
  );

  for (const comment of comments) {
    comment.replies.sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
    );
    sortCommentTree(comment.replies);
  }
}

function serializeComment(comment: CommentBlobRecord): CommentBlobResponse {
  return {
    id: comment.id,
    pathname: comment.pathname,
    parentId: comment.parentId,
    startSeconds: comment.startSeconds,
    endSeconds: comment.endSeconds,
    text: comment.text,
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
