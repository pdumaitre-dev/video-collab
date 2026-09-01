"use client";

import * as React from "react";

export type CommentData = {
  id: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  createdAt: string;
  parentId?: number | null;
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
  if (comments.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-white/[0.12] bg-surface-card/50 py-8 text-center">
        <p className="text-sm text-fg-secondary">No comments yet.</p>
        <p className="mt-1 text-xs text-fg-muted">
          Select a time range on the time bar to add one.
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-1 flex-1 space-y-2 overflow-y-auto pr-1 text-sm">
      {comments.map((comment) => (
        <CommentThread
          key={comment.id}
          comment={comment}
          selectedCommentId={selectedCommentId}
          onSelect={onSelect}
          onDelete={onDelete}
          onReply={onReply}
        />
      ))}
    </ul>
  );
}

interface CommentThreadProps {
  comment: CommentData;
  selectedCommentId: number | null;
  onSelect: (commentId: number) => void;
  onDelete?: (commentId: number) => Promise<void> | void;
  onReply?: (parentId: number, text: string) => Promise<void> | void;
}

function CommentThread({
  comment,
  selectedCommentId,
  onSelect,
  onDelete,
  onReply
}: CommentThreadProps) {
  const replies = comment.replies ?? [];
  const [expanded, setExpanded] = React.useState(false);
  const [showReplyForm, setShowReplyForm] = React.useState(false);
  const [replyText, setReplyText] = React.useState("");
  const [submittingReply, setSubmittingReply] = React.useState(false);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed || !onReply || submittingReply) return;

    setSubmittingReply(true);
    try {
      await onReply(comment.id, trimmed);
      setReplyText("");
      setShowReplyForm(false);
      setExpanded(true);
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <li>
      <CommentCard
        comment={comment}
        isSelected={comment.id === selectedCommentId}
        onSelect={() => onSelect(comment.id)}
        onDelete={onDelete}
      />

      <div className="mt-2 flex flex-wrap items-center gap-2 pl-3">
        {replies.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="text-xs font-medium text-fg-secondary transition-colors hover:text-fg-primary"
          >
            {expanded ? "Hide" : "Show"} {replies.length}{" "}
            {replies.length === 1 ? "reply" : "replies"}
          </button>
        )}
        {onReply && (
          <button
            type="button"
            onClick={() => {
              setShowReplyForm((value) => !value);
              setExpanded(true);
            }}
            className="text-xs font-medium text-accent transition-colors hover:text-accent-hover"
          >
            {showReplyForm ? "Cancel reply" : "Reply"}
          </button>
        )}
      </div>

      {showReplyForm && onReply && (
        <form
          onSubmit={handleReplySubmit}
          className="mt-2 space-y-2 rounded-lg border border-white/[0.08] bg-surface-card/60 p-3"
        >
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            disabled={submittingReply}
            className="min-h-[64px] w-full rounded-md border border-white/[0.08] bg-surface-page px-3 py-2 text-sm text-fg-primary placeholder:text-fg-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!replyText.trim() || submittingReply}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submittingReply ? "Saving..." : "Post reply"}
            </button>
          </div>
        </form>
      )}

      {expanded && replies.length > 0 && (
        <ul className="mt-2 space-y-2 border-l border-white/[0.08] pl-3">
          {replies.map((reply) => (
            <li key={reply.id}>
              <CommentCard
                comment={reply}
                isSelected={reply.id === selectedCommentId}
                onSelect={() => onSelect(reply.id)}
                onDelete={onDelete}
                isReply
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

interface CommentCardProps {
  comment: CommentData;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: (commentId: number) => Promise<void> | void;
  isReply?: boolean;
}

function CommentCard({
  comment,
  isSelected,
  onSelect,
  onDelete,
  isReply = false
}: CommentCardProps) {
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete || deleting) return;

    setDeleting(true);
    try {
      await onDelete(comment.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={`group cursor-pointer rounded-lg border px-3 py-3 text-sm transition-all ${
        isSelected
          ? "border-accent bg-accent-muted ring-1 ring-accent/30"
          : "border-white/[0.08] bg-surface-card hover:border-white/[0.12] hover:bg-surface-elevated"
      } ${isReply ? "py-2.5" : ""}`}
      onClick={onSelect}
    >
      <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-fg-muted">
        <span>
          {isReply ? (
            <span className="text-fg-secondary">Reply</span>
          ) : (
            <>
              {formatTime(comment.startSeconds)} – {formatTime(comment.endSeconds)}
            </>
          )}
        </span>
        <div className="flex items-center gap-2">
          <span>{formatDateTime(comment.createdAt)}</span>
          {onDelete && (
            <button
              type="button"
              aria-label="Delete comment"
              disabled={deleting}
              onClick={handleDelete}
              className="inline-flex h-5 w-5 items-center justify-center rounded text-fg-muted opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100 disabled:opacity-50"
            >
              {deleting ? (
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 16 16" fill="none">
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="28"
                    strokeDashoffset="8"
                  />
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
      <p className="text-fg-primary leading-relaxed">{comment.text}</p>
    </div>
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
