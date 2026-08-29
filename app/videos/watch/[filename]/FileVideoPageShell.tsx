"use client";

import * as React from "react";
import VideoPageShell, {
  type CommentData,
  type PersistCommentFn,
  type DeleteCommentFn,
  type PersistChapterFn,
  type DeleteChapterFn
} from "../../[videoId]/VideoPageShell";
import type { ChapterData } from "@/components/ChapterList";

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
  const [initialChapters, setInitialChapters] =
    React.useState<ChapterData[]>(() => []);

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

      fetch(
        `/api/blob/chapters?pathname=${encodeURIComponent(pathname)}`
      )
        .then((res) => (res.ok ? res.json() : []))
        .then((data: Array<{ id: number; label: string; seconds: number; color?: string | null }>) => {
          setInitialChapters(
            data.map((c) => ({
              id: c.id,
              label: c.label,
              seconds: c.seconds,
              color: c.color
            }))
          );
        })
        .catch(() => setInitialChapters([]));
    } else {
      setInitialComments(loadCommentsFromStorage(sourceUrl));
      setInitialChapters([]);
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
          `/api/blob/comments?id=${commentId}`,
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

  const persistChapter: PersistChapterFn = React.useCallback(
    async (label, seconds) => {
      if (!pathname) {
        throw new Error("Chapters are not available for this video");
      }

      const res = await fetch("/api/blob/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathname,
          label,
          seconds,
          color: "#3b82f6"
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to create chapter");
      }

      const created = (await res.json()) as {
        id: number;
        label: string;
        seconds: number;
        color?: string | null;
      };

      return {
        id: created.id,
        label: created.label,
        seconds: created.seconds,
        color: created.color
      };
    },
    [pathname]
  );

  const deleteChapter: DeleteChapterFn = React.useCallback(
    async (chapterId: number) => {
      if (!pathname) return;

      const res = await fetch(`/api/blob/chapters?id=${chapterId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to delete chapter");
      }
    },
    [pathname]
  );

  return (
    <VideoPageShell
      video={{
        title,
        sourceUrl,
        durationSeconds: null
      }}
      initialComments={initialComments}
      initialChapters={initialChapters}
      persistComment={persistComment}
      deleteComment={deleteComment}
      persistChapter={pathname ? persistChapter : undefined}
      deleteChapter={pathname ? deleteChapter : undefined}
      chaptersEnabled={Boolean(pathname)}
    />
  );
}
