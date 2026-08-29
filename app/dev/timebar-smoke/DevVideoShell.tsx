"use client";

import * as React from "react";
import VideoPageShell, {
  type CommentData,
  type PersistCommentFn,
  type DeleteCommentFn
} from "@/app/videos/[videoId]/VideoPageShell";

const STORAGE_PREFIX = "video-comments:dev-smoke:";

function loadComments(sourceUrl: string): CommentData[] {
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

function saveComments(sourceUrl: string, comments: CommentData[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PREFIX + sourceUrl, JSON.stringify(comments));
  } catch {
    // ignore
  }
}

interface DevVideoShellProps {
  sourceUrl: string;
  title: string;
}

/** Local-only player shell for cloud env smoke tests (no Vercel Blob). */
export default function DevVideoShell({ sourceUrl, title }: DevVideoShellProps) {
  const [initialComments, setInitialComments] = React.useState<CommentData[]>(
    () => []
  );

  React.useEffect(() => {
    setInitialComments(loadComments(sourceUrl));
  }, [sourceUrl]);

  const persistComment: PersistCommentFn = React.useCallback(
    async (range, text) => {
      const current = loadComments(sourceUrl);
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
      saveComments(sourceUrl, updated);
      return newComment;
    },
    [sourceUrl]
  );

  const deleteComment: DeleteCommentFn = React.useCallback(
    async (commentId: number) => {
      const current = loadComments(sourceUrl);
      saveComments(
        sourceUrl,
        current.filter((c) => c.id !== commentId)
      );
    },
    [sourceUrl]
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
