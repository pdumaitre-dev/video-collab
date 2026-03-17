"use client";

import * as React from "react";

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

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
  onDelete?: (commentId: number) => void;
}

export default function CommentList({
  comments,
  selectedCommentId,
  onSelect,
  onDelete
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
            <div className="mb-1.5 flex items-center justify-between gap-2 font-mono text-[11px] text-fg-muted">
              <span>
                {formatTime(c.startSeconds)} – {formatTime(c.endSeconds)}
              </span>
              <span className="flex items-center gap-1">
                <span>{formatDateTime(c.createdAt)}</span>
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(c.id);
                    }}
                    aria-label="Delete comment"
                    className="rounded p-0.5 text-fg-muted transition-colors hover:bg-red-500/20 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            </div>
            <p className="text-fg-primary leading-relaxed">{c.text}</p>
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

