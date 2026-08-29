"use client";

import * as React from "react";

const COLOR_OPTIONS = [
  { label: "Amber", value: "#f59e0b" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#10b981" },
  { label: "Pink", value: "#ec4899" }
];

interface ChapterFormProps {
  currentTime: number;
  durationSeconds: number;
  onSubmit: (chapter: { label: string; seconds: number; color: string }) => Promise<void>;
}

export default function ChapterForm({
  currentTime,
  durationSeconds,
  onSubmit
}: ChapterFormProps) {
  const [label, setLabel] = React.useState("");
  const [color, setColor] = React.useState(COLOR_OPTIONS[0].value);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSubmit = durationSeconds > 0 && label.trim().length > 0 && !isSubmitting;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        label: label.trim(),
        seconds: Math.min(Math.max(currentTime, 0), durationSeconds),
        color
      });
      setLabel("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to add chapter"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-white/[0.08] bg-surface-card p-4"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-sm font-semibold text-fg-primary">
            Add chapter
          </h3>
          <p className="mt-1 text-xs text-fg-muted">
            Pins a named bookmark at {formatTime(currentTime)}.
          </p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-surface-page px-2 py-1 font-mono text-[11px] text-fg-secondary">
          {formatTime(currentTime)}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto]">
        <label className="sr-only" htmlFor="chapter-label">
          Chapter label
        </label>
        <input
          id="chapter-label"
          type="text"
          value={label}
          maxLength={80}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Adagio, Solo, Coda..."
          className="min-h-10 rounded-md border border-white/[0.08] bg-surface-page px-3 text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none"
          disabled={isSubmitting || durationSeconds <= 0}
        />
        <label className="sr-only" htmlFor="chapter-color">
          Chapter color
        </label>
        <select
          id="chapter-color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          className="min-h-10 rounded-md border border-white/[0.08] bg-surface-page px-3 text-sm text-fg-primary focus:border-accent focus:outline-none"
          disabled={isSubmitting || durationSeconds <= 0}
        >
          {COLOR_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Adding..." : "Add"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
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
