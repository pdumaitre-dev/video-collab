import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { listVideoBlobs } from "@/lib/blob";

type CommentRow = {
  id: number;
  pathname: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type CommentNode = {
  id: number;
  pathname: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  replies: CommentNode[];
};

function serializeComment(comment: CommentRow): Omit<CommentNode, "replies"> {
  return {
    id: comment.id,
    pathname: comment.pathname,
    startSeconds: comment.startSeconds,
    endSeconds: comment.endSeconds,
    text: comment.text,
    parentId: comment.parentId,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString()
  };
}

function buildCommentTree(comments: CommentRow[]): CommentNode[] {
  const nodes = new Map<number, CommentNode>();

  for (const comment of comments) {
    nodes.set(comment.id, { ...serializeComment(comment), replies: [] });
  }

  const roots: CommentNode[] = [];

  for (const comment of comments) {
    const node = nodes.get(comment.id);
    if (!node) continue;

    if (comment.parentId) {
      const parent = nodes.get(comment.parentId);
      if (parent) {
        parent.replies.push(node);
      }
      continue;
    }

    roots.push(node);
  }

  const sortByCreatedAt = (a: CommentNode, b: CommentNode) =>
    a.createdAt.localeCompare(b.createdAt);

  roots.sort((a, b) => {
    if (a.startSeconds !== b.startSeconds) {
      return a.startSeconds - b.startSeconds;
    }
    return sortByCreatedAt(a, b);
  });

  for (const root of roots) {
    root.replies.sort(sortByCreatedAt);
  }

  return roots;
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

  const { pathname, startSeconds, endSeconds, text, parentId } = body as {
    pathname?: string;
    startSeconds?: number;
    endSeconds?: number;
    text?: string;
    parentId?: number;
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

  const trimmed = (text ?? "").trim();
  if (!trimmed) {
    return NextResponse.json(
      { error: "Comment text is required" },
      { status: 400 }
    );
  }

  let resolvedStartSeconds = startSeconds;
  let resolvedEndSeconds = endSeconds;
  let resolvedParentId: number | null = null;

  if (parentId !== undefined && parentId !== null) {
    if (!Number.isFinite(parentId) || parentId <= 0) {
      return NextResponse.json(
        { error: "parentId must be a positive number" },
        { status: 400 }
      );
    }

    const parent = await prisma.comment_blob.findUnique({
      where: { id: parentId }
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Parent comment not found" },
        { status: 404 }
      );
    }

    if (parent.pathname !== trimmedPathname) {
      return NextResponse.json(
        { error: "Parent comment belongs to a different video" },
        { status: 400 }
      );
    }

    if (parent.parentId !== null) {
      return NextResponse.json(
        { error: "Replies can only be added to top-level comments" },
        { status: 400 }
      );
    }

    resolvedParentId = parentId;
    resolvedStartSeconds = parent.startSeconds;
    resolvedEndSeconds = parent.endSeconds;
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
        startSeconds: resolvedStartSeconds!,
        endSeconds: resolvedEndSeconds!,
        text: trimmed,
        parentId: resolvedParentId
      }
    });

    return NextResponse.json(serializeComment(comment), { status: 201 });
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
