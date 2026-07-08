"use client";

import * as React from "react";
import VideoPageShell, {
  type ChapterData,
  type CommentData,
  type DeleteChapterFn,
  type DeleteCommentFn,
  type PersistChapterFn,
  type PersistCommentFn
} from "../../[videoId]/VideoPageShell";

const COMMENT_STORAGE_PREFIX = "video-comments:";
const CHAPTER_STORAGE_PREFIX = "video-chapters:";

type BlobCommentData = {
  id: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  createdAt: string;
};

type BlobChapterData = {
  id: number;
  label: string;
  seconds: number;
  color: string | null;
  createdAt: string;
};

function loadCommentsFromStorage(sourceUrl: string): CommentData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMMENT_STORAGE_PREFIX + sourceUrl);
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
    localStorage.setItem(
      COMMENT_STORAGE_PREFIX + sourceUrl,
      JSON.stringify(comments)
    );
  } catch {
    // ignore
  }
}

function loadChaptersFromStorage(sourceUrl: string): ChapterData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAPTER_STORAGE_PREFIX + sourceUrl);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChapterData[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveChaptersToStorage(sourceUrl: string, chapters: ChapterData[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      CHAPTER_STORAGE_PREFIX + sourceUrl,
      JSON.stringify(chapters)
    );
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
      const encodedPathname = encodeURIComponent(pathname);
      Promise.allSettled([
        fetch(`/api/blob/comments?pathname=${encodedPathname}`).then(
          async (res) => (res.ok ? ((await res.json()) as BlobCommentData[]) : [])
        ),
        fetch(`/api/blob/chapters?pathname=${encodedPathname}`).then(
          async (res) => (res.ok ? ((await res.json()) as BlobChapterData[]) : [])
        )
      ])
        .then(([commentsResult, chaptersResult]) => {
          if (commentsResult.status === "fulfilled") {
            const commentsData = commentsResult.value;

            setInitialComments(
              commentsData.map((c) => ({
                id: c.id,
                startSeconds: c.startSeconds,
                endSeconds: c.endSeconds,
                text: c.text,
                createdAt: c.createdAt
              }))
            );
          }

          if (chaptersResult.status === "fulfilled") {
            const chaptersData = chaptersResult.value;

            setInitialChapters(
              chaptersData.map((chapter) => ({
                id: chapter.id,
                label: chapter.label,
                seconds: chapter.seconds,
                color: chapter.color,
                createdAt: chapter.createdAt
              }))
            );
          }
        });
    } else {
      setInitialComments(loadCommentsFromStorage(sourceUrl));
      setInitialChapters(loadChaptersFromStorage(sourceUrl));
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

  const persistChapter: PersistChapterFn = React.useCallback(
    async ({ label, seconds, color, durationSeconds }) => {
      if (pathname) {
        const res = await fetch("/api/blob/chapters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pathname,
            label,
            seconds,
            color,
            durationSeconds
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
          color: string | null;
          createdAt: string;
        };

        return {
          id: created.id,
          label: created.label,
          seconds: created.seconds,
          color: created.color,
          createdAt: created.createdAt
        };
      }

      const current = loadChaptersFromStorage(sourceUrl);
      const newChapter: ChapterData = {
        id: Date.now(),
        label,
        seconds,
        color,
        createdAt: new Date().toISOString()
      };
      const updated = [...current, newChapter].sort(
        (a, b) => a.seconds - b.seconds
      );
      saveChaptersToStorage(sourceUrl, updated);
      return newChapter;
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

  const deleteChapter: DeleteChapterFn = React.useCallback(
    async (chapterId: number) => {
      if (pathname) {
        const res = await fetch(
          `/api/blob/chapters?id=${chapterId}`,
          { method: "DELETE" }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to delete chapter");
        }
      } else {
        const current = loadChaptersFromStorage(sourceUrl);
        const updated = current.filter((chapter) => chapter.id !== chapterId);
        saveChaptersToStorage(sourceUrl, updated);
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
      initialChapters={initialChapters}
      persistComment={persistComment}
      deleteComment={deleteComment}
      persistChapter={persistChapter}
      deleteChapter={deleteChapter}
    />
  );
}
