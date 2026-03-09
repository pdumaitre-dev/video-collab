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
}

export default function CommentList({
  comments,
  selectedCommentId,
  onSelect
}: CommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="mt-2 text-xs text-slate-500">
        No comments yet. Select a time range on the timeline to add one.
      </p>
    );
  }

  return (
    <ul className="mt-1 flex-1 space-y-2 overflow-y-auto pr-1 text-sm">
      {comments.map((c) => {
        const isSelected = c.id === selectedCommentId;
        return (
          <li
            key={c.id}
            className={`cursor-pointer rounded-md border px-3 py-2 text-xs transition-colors ${
              isSelected
                ? "border-sky-400 bg-sky-500/10"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-500"
            }`}
            onClick={() => onSelect(c.id)}
          >
            <div className="mb-1 flex items-center justify-between font-mono text-[11px] text-slate-400">
              <span>
                {formatTime(c.startSeconds)} – {formatTime(c.endSeconds)}
              </span>
              <span>{formatDateTime(c.createdAt)}</span>
            </div>
            <p className="text-slate-100">{c.text}</p>
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

