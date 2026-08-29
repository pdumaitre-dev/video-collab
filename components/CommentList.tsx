"use client";

import * as React from "react";

type CommentData = {
  id: number;
  parentId?: number | null;
  startSeconds: number;
  endSeconds: number;
  text: string;
  createdAt: string;
  replies?: CommentData[];
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
    () => new Set(comments.filter((comment) => comment.replies?.length).map((comment) => comment.id))
  );
  const [replyingToId, setReplyingToId] = React.useState<number | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [submittingReplyId, setSubmittingReplyId] = React.useState<number | null>(null);

  React.useEffect(() => {
    setExpandedIds((current) => {
      const next = new Set(current);
      for (const comment of comments) {
        if (comment.replies?.length) {
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

  const handleToggleReplies = (e: React.MouseEvent, commentId: number) => {
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

  const handleCancelReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    setReplyingToId(null);
    setReplyText("");
  };

  const handleSubmitReply = async (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = replyText.trim();
    if (!onReply || !trimmed || submittingReplyId !== null) return;

    setSubmittingReplyId(parentId);
    try {
      await onReply(parentId, trimmed);
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
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          selectedCommentId={selectedCommentId}
          deletingId={deletingId}
          expandedIds={expandedIds}
          replyingToId={replyingToId}
          replyText={replyText}
          submittingReplyId={submittingReplyId}
          onSelect={onSelect}
          onDelete={onDelete ? handleDelete : undefined}
          onReply={onReply}
          onToggleReplies={handleToggleReplies}
          onStartReply={handleStartReply}
          onCancelReply={handleCancelReply}
          onReplyTextChange={setReplyText}
          onSubmitReply={handleSubmitReply}
        />
      ))}
    </ul>
  );
}

interface CommentItemProps {
  comment: CommentData;
  selectedCommentId: number | null;
  deletingId: number | null;
  expandedIds: Set<number>;
  replyingToId: number | null;
  replyText: string;
  submittingReplyId: number | null;
  depth?: number;
  onSelect: (commentId: number) => void;
  onDelete?: (e: React.MouseEvent, commentId: number) => Promise<void> | void;
  onReply?: (parentId: number, text: string) => Promise<void> | void;
  onToggleReplies: (e: React.MouseEvent, commentId: number) => void;
  onStartReply: (e: React.MouseEvent, commentId: number) => void;
  onCancelReply: (e: React.MouseEvent) => void;
  onReplyTextChange: (text: string) => void;
  onSubmitReply: (e: React.FormEvent, parentId: number) => Promise<void> | void;
}

function CommentItem({
  comment,
  selectedCommentId,
  deletingId,
  expandedIds,
  replyingToId,
  replyText,
  submittingReplyId,
  depth = 0,
  onSelect,
  onDelete,
  onReply,
  onToggleReplies,
  onStartReply,
  onCancelReply,
  onReplyTextChange,
  onSubmitReply
}: CommentItemProps) {
  const replies = comment.replies ?? [];
  const isExpanded = expandedIds.has(comment.id);
  const isSelected = comment.id === selectedCommentId;
  const isDeleting = deletingId === comment.id;
  const isReplying = replyingToId === comment.id;
  const isSubmittingReply = submittingReplyId === comment.id;
  const showReplies = replies.length > 0 && isExpanded;

  return (
    <li className={depth === 0 ? "" : "ml-4 border-l border-white/[0.08] pl-3"}>
      <div
        className={`group cursor-pointer rounded-lg border px-3 py-3 text-sm transition-all ${
          isSelected
            ? "border-accent bg-accent-muted ring-1 ring-accent/30"
            : "border-white/[0.08] bg-surface-card hover:border-white/[0.12] hover:bg-surface-elevated"
        }`}
        onClick={() => onSelect(comment.id)}
      >
        <div className="mb-1.5 flex items-center justify-between gap-2 font-mono text-[11px] text-fg-muted">
          <span>
            {formatTime(comment.startSeconds)} – {formatTime(comment.endSeconds)}
          </span>
          <div className="flex items-center gap-2">
            <span>{formatDateTime(comment.createdAt)}</span>
            {onDelete && (
              <button
                type="button"
                aria-label="Delete comment"
                disabled={isDeleting}
                onClick={(e) => onDelete(e, comment.id)}
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
        <div className="mt-3 flex items-center gap-3 text-xs">
          {replies.length > 0 && (
            <button
              type="button"
              onClick={(e) => onToggleReplies(e, comment.id)}
              className="text-fg-secondary transition-colors hover:text-fg-primary"
            >
              {isExpanded ? "Hide" : "Show"} {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </button>
          )}
          {onReply && (
            <button
              type="button"
              onClick={(e) => onStartReply(e, comment.id)}
              className="text-accent transition-colors hover:text-accent-hover"
            >
              Reply
            </button>
          )}
        </div>
        {isReplying && (
          <form
            className="mt-3 space-y-2"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => onSubmitReply(e, comment.id)}
          >
            <textarea
              className="min-h-[70px] w-full rounded-md border border-white/[0.08] bg-surface-page px-3 py-2 text-sm text-fg-primary placeholder:text-fg-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
              placeholder="Add a reply on this range..."
              value={replyText}
              onChange={(e) => onReplyTextChange(e.target.value)}
              disabled={isSubmittingReply}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancelReply}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-fg-secondary transition-colors hover:bg-white/[0.06] hover:text-fg-primary"
              >
                Cancel
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
      {showReplies && (
        <ul className="mt-2 space-y-2">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              selectedCommentId={selectedCommentId}
              deletingId={deletingId}
              expandedIds={expandedIds}
              replyingToId={replyingToId}
              replyText={replyText}
              submittingReplyId={submittingReplyId}
              depth={depth + 1}
              onSelect={onSelect}
              onDelete={onDelete}
              onReply={onReply}
              onToggleReplies={onToggleReplies}
              onStartReply={onStartReply}
              onCancelReply={onCancelReply}
              onReplyTextChange={onReplyTextChange}
              onSubmitReply={onSubmitReply}
            />
          ))}
        </ul>
      )}
    </li>
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

