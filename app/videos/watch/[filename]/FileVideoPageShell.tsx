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

        const [created] = normalizeComments([await res.json()]);
        if (!created) {
          throw new Error("Failed to parse created comment");
        }
        return created;
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
          ? sortCommentTree([...current, newComment])
          : addReplyToTree(current, parentId, newComment);
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

  return sortCommentTree(
    value
      .map((item): CommentData | null => {
        if (!item || typeof item !== "object") return null;
        const raw = item as Partial<CommentData>;

        if (
          typeof raw.id !== "number" ||
          typeof raw.startSeconds !== "number" ||
          typeof raw.endSeconds !== "number" ||
          typeof raw.text !== "string" ||
          typeof raw.createdAt !== "string"
        ) {
          return null;
        }

        return {
          id: raw.id,
          startSeconds: raw.startSeconds,
          endSeconds: raw.endSeconds,
          text: raw.text,
          parentId: raw.parentId ?? null,
          createdAt: raw.createdAt,
          replies: normalizeComments(raw.replies)
        };
      })
      .filter((comment): comment is CommentData => comment !== null)
  );
}

function addReplyToTree(
  comments: CommentData[],
  parentId: number,
  reply: CommentData
): CommentData[] {
  return sortCommentTree(
    comments.map((comment) => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: sortCommentTree([...comment.replies, reply])
        };
      }

      return {
        ...comment,
        replies: addReplyToTree(comment.replies, parentId, reply)
      };
    })
  );
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

function sortCommentTree(comments: CommentData[]): CommentData[] {
  return [...comments]
    .sort(
      (a, b) =>
        a.startSeconds - b.startSeconds ||
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
        a.id - b.id
    )
    .map((comment) => ({
      ...comment,
      replies: sortCommentTree(comment.replies)
    }));
}
