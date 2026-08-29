"use client";

import * as React from "react";

type CommentData = {
  id: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  parentId: number | null;
  createdAt: string;
  replies: CommentData[];
};

interface CommentListProps {
  comments: CommentData[];
  selectedCommentId: number | null;
  onSelect: (commentId: number) => void;
  onDelete?: (commentId: number) => Promise<void> | void;
  onReply?: (parentId: number, text: string) => Promise<void> | void;
}

export default function CommentList({
  comments,
  selectedCommentId,
  onSelect,
  onDelete,
  onReply
}: CommentListProps) {
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [expandedIds, setExpandedIds] = React.useState<Set<number>>(
    () => new Set(comments.map((comment) => comment.id))
  );
  const [replyingToId, setReplyingToId] = React.useState<number | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [submittingReplyId, setSubmittingReplyId] = React.useState<number | null>(
    null
  );

  React.useEffect(() => {
    setExpandedIds((current) => {
      const next = new Set(current);
      for (const comment of comments) {
        if (comment.replies.length > 0) {
          next.add(comment.id);
        }
      }
      return next;
    });
  }, [comments]);

  const handleDelete = async (e: React.MouseEvent, commentId: number) => {
    e.stopPropagation();
    if (!onDelete || deletingId !== null) return;

    setDeletingId(commentId);
    try {
      await onDelete(commentId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleExpanded = (e: React.MouseEvent, commentId: number) => {
    e.stopPropagation();
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const handleStartReply = (e: React.MouseEvent, commentId: number) => {
    e.stopPropagation();
    setReplyingToId(commentId);
    setReplyText("");
    setExpandedIds((current) => new Set(current).add(commentId));
  };

  const handleReplySubmit = async (
    e: React.FormEvent,
    parentId: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!onReply || !replyText.trim() || submittingReplyId !== null) return;

    setSubmittingReplyId(parentId);
    try {
      await onReply(parentId, replyText.trim());
      setReplyText("");
      setReplyingToId(null);
      setExpandedIds((current) => new Set(current).add(parentId));
    } finally {
      setSubmittingReplyId(null);
    }
  };

  if (comments.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-white/[0.12] bg-surface-card/50 py-8 text-center">
        <p className="text-sm text-fg-secondary">
          No comments yet.
        </p>
        <p className="mt-1 text-xs text-fg-muted">
          Select a time range on the time bar to add one.
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-1 flex-1 space-y-2 overflow-y-auto pr-1 text-sm">
      {comments.map((comment) =>
        renderComment({
          comment,
          selectedCommentId,
          deletingId,
          expandedIds,
          replyingToId,
          replyText,
          submittingReplyId,
          onSelect,
          onDelete,
          onReply,
          onDeleteClick: handleDelete,
          onToggleExpanded: handleToggleExpanded,
          onStartReply: handleStartReply,
          onReplyTextChange: setReplyText,
          onReplySubmit: handleReplySubmit,
          level: 0
        })
      )}
    </ul>
  );
}

interface RenderCommentArgs {
  comment: CommentData;
  selectedCommentId: number | null;
  deletingId: number | null;
  expandedIds: Set<number>;
  replyingToId: number | null;
  replyText: string;
  submittingReplyId: number | null;
  onSelect: (commentId: number) => void;
  onDelete?: (commentId: number) => Promise<void> | void;
  onReply?: (parentId: number, text: string) => Promise<void> | void;
  onDeleteClick: (e: React.MouseEvent, commentId: number) => Promise<void>;
  onToggleExpanded: (e: React.MouseEvent, commentId: number) => void;
  onStartReply: (e: React.MouseEvent, commentId: number) => void;
  onReplyTextChange: (text: string) => void;
  onReplySubmit: (e: React.FormEvent, parentId: number) => Promise<void>;
  level: number;
}

function renderComment({
  comment,
  selectedCommentId,
  deletingId,
  expandedIds,
  replyingToId,
  replyText,
  submittingReplyId,
  onSelect,
  onDelete,
  onReply,
  onDeleteClick,
  onToggleExpanded,
  onStartReply,
  onReplyTextChange,
  onReplySubmit,
  level
}: RenderCommentArgs): React.ReactNode {
  const isSelected = comment.id === selectedCommentId;
  const isDeleting = deletingId === comment.id;
  const isExpanded = expandedIds.has(comment.id);
  const hasReplies = comment.replies.length > 0;
  const isReplying = replyingToId === comment.id;
  const isSubmittingReply = submittingReplyId === comment.id;
  const replyCount = countReplies(comment);

  return (
    <li key={comment.id} className={level > 0 ? "mt-2" : undefined}>
      <div
        className={`group cursor-pointer rounded-lg border px-3 py-3 text-sm transition-all ${
          isSelected
            ? "border-accent bg-accent-muted ring-1 ring-accent/30"
            : "border-white/[0.08] bg-surface-card hover:border-white/[0.12] hover:bg-surface-elevated"
        }`}
        onClick={() => onSelect(comment.id)}
        style={level > 0 ? { marginLeft: Math.min(level, 3) * 12 } : undefined}
      >
        <div className="mb-1.5 flex items-center justify-between gap-2 font-mono text-[11px] text-fg-muted">
          <span>
            {formatTime(comment.startSeconds)} – {formatTime(comment.endSeconds)}
          </span>
          <div className="flex items-center gap-1.5">
            <span>{formatDateTime(comment.createdAt)}</span>
            {hasReplies && (
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Collapse replies" : "Expand replies"}
                onClick={(e) => onToggleExpanded(e, comment.id)}
                className="rounded px-1 py-0.5 font-sans text-[10px] text-fg-muted transition-colors hover:bg-white/[0.08] hover:text-fg-primary"
              >
                {isExpanded ? "Hide" : "Show"} {replyCount}
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                aria-label="Delete comment"
                disabled={isDeleting}
                onClick={(e) => onDeleteClick(e, comment.id)}
                className="inline-flex h-5 w-5 items-center justify-center rounded text-fg-muted opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100 disabled:opacity-50"
              >
                {isDeleting ? (
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" />
                  </svg>
                ) : (
                  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3V1.75ZM11 3V1.75A1.75 1.75 0 0 0 9.25 0h-2.5A1.75 1.75 0 0 0 5 1.75V3H2.75a.75.75 0 0 0 0 1.5h.31l.472 8.958A1.75 1.75 0 0 0 5.28 15h5.44a1.75 1.75 0 0 0 1.748-1.542L12.94 4.5h.31a.75.75 0 0 0 0-1.5H11Zm-5.47 1.5.46 8.73h4.02l.46-8.73H5.53Z" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
        <p className="leading-relaxed text-fg-primary">{comment.text}</p>
        {onReply && (
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={(e) => onStartReply(e, comment.id)}
              className="rounded px-2 py-1 text-xs font-medium text-fg-secondary transition-colors hover:bg-white/[0.08] hover:text-fg-primary"
            >
              Reply
            </button>
          </div>
        )}
        {isReplying && (
          <form
            className="mt-3 space-y-2"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => onReplySubmit(e, comment.id)}
          >
            <textarea
              className="min-h-[64px] w-full rounded-md border border-white/[0.08] bg-surface-page px-3 py-2 text-sm text-fg-primary placeholder:text-fg-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
              placeholder="Reply on this same time range..."
              value={replyText}
              onChange={(e) => onReplyTextChange(e.target.value)}
              disabled={isSubmittingReply}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReplyTextChange("");
                }}
                className="rounded-md border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-fg-secondary transition-colors hover:bg-white/[0.08] hover:text-fg-primary"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={!replyText.trim() || isSubmittingReply}
                className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmittingReply ? "Saving..." : "Save reply"}
              </button>
            </div>
          </form>
        )}
      </div>
      {hasReplies && isExpanded && (
        <ul className="border-l border-white/[0.08] pl-2">
          {comment.replies.map((reply) =>
            renderComment({
              comment: reply,
              selectedCommentId,
              deletingId,
              expandedIds,
              replyingToId,
              replyText,
              submittingReplyId,
              onSelect,
              onDelete,
              onReply,
              onDeleteClick,
              onToggleExpanded,
              onStartReply,
              onReplyTextChange,
              onReplySubmit,
              level: level + 1
            })
          )}
        </ul>
      )}
    </li>
  );
}

function countReplies(comment: CommentData): number {
  return comment.replies.reduce(
    (total, reply) => total + 1 + countReplies(reply),
    0
  );
}

function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const seconds = Math.floor(totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  const padded = remaining.toString().padStart(2, "0");
  return `${minutes}:${padded}`;
}

/** Format ISO date string as HH:mm - same on server and client to avoid hydration mismatch. */
function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const h = date.getUTCHours().toString().padStart(2, "0");
  const m = date.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

