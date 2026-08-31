"use client";

import * as React from "react";

export type CommentData = {
  id: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  parentId?: number | null;
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
  const [expandedThreads, setExpandedThreads] = React.useState<Set<number>>(
    () => new Set()
  );
  const [replyingParentId, setReplyingParentId] = React.useState<number | null>(
    null
  );
  const [replyText, setReplyText] = React.useState("");
  const [isSubmittingReply, setIsSubmittingReply] = React.useState(false);

  const toggleExpand = (e: React.MouseEvent, commentId: number) => {
    e.stopPropagation();
    setExpandedThreads((prev) => {
      const next = new Set(prev);
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
    setReplyingParentId(commentId);
    setReplyText("");
    setExpandedThreads((prev) => new Set(prev).add(commentId));
  };

  const handleCancelReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    setReplyingParentId(null);
    setReplyText("");
  };

  const handleSubmitReply = async (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onReply || !replyText.trim() || isSubmittingReply) return;

    setIsSubmittingReply(true);
    try {
      await onReply(parentId, replyText.trim());
      setReplyText("");
      setReplyingParentId(null);
      setExpandedThreads((prev) => new Set(prev).add(parentId));
    } finally {
      setIsSubmittingReply(false);
    }
  };

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
    <ul className="mt-1 flex-1 space-y-2.5 overflow-y-auto pr-1 text-sm">
      {comments.map((c) => {
        const isSelected = c.id === selectedCommentId;
        const isDeleting = deletingId === c.id;
        const replies = c.replies ?? [];
        const replyCount = replies.length;
        const isExpanded = expandedThreads.has(c.id);
        const isReplying = replyingParentId === c.id;

        return (
          <li
            key={c.id}
            className={`group rounded-lg border px-3 py-3 text-sm transition-all ${
              isSelected
                ? "border-accent bg-accent-muted ring-1 ring-accent/30"
                : "border-white/[0.08] bg-surface-card hover:border-white/[0.12] hover:bg-surface-elevated"
            }`}
          >
            <div
              className="cursor-pointer"
              onClick={() => onSelect(c.id)}
            >
              <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-fg-muted">
                <span>
                  {formatTime(c.startSeconds)} – {formatTime(c.endSeconds)}
                </span>
                <div className="flex items-center gap-2">
                  <span>{formatDateTime(c.createdAt)}</span>
                  {onDelete && (
                    <button
                      type="button"
                      aria-label="Delete comment"
                      disabled={isDeleting}
                      onClick={(e) => handleDelete(e, c.id)}
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
              <p className="text-fg-primary leading-relaxed">{c.text}</p>
            </div>

            <div className="mt-2.5 flex items-center gap-3 border-t border-white/[0.04] pt-2 text-xs">
              {replyCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => toggleExpand(e, c.id)}
                  className="inline-flex items-center gap-1 font-medium text-accent hover:text-accent-hover transition-colors"
                >
                  <svg
                    className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {isExpanded
                    ? `Hide ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`
                    : `Show ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
                </button>
              )}

              {onReply && !isReplying && (
                <button
                  type="button"
                  onClick={(e) => handleStartReply(e, c.id)}
                  className="inline-flex items-center gap-1 text-fg-muted hover:text-fg-primary transition-colors"
                >
                  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
                    <path fillRule="evenodd" d="M1.5 8.25a6.75 6.75 0 0 1 11.026-5.187.75.75 0 0 1-.952 1.16 5.25 5.25 0 1 0 1.676 3.827.75.75 0 0 1 1.5 0A6.75 6.75 0 0 1 1.5 8.25ZM8.5 4.75a.75.75 0 0 0-1.5 0v3c0 .2.08.39.22.53l2 2a.75.75 0 0 0 1.06-1.06L8.5 7.44V4.75Z" clipRule="evenodd" />
                  </svg>
                  Reply
                </button>
              )}
            </div>

            {isExpanded && replyCount > 0 && (
              <div className="mt-2.5 space-y-2 border-l-2 border-white/[0.08] pl-3">
                {replies.map((reply) => {
                  const isReplySelected = reply.id === selectedCommentId;
                  const isReplyDeleting = deletingId === reply.id;
                  return (
                    <div
                      key={reply.id}
                      onClick={() => onSelect(reply.id)}
                      className={`group/reply cursor-pointer rounded-md border p-2.5 text-xs transition-all ${
                        isReplySelected
                          ? "border-accent bg-accent-muted ring-1 ring-accent/30"
                          : "border-white/[0.04] bg-surface-panel hover:border-white/[0.08] hover:bg-surface-elevated"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-fg-muted">
                        <span>Reply</span>
                        <div className="flex items-center gap-1.5">
                          <span>{formatDateTime(reply.createdAt)}</span>
                          {onDelete && (
                            <button
                              type="button"
                              aria-label="Delete reply"
                              disabled={isReplyDeleting}
                              onClick={(e) => handleDelete(e, reply.id)}
                              className="inline-flex h-4 w-4 items-center justify-center rounded text-fg-muted opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover/reply:opacity-100 disabled:opacity-50"
                            >
                              {isReplyDeleting ? (
                                <svg className="h-2.5 w-2.5 animate-spin" viewBox="0 0 16 16" fill="none">
                                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" />
                                </svg>
                              ) : (
                                <svg className="h-2.5 w-2.5" viewBox="0 0 16 16" fill="currentColor">
                                  <path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3V1.75ZM11 3V1.75A1.75 1.75 0 0 0 9.25 0h-2.5A1.75 1.75 0 0 0 5 1.75V3H2.75a.75.75 0 0 0 0 1.5h.31l.472 8.958A1.75 1.75 0 0 0 5.28 15h5.44a1.75 1.75 0 0 0 1.748-1.542L12.94 4.5h.31a.75.75 0 0 0 0-1.5H11Zm-5.47 1.5.46 8.73h4.02l.46-8.73H5.53Z" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-fg-primary leading-relaxed">{reply.text}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {isReplying && (
              <form
                onSubmit={(e) => handleSubmitReply(e, c.id)}
                className="mt-2.5 space-y-2 rounded-md border border-white/[0.08] bg-surface-panel p-2.5"
                onClick={(e) => e.stopPropagation()}
              >
                <textarea
                  className="min-h-[60px] w-full rounded border border-white/[0.08] bg-surface-page px-2.5 py-1.5 text-xs text-fg-primary placeholder:text-fg-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={isSubmittingReply}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCancelReply}
                    disabled={isSubmittingReply}
                    className="rounded px-2.5 py-1 text-xs text-fg-secondary hover:bg-surface-card transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSubmittingReply}
                    className="rounded bg-accent px-2.5 py-1 text-xs font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingReply ? "Posting..." : "Reply"}
                  </button>
                </div>
              </form>
            )}
          </li>
        );
      })}
    </ul>
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
