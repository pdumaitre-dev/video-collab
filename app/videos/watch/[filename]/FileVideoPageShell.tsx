"use client";

import * as React from "react";
import VideoPageShell, {
  type CommentData,
  type PersistCommentFn,
  type PersistReplyFn,
  type DeleteCommentFn
} from "../../[videoId]/VideoPageShell";

const STORAGE_PREFIX = "video-comments:";

function loadCommentsFromStorage(sourceUrl: string): CommentData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + sourceUrl);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CommentData[];
    return Array.isArray(parsed) ? parsed : [];
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

function normalizeComments(comments: CommentData[]): CommentData[] {
  return comments.map((comment) => ({
    ...comment,
    parentId: comment.parentId ?? null,
    replies: normalizeComments(comment.replies ?? [])
  }));
}

function findComment(comments: CommentData[], commentId: number): CommentData | null {
  for (const comment of comments) {
    if (comment.id === commentId) return comment;
    const nested = findComment(comment.replies ?? [], commentId);
    if (nested) return nested;
  }
  return null;
}

function addReplyToTree(
  comments: CommentData[],
  parentId: number,
  reply: CommentData
): CommentData[] {
  return comments.map((comment) => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...(comment.replies ?? []), reply].sort(
          (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
        )
      };
    }

    return {
      ...comment,
      replies: addReplyToTree(comment.replies ?? [], parentId, reply)
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
      replies: removeCommentFromTree(comment.replies ?? [], commentId)
    }));
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
        .then((data: CommentData[]) => {
          setInitialComments(normalizeComments(data));
        })
        .catch(() => setInitialComments([]));
    } else {
      setInitialComments(loadCommentsFromStorage(sourceUrl));
    }
  }, [pathname, sourceUrl]);

  const persistComment: PersistCommentFn = React.useCallback(
    async (range, text) => {
      if (pathname) {
        const res = await fetch("/api/blob/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pathname,
            startSeconds: range.startSeconds,
            endSeconds: range.endSeconds,
            text
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to create comment");
        }

        const created = (await res.json()) as {
          id: number;
          parentId: number | null;
          startSeconds: number;
          endSeconds: number;
          text: string;
          createdAt: string;
          replies?: CommentData[];
        };

        return {
          id: created.id,
          parentId: created.parentId,
          startSeconds: created.startSeconds,
          endSeconds: created.endSeconds,
          text: created.text,
          createdAt: created.createdAt,
          replies: normalizeComments(created.replies ?? [])
        };
      }

      const current = loadCommentsFromStorage(sourceUrl);
      const newComment: CommentData = {
        id: Date.now(),
        parentId: null,
        startSeconds: range.startSeconds,
        endSeconds: range.endSeconds,
        text,
        createdAt: new Date().toISOString(),
        replies: []
      };
      const updated = [...current, newComment].sort(
        (a, b) => a.startSeconds - b.startSeconds
      );
      saveCommentsToStorage(sourceUrl, updated);
      return newComment;
    },
    [pathname, sourceUrl]
  );

  const persistReply: PersistReplyFn = React.useCallback(
    async (parentId, text) => {
      if (pathname) {
        const res = await fetch("/api/blob/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pathname,
            parentId,
            text
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to create reply");
        }

        const created = (await res.json()) as {
          id: number;
          parentId: number | null;
          startSeconds: number;
          endSeconds: number;
          text: string;
          createdAt: string;
          replies?: CommentData[];
        };

        return {
          id: created.id,
          parentId: created.parentId,
          startSeconds: created.startSeconds,
          endSeconds: created.endSeconds,
          text: created.text,
          createdAt: created.createdAt,
          replies: normalizeComments(created.replies ?? [])
        };
      }

      const current = loadCommentsFromStorage(sourceUrl);
      const parent = findComment(current, parentId);
      if (!parent) {
        throw new Error("Parent comment not found");
      }

      const reply: CommentData = {
        id: Date.now(),
        parentId,
        startSeconds: parent.startSeconds,
        endSeconds: parent.endSeconds,
        text,
        createdAt: new Date().toISOString(),
        replies: []
      };
      saveCommentsToStorage(sourceUrl, addReplyToTree(current, parentId, reply));
      return reply;
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
      persistReply={persistReply}
      deleteComment={deleteComment}
    />
  );
}
