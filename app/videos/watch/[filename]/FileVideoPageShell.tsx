"use client";

import * as React from "react";
import VideoPageShell, {
  type CommentData,
  type PersistCommentFn,
  type DeleteCommentFn
} from "../../[videoId]/VideoPageShell";

const STORAGE_PREFIX = "video-comments:";

function loadCommentsFromStorage(sourceUrl: string): CommentData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + sourceUrl);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return normalizeComments(parsed);
  } catch {
    return [];
  }
}

function saveCommentsToStorage(sourceUrl: string, comments: CommentData[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PREFIX + sourceUrl, JSON.stringify(comments));
  } catch {
    // ignore
  }
}

interface FileVideoPageShellProps {
  sourceUrl: string;
  title: string;
  /** Blob pathname (e.g. "videos/sample.mp4"). When provided, comments are persisted in Comment_blob table. */
  pathname?: string;
}

export default function FileVideoPageShell({
  sourceUrl,
  title,
  pathname
}: FileVideoPageShellProps) {
  const [initialComments, setInitialComments] =
    React.useState<CommentData[]>(() => []);

  React.useEffect(() => {
    if (pathname) {
      fetch(
        `/api/blob/comments?pathname=${encodeURIComponent(pathname)}`
      )
        .then((res) => (res.ok ? res.json() : []))
        .then((data: unknown) => {
          setInitialComments(normalizeComments(data));
        })
        .catch(() => setInitialComments([]));
    } else {
      setInitialComments(loadCommentsFromStorage(sourceUrl));
    }
  }, [pathname, sourceUrl]);

  const persistComment: PersistCommentFn = React.useCallback(
    async (range, text, parentId = null) => {
      if (pathname) {
        const res = await fetch("/api/blob/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pathname,
            startSeconds: range.startSeconds,
            endSeconds: range.endSeconds,
            text,
            parentId
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to create comment");
        }

        return normalizeComment(await res.json());
      }

      const current = loadCommentsFromStorage(sourceUrl);
      const newComment: CommentData = {
        id: Date.now(),
        startSeconds: range.startSeconds,
        endSeconds: range.endSeconds,
        text,
        parentId,
        createdAt: new Date().toISOString(),
        replies: []
      };
      const updated =
        parentId === null
          ? [...current, newComment].sort(compareComments)
          : addReplyToComments(current, parentId, newComment);
      saveCommentsToStorage(sourceUrl, updated);
      return newComment;
    },
    [pathname, sourceUrl]
  );

  const deleteComment: DeleteCommentFn = React.useCallback(
    async (commentId: number) => {
      if (pathname) {
        const res = await fetch(
          `/api/blob/comments?id=${commentId}`,
          { method: "DELETE" }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to delete comment");
        }
      } else {
        const current = loadCommentsFromStorage(sourceUrl);
        const updated = removeCommentFromTree(current, commentId);
        saveCommentsToStorage(sourceUrl, updated);
      }
    },
    [pathname, sourceUrl]
  );

  return (
    <VideoPageShell
      video={{
        title,
        sourceUrl,
        durationSeconds: null
      }}
      initialComments={initialComments}
      persistComment={persistComment}
      deleteComment={deleteComment}
    />
  );
}

function normalizeComments(value: unknown): CommentData[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeComment).sort(compareComments);
}

function normalizeComment(value: unknown): CommentData {
  const comment = value as Partial<CommentData>;

  return {
    id: Number(comment.id),
    startSeconds: Number(comment.startSeconds),
    endSeconds: Number(comment.endSeconds),
    text: typeof comment.text === "string" ? comment.text : "",
    parentId:
      typeof comment.parentId === "number" && Number.isFinite(comment.parentId)
        ? comment.parentId
        : null,
    createdAt:
      typeof comment.createdAt === "string"
        ? comment.createdAt
        : new Date().toISOString(),
    replies: normalizeComments(comment.replies)
  };
}

function addReplyToComments(
  comments: CommentData[],
  parentId: number,
  reply: CommentData
): CommentData[] {
  return comments.map((comment) => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...comment.replies, reply].sort(compareComments)
      };
    }

    return {
      ...comment,
      replies: addReplyToComments(comment.replies, parentId, reply)
    };
  });
}

function removeCommentFromTree(
  comments: CommentData[],
  commentId: number
): CommentData[] {
  return comments
    .filter((comment) => comment.id !== commentId)
    .map((comment) => ({
      ...comment,
      replies: removeCommentFromTree(comment.replies, commentId)
    }));
}

function compareComments(a: CommentData, b: CommentData) {
  const timeDiff = a.startSeconds - b.startSeconds;
  if (timeDiff !== 0) return timeDiff;

  const createdDiff =
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  if (createdDiff !== 0) return createdDiff;

  return a.id - b.id;
}
