"use client";

import * as React from "react";
import VideoPageShell, {
  type CommentData,
  type PersistCommentFn,
  type PersistReplyFn,
  type DeleteCommentFn
} from "../../[videoId]/VideoPageShell";

const STORAGE_PREFIX = "video-comments:";

type StoredComment = CommentData & {
  parentId?: number | null;
};

function buildCommentTreeFromFlat(comments: StoredComment[]): CommentData[] {
  const roots = comments
    .filter((comment) => !comment.parentId)
    .map((comment) => ({ ...comment, replies: [] as CommentData[] }));

  const repliesByParent = new Map<number, CommentData[]>();

  for (const comment of comments) {
    if (!comment.parentId) continue;
    const reply: CommentData = {
      id: comment.id,
      startSeconds: comment.startSeconds,
      endSeconds: comment.endSeconds,
      text: comment.text,
      createdAt: comment.createdAt,
      parentId: comment.parentId
    };
    const existing = repliesByParent.get(comment.parentId) ?? [];
    existing.push(reply);
    repliesByParent.set(comment.parentId, existing);
  }

  return roots
    .map((comment) => ({
      ...comment,
      replies: (repliesByParent.get(comment.id) ?? []).sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt)
      )
    }))
    .sort((a, b) => {
      if (a.startSeconds !== b.startSeconds) {
        return a.startSeconds - b.startSeconds;
      }
      return a.createdAt.localeCompare(b.createdAt);
    });
}

function flattenCommentTree(comments: CommentData[]): StoredComment[] {
  const flat: StoredComment[] = [];

  for (const comment of comments) {
    flat.push({
      id: comment.id,
      startSeconds: comment.startSeconds,
      endSeconds: comment.endSeconds,
      text: comment.text,
      createdAt: comment.createdAt,
      parentId: null
    });

    for (const reply of comment.replies ?? []) {
      flat.push({
        id: reply.id,
        startSeconds: reply.startSeconds,
        endSeconds: reply.endSeconds,
        text: reply.text,
        createdAt: reply.createdAt,
        parentId: comment.id
      });
    }
  }

  return flat;
}

function loadCommentsFromStorage(sourceUrl: string): CommentData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + sourceUrl);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredComment[];
    if (!Array.isArray(parsed)) return [];
    return buildCommentTreeFromFlat(parsed);
  } catch {
    return [];
  }
}

function saveCommentsToStorage(sourceUrl: string, comments: CommentData[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_PREFIX + sourceUrl,
      JSON.stringify(flattenCommentTree(comments))
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

  React.useEffect(() => {
    if (pathname) {
      fetch(`/api/blob/comments?pathname=${encodeURIComponent(pathname)}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data: CommentData[]) => {
          setInitialComments(
            Array.isArray(data)
              ? data.map((comment) => ({
                  ...comment,
                  replies: comment.replies ?? []
                }))
              : []
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

        const created = (await res.json()) as CommentData;
        return {
          id: created.id,
          startSeconds: created.startSeconds,
          endSeconds: created.endSeconds,
          text: created.text,
          createdAt: created.createdAt,
          parentId: created.parentId ?? null,
          replies: []
        };
      }

      const current = loadCommentsFromStorage(sourceUrl);
      const newComment: CommentData = {
        id: Date.now(),
        startSeconds: range.startSeconds,
        endSeconds: range.endSeconds,
        text,
        createdAt: new Date().toISOString(),
        replies: []
      };
      const updated = [...current, newComment].sort((a, b) => {
        if (a.startSeconds !== b.startSeconds) {
          return a.startSeconds - b.startSeconds;
        }
        return a.createdAt.localeCompare(b.createdAt);
      });
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

        const created = (await res.json()) as CommentData;
        return {
          id: created.id,
          startSeconds: created.startSeconds,
          endSeconds: created.endSeconds,
          text: created.text,
          createdAt: created.createdAt,
          parentId: created.parentId ?? parentId
        };
      }

      const current = loadCommentsFromStorage(sourceUrl);
      const parent = current.find((comment) => comment.id === parentId);
      if (!parent) {
        throw new Error("Parent comment not found");
      }

      const reply: CommentData = {
        id: Date.now(),
        startSeconds: parent.startSeconds,
        endSeconds: parent.endSeconds,
        text,
        createdAt: new Date().toISOString(),
        parentId
      };

      const updated = current.map((comment) =>
        comment.id === parentId
          ? {
              ...comment,
              replies: [...(comment.replies ?? []), reply].sort((a, b) =>
                a.createdAt.localeCompare(b.createdAt)
              )
            }
          : comment
      );
      saveCommentsToStorage(sourceUrl, updated);
      return reply;
    },
    [pathname, sourceUrl]
  );

  const deleteComment: DeleteCommentFn = React.useCallback(
    async (commentId: number) => {
      if (pathname) {
        const res = await fetch(`/api/blob/comments?id=${commentId}`, {
          method: "DELETE"
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Failed to delete comment");
        }
        return;
      }

      const current = loadCommentsFromStorage(sourceUrl);
      const updated = current
        .filter((comment) => comment.id !== commentId)
        .map((comment) => ({
          ...comment,
          replies: comment.replies?.filter((reply) => reply.id !== commentId) ?? []
        }));
      saveCommentsToStorage(sourceUrl, updated);
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
