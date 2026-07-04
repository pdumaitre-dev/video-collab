"use client";

import * as React from "react";
import VideoPageShell, {
  type CommentData,
  type PersistCommentFn,
  type DeleteCommentFn
} from "../../[videoId]/VideoPageShell";

const STORAGE_PREFIX = "video-comments:";

type SerializedComment = {
  id: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  parentId?: number | null;
  createdAt: string;
  replies?: SerializedComment[];
};

function loadCommentsFromStorage(sourceUrl: string): CommentData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + sourceUrl);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SerializedComment[];
    return Array.isArray(parsed) ? parsed.map(normalizeComment) : [];
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
        .then((data: SerializedComment[]) => {
          setInitialComments(data.map(normalizeComment));
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
            parentId
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to create comment");
        }

        const created = (await res.json()) as SerializedComment;

        return normalizeComment(created);
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
      const updated = insertComment(current, newComment);
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
        const updated = removeComment(current, commentId);
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

function normalizeComment(comment: SerializedComment): CommentData {
  return {
    id: comment.id,
    startSeconds: comment.startSeconds,
    endSeconds: comment.endSeconds,
    text: comment.text,
    parentId: comment.parentId ?? null,
    createdAt: comment.createdAt,
    replies: (comment.replies ?? []).map(normalizeComment)
  };
}

function insertComment(comments: CommentData[], comment: CommentData): CommentData[] {
  const [nextComments, inserted] = insertCommentWithStatus(comments, comment);
  return inserted ? nextComments : sortComments([...comments, comment]);
}

function insertCommentWithStatus(
  comments: CommentData[],
  comment: CommentData
): [CommentData[], boolean] {
  if (comment.parentId === null) {
    return [sortComments([...comments, comment]), true];
  }

  let inserted = false;
  const nextComments = comments.map((current) => {
    if (current.id === comment.parentId) {
      inserted = true;
      return {
        ...current,
        replies: sortComments([...current.replies, comment])
      };
    }

    const [nextReplies, childInserted] = insertCommentWithStatus(
      current.replies,
      comment
    );
    inserted = inserted || childInserted;
    return {
      ...current,
      replies: nextReplies
    };
  });

  return [nextComments, inserted];
}

function removeComment(comments: CommentData[], commentId: number): CommentData[] {
  return comments
    .filter((comment) => comment.id !== commentId)
    .map((comment) => ({
      ...comment,
      replies: removeComment(comment.replies, commentId)
    }));
}

function sortComments(comments: CommentData[]): CommentData[] {
  return [...comments]
    .sort((a, b) => {
      const byStart = a.startSeconds - b.startSeconds;
      if (byStart !== 0) return byStart;

      const byCreatedAt =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (byCreatedAt !== 0) return byCreatedAt;

      return a.id - b.id;
    })
    .map((comment) => ({
      ...comment,
      replies: sortComments(comment.replies)
    }));
}
