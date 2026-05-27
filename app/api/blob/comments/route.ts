import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { listVideoBlobs } from "@/lib/blob";

type BlobCommentRecord = {
  id: number;
  pathname: string;
  parentId: number | null;
  startSeconds: number;
  endSeconds: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
};

type SerializedBlobComment = {
  id: number;
  pathname: string;
  parentId: number | null;
  startSeconds: number;
  endSeconds: number;
  text: string;
  createdAt: string;
  updatedAt: string;
  replies: SerializedBlobComment[];
};

function serializeComment(
  comment: BlobCommentRecord,
  replies: SerializedBlobComment[] = []
): SerializedBlobComment {
  return {
    id: comment.id,
    pathname: comment.pathname,
    parentId: comment.parentId,
    startSeconds: comment.startSeconds,
    endSeconds: comment.endSeconds,
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    replies
  };
}

function compareByTimeThenCreatedAt(
  a: BlobCommentRecord,
  b: BlobCommentRecord
) {
  return (
    a.startSeconds - b.startSeconds ||
    a.createdAt.getTime() - b.createdAt.getTime() ||
    a.id - b.id
  );
}

function buildCommentTree(
  comments: BlobCommentRecord[]
): SerializedBlobComment[] {
  const commentsByParent = new Map<number | null, BlobCommentRecord[]>();

  for (const comment of comments) {
    const parentComments = commentsByParent.get(comment.parentId) ?? [];
    parentComments.push(comment);
    commentsByParent.set(comment.parentId, parentComments);
  }

  const serializeBranch = (parentId: number | null): SerializedBlobComment[] =>
    (commentsByParent.get(parentId) ?? [])
      .sort(compareByTimeThenCreatedAt)
      .map((comment) =>
        serializeComment(comment, serializeBranch(comment.id))
      );

  return serializeBranch(null);
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

  if (normalizedParentId === null) {
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

    const parentComment =
      normalizedParentId === null
        ? null
        : await prisma.comment_blob.findUnique({
            where: { id: normalizedParentId }
          });

    if (normalizedParentId !== null && !parentComment) {
      return NextResponse.json(
        { error: "Parent comment not found" },
        { status: 404 }
      );
    }

    if (parentComment && parentComment.pathname !== trimmedPathname) {
      return NextResponse.json(
        { error: "Parent comment belongs to a different video" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment_blob.create({
      data: {
        pathname: trimmedPathname,
        parentId: normalizedParentId,
        startSeconds: parentComment?.startSeconds ?? startSeconds!,
        endSeconds: parentComment?.endSeconds ?? endSeconds!,
        text: trimmed
      }
    });

    return NextResponse.json(
      serializeComment(comment),
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
