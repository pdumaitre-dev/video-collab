"use client";

import * as React from "react";

interface SelectedRange {
  startSeconds: number;
  endSeconds: number;
}

interface CommentFormProps {
  selectedRange: SelectedRange | null;
  onSubmit: (text: string) => Promise<void> | void;
}

export default function CommentForm({
  selectedRange,
  onSubmit
}: CommentFormProps) {
  const [text, setText] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRange || !text.trim()) return;

    try {
      setSubmitting(true);
      await onSubmit(text.trim());
      setText("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-white/[0.08] bg-surface-card p-4"
    >
      <div className="text-xs">
        <span className="font-medium text-fg-primary">
          Add comment on range
          {selectedRange && (
            <span className="ml-2 font-mono text-[11px]" style={{ color: "#fde68a" }}>
              {formatTime(selectedRange.startSeconds)} – {formatTime(selectedRange.endSeconds)}
            </span>
          )}
        </span>
      </div>
      <textarea
        className="min-h-[80px] w-full rounded-md border border-white/[0.08] bg-surface-page px-3 py-2 text-sm text-fg-primary placeholder:text-fg-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
        placeholder="Add your question or note about this segment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={!selectedRange || submitting}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!selectedRange || !text.trim() || submitting}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save comment"}
        </button>
      </div>
    </form>
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

