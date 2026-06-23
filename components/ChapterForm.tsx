"use client";

import * as React from "react";

interface ChapterFormProps {
  currentTime: number;
  durationSeconds: number;
  onSubmit: (label: string) => Promise<void> | void;
}

export default function ChapterForm({
  currentTime,
  durationSeconds,
  onSubmit
}: ChapterFormProps) {
  const [label, setLabel] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const canSubmit =
    durationSeconds > 0 && label.trim().length > 0 && !submitting;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      await onSubmit(label.trim());
      setLabel("");
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
          Add chapter at playhead
          <span className="ml-2 font-mono text-[11px] text-accent-hover">
            {formatTime(currentTime)}
          </span>
        </span>
      </div>
      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-md border border-white/[0.08] bg-surface-page px-3 py-2 text-sm text-fg-primary placeholder:text-fg-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
          placeholder={
            durationSeconds > 0
              ? "Chapter label, e.g. Solo"
              : "Load the video to add chapters"
          }
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          maxLength={80}
          disabled={durationSeconds <= 0 || submitting}
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Add"}
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
