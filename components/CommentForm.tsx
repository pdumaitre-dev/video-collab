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
      className="space-y-2 rounded-md border border-slate-800 bg-slate-900/60 p-3"
    >
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="font-semibold text-slate-300">
          New comment on range
        </span>
        {selectedRange ? (
          <span>
            {formatTime(selectedRange.startSeconds)} –{" "}
            {formatTime(selectedRange.endSeconds)}
          </span>
        ) : (
          <span className="italic text-slate-500">
            Select a range on the time bar
          </span>
        )}
      </div>
      <textarea
        className="min-h-[72px] w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-sm text-slate-50 outline-none focus:border-sky-500"
        placeholder="Add your question or note about this segment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={!selectedRange || submitting}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!selectedRange || !text.trim() || submitting}
          className="rounded-md bg-sky-500 px-3 py-1 text-xs font-medium text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700"
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

