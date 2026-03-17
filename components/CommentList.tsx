"use client";

import * as React from "react";

type CommentData = {
  id: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  createdAt: string;
};

interface CommentListProps {
  comments: CommentData[];
  selectedCommentId: number | null;
  onSelect: (commentId: number) => void;
  onDelete: (commentId: number) => Promise<void> | void;
  deletingCommentId: number | null;
}

export default function CommentList({
  comments,
  selectedCommentId,
  onSelect,
  onDelete,
  deletingCommentId
}: CommentListProps) {
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
      {comments.map((c) => {
        const isSelected = c.id === selectedCommentId;
        return (
          <li
            key={c.id}
            className={`cursor-pointer rounded-lg border px-3 py-3 text-sm transition-all ${
              isSelected
                ? "border-accent bg-accent-muted ring-1 ring-accent/30"
                : "border-white/[0.08] bg-surface-card hover:border-white/[0.12] hover:bg-surface-elevated"
            }`}
            onClick={() => onSelect(c.id)}
          >
            <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] text-fg-muted">
              <span>
                {formatTime(c.startSeconds)} – {formatTime(c.endSeconds)}
              </span>
              <span>{formatDateTime(c.createdAt)}</span>
            </div>
            <p className="text-fg-primary leading-relaxed">{c.text}</p>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void onDelete(c.id);
                }}
                disabled={deletingCommentId === c.id}
                className="rounded-md border border-white/[0.12] px-2 py-1 text-xs text-fg-secondary transition-colors hover:bg-surface-elevated hover:text-fg-primary disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Delete comment"
              >
                {deletingCommentId === c.id ? "Deleting..." : "Delete"}
              </button>
            </div>
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

