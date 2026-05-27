"use client";

import * as React from "react";
import VideoPageShell, {
  type CommentData,
  type PersistCommentFn,
  type DeleteCommentFn
} from "../../[videoId]/VideoPageShell";

const STORAGE_PREFIX = "video-comments:";

function normalizeComment(comment: Partial<CommentData>): CommentData {
  return {
    id: typeof comment.id === "number" ? comment.id : Date.now(),
    parentId:
      typeof comment.parentId === "number" ? comment.parentId : null,
    startSeconds:
      typeof comment.startSeconds === "number" ? comment.startSeconds : 0,
    endSeconds:
      typeof comment.endSeconds === "number" ? comment.endSeconds : 0,
    text: typeof comment.text === "string" ? comment.text : "",
    createdAt:
      typeof comment.createdAt === "string"
        ? comment.createdAt
        : new Date().toISOString(),
    replies: Array.isArray(comment.replies)
      ? comment.replies.map((reply) => normalizeComment(reply))
      : []
  };
}

function loadCommentsFromStorage(sourceUrl: string): CommentData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + sourceUrl);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<CommentData>[];
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
        .then((data: Partial<CommentData>[]) => {
          setInitialComments(data.map(normalizeComment));
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
            parentId,
            startSeconds: range.startSeconds,
            endSeconds: range.endSeconds,
            text
          })
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to create comment");
        }

        const created = (await res.json()) as Partial<CommentData>;

        return normalizeComment(created);
      }

      const current = loadCommentsFromStorage(sourceUrl);
      const newComment: CommentData = {
        id: Date.now(),
        parentId,
        startSeconds: range.startSeconds,
        endSeconds: range.endSeconds,
        text,
        createdAt: new Date().toISOString(),
        replies: []
      };
      const updated = insertCommentIntoTree(current, newComment);
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

function compareComments(a: CommentData, b: CommentData) {
  return (
    a.startSeconds - b.startSeconds ||
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
    a.id - b.id
  );
}

function sortCommentTree(comments: CommentData[]): CommentData[] {
  return comments
    .map((comment) => ({
      ...comment,
      replies: sortCommentTree(comment.replies)
    }))
    .sort(compareComments);
}

function insertCommentIntoTree(
  comments: CommentData[],
  created: CommentData
): CommentData[] {
  if (created.parentId === null) {
    return sortCommentTree([...comments, created]);
  }

  return comments.map((comment) => {
    if (comment.id === created.parentId) {
      return {
        ...comment,
        replies: sortCommentTree([...comment.replies, created])
      };
    }

    return {
      ...comment,
      replies: insertCommentIntoTree(comment.replies, created)
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
