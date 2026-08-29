"use client";

import * as React from "react";

interface ChapterFormProps {
  currentTime: number;
  canCreate: boolean;
  onSubmit: (label: string) => Promise<void> | void;
}

export default function ChapterForm({
  currentTime,
  canCreate,
  onSubmit
}: ChapterFormProps) {
  const [label, setLabel] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const trimmedLabel = label.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate || !trimmedLabel) return;

    try {
      setSubmitting(true);
      await onSubmit(trimmedLabel);
      setLabel("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-white/[0.08] bg-surface-card p-3"
    >
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-fg-primary">Add chapter</span>
        <span className="font-mono text-[11px] text-fg-muted">
          {formatTime(currentTime)}
        </span>
      </div>
      <input
        className="w-full rounded-md border border-white/[0.08] bg-surface-page px-3 py-2 text-sm text-fg-primary placeholder:text-fg-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-60"
        placeholder={
          canCreate
            ? "Chapter label, e.g. Coda"
            : "Chapters require a blob-backed video."
        }
        value={label}
        maxLength={80}
        onChange={(e) => setLabel(e.target.value)}
        disabled={!canCreate || submitting}
      />
      <button
        type="submit"
        disabled={!canCreate || !trimmedLabel || submitting}
        className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Adding..." : "Add chapter here"}
      </button>
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
