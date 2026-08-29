"use client";

import * as React from "react";

interface ChapterFormProps {
  currentTime: number;
  onSubmit: (label: string) => Promise<void>;
  disabled?: boolean;
}

export default function ChapterForm({
  currentTime,
  onSubmit,
  disabled = false
}: ChapterFormProps) {
  const [label, setLabel] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed || isSubmitting || disabled) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      setLabel("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add chapter");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Chapter name (e.g. Adagio)"
          maxLength={80}
          disabled={disabled || isSubmitting}
          className="min-w-0 flex-1 rounded-md border border-white/[0.12] bg-surface-card px-3 py-2 text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || isSubmitting || !label.trim()}
          className="shrink-0 rounded-md bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Adding…" : "Add chapter"}
        </button>
      </div>
      <p className="text-xs text-fg-muted">
        Pins at {formatTime(currentTime)}
      </p>
      {error && <p className="text-xs text-red-400">{error}</p>}
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
