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
          setInitialComments(data);
        })
        .catch(() => setInitialComments([]));
    } else {
      setInitialComments(loadCommentsFromStorage(sourceUrl));
    }
  }, [pathname, sourceUrl]);

  const persistComment: PersistCommentFn = React.useCallback(
    async (range, text, parentId) => {
      if (pathname) {
        const res = await fetch("/api/blob/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pathname,
            startSeconds: range.startSeconds,
            endSeconds: range.endSeconds,
            text,
            parentId: parentId ?? undefined
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to create comment");
        }

        const created = (await res.json()) as {
          id: number;
          startSeconds: number;
          endSeconds: number;
          text: string;
          parentId?: number | null;
          createdAt: string;
          replies?: CommentData[];
        };

        return {
          id: created.id,
          startSeconds: created.startSeconds,
          endSeconds: created.endSeconds,
          text: created.text,
          parentId: created.parentId,
          createdAt: created.createdAt,
          replies: created.replies ?? []
        };
      }

      const current = loadCommentsFromStorage(sourceUrl);
      const newComment: CommentData = {
        id: Date.now(),
        startSeconds: range.startSeconds,
        endSeconds: range.endSeconds,
        text,
        parentId: parentId ?? null,
        createdAt: new Date().toISOString(),
        replies: []
      };

      let updated: CommentData[];
      if (parentId) {
        const addReply = (items: CommentData[]): CommentData[] =>
          items.map((item) => {
            if (item.id === parentId) {
              return {
                ...item,
                replies: [...(item.replies ?? []), newComment]
              };
            }
            if (item.replies && item.replies.length > 0) {
              return {
                ...item,
                replies: addReply(item.replies)
              };
            }
            return item;
          });
        updated = addReply(current);
      } else {
        updated = [...current, newComment].sort(
          (a, b) => a.startSeconds - b.startSeconds
        );
      }
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
        const removeFromTree = (items: CommentData[]): CommentData[] =>
          items
            .filter((item) => item.id !== commentId)
            .map((item) => {
              if (item.replies && item.replies.length > 0) {
                return {
                  ...item,
                  replies: removeFromTree(item.replies)
                };
              }
              return item;
            });
        const updated = removeFromTree(current);
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
