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
        .then((data: Array<{ id: number; startSeconds: number; endSeconds: number; text: string; createdAt: string }>) => {
          setInitialComments(
            data.map((c) => ({
              id: c.id,
              startSeconds: c.startSeconds,
              endSeconds: c.endSeconds,
              text: c.text,
              createdAt: c.createdAt
            }))
          );
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
          startSeconds: number;
          endSeconds: number;
          text: string;
          createdAt: string;
        };

        return {
          id: created.id,
          startSeconds: created.startSeconds,
          endSeconds: created.endSeconds,
          text: created.text,
          createdAt: created.createdAt
        };
      }

      const current = loadCommentsFromStorage(sourceUrl);
      const newComment: CommentData = {
        id: Date.now(),
        startSeconds: range.startSeconds,
        endSeconds: range.endSeconds,
        text,
        createdAt: new Date().toISOString()
      };
      const updated = [...current, newComment].sort(
        (a, b) => a.startSeconds - b.startSeconds
      );
      saveCommentsToStorage(sourceUrl, updated);
      return newComment;
    },
    [pathname, sourceUrl]
  );

  const deleteComment: DeleteCommentFn = React.useCallback(
    async (commentId: number) => {
      if (pathname) {
        const res = await fetch(
          `/api/blob/comments?id=${encodeURIComponent(commentId)}`,
          { method: "DELETE" }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to delete comment");
        }
      } else {
        const current = loadCommentsFromStorage(sourceUrl);
        const updated = current.filter((c) => c.id !== commentId);
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
