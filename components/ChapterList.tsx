"use client";

import * as React from "react";

export type ChapterData = {
  id: number;
  seconds: number;
  label: string;
  color: string | null;
  createdAt: string;
};

type ChapterDraft = {
  label: string;
  color: string;
};

interface ChapterListProps {
  chapters: ChapterData[];
  currentTime: number;
  durationSeconds: number;
  onCreate: (draft: ChapterDraft) => Promise<void> | void;
  onUpdate: (
    chapterId: number,
    draft: ChapterDraft & { seconds: number }
  ) => Promise<void> | void;
  onDelete: (chapterId: number) => Promise<void> | void;
  onSelect: (chapterId: number) => void;
  selectedChapterId: number | null;
}

const CHAPTER_COLORS = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Emerald", value: "#10b981" }
];

const DEFAULT_CHAPTER_COLOR = CHAPTER_COLORS[0].value;

export default function ChapterList({
  chapters,
  currentTime,
  durationSeconds,
  onCreate,
  onUpdate,
  onDelete,
  onSelect,
  selectedChapterId
}: ChapterListProps) {
  const [label, setLabel] = React.useState("");
  const [color, setColor] = React.useState(DEFAULT_CHAPTER_COLOR);
  const [submitting, setSubmitting] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editingLabel, setEditingLabel] = React.useState("");
  const [editingColor, setEditingColor] = React.useState(DEFAULT_CHAPTER_COLOR);
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const canCreate = label.trim().length > 0 && durationSeconds > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreate || submitting) return;

    setSubmitting(true);
    try {
      await onCreate({ label: label.trim(), color });
      setLabel("");
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (chapter: ChapterData) => {
    setEditingId(chapter.id);
    setEditingLabel(chapter.label);
    setEditingColor(chapter.color ?? DEFAULT_CHAPTER_COLOR);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingLabel("");
    setEditingColor(DEFAULT_CHAPTER_COLOR);
  };

  const handleUpdate = async (chapter: ChapterData) => {
    const trimmedLabel = editingLabel.trim();
    if (!trimmedLabel || busyId !== null) return;

    setBusyId(chapter.id);
    try {
      await onUpdate(chapter.id, {
        label: trimmedLabel,
        color: editingColor,
        seconds: chapter.seconds
      });
      cancelEditing();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (
    event: React.MouseEvent,
    chapterId: number
  ) => {
    event.stopPropagation();
    if (busyId !== null) return;

    setBusyId(chapterId);
    try {
      await onDelete(chapterId);
      if (editingId === chapterId) {
        cancelEditing();
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-heading text-sm font-semibold tracking-tight text-fg-primary">
          Chapters
        </h3>
        <p className="mt-1 text-xs text-fg-muted">
          Pin named moments and jump back instantly.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-2 rounded-lg border border-white/[0.08] bg-surface-card p-3"
      >
        <label className="block text-xs font-medium text-fg-secondary">
          Chapter label
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={80}
            placeholder="Adagio, Solo, Coda..."
            className="mt-1 w-full rounded-md border border-white/[0.08] bg-surface-page px-3 py-2 text-sm text-fg-primary placeholder:text-fg-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </label>
        <div className="flex items-center justify-between gap-3">
          <ColorSelect value={color} onChange={setColor} />
          <button
            type="submit"
            disabled={!canCreate || submitting}
            className="rounded-md bg-accent px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Saving..."
              : `Add at ${formatTime(currentTime)}`}
          </button>
        </div>
      </form>

      {chapters.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/[0.12] bg-surface-card/50 py-5 text-center">
          <p className="text-sm text-fg-secondary">No chapters yet.</p>
          <p className="mt-1 text-xs text-fg-muted">
            Pause on a key moment, name it, and save.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {chapters.map((chapter) => {
            const isSelected = chapter.id === selectedChapterId;
            const isEditing = chapter.id === editingId;
            const isBusy = chapter.id === busyId;

            return (
              <li
                key={chapter.id}
                className={`group rounded-lg border transition-all ${
                  isSelected
                    ? "border-accent bg-accent-muted ring-1 ring-accent/30"
                    : "border-white/[0.08] bg-surface-card hover:border-white/[0.12] hover:bg-surface-elevated"
                }`}
              >
                {isEditing ? (
                  <div className="space-y-2 p-3">
                    <input
                      value={editingLabel}
                      onChange={(event) => setEditingLabel(event.target.value)}
                      maxLength={80}
                      className="w-full rounded-md border border-white/[0.08] bg-surface-page px-3 py-2 text-sm text-fg-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <ColorSelect
                        value={editingColor}
                        onChange={setEditingColor}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="rounded-md px-2 py-1 text-xs text-fg-secondary transition-colors hover:bg-white/[0.06] hover:text-fg-primary"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!editingLabel.trim() || isBusy}
                          onClick={() => handleUpdate(chapter)}
                          className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isBusy ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full items-start gap-3 p-3">
                    <span
                      className="mt-1 h-3 w-3 rounded-full border border-white/30"
                      style={{ backgroundColor: chapter.color ?? DEFAULT_CHAPTER_COLOR }}
                      aria-hidden
                    />
                    <button
                      type="button"
                      onClick={() => onSelect(chapter.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-sm font-medium text-fg-primary">
                        {chapter.label}
                      </span>
                      <span className="mt-1 block font-mono text-[11px] text-fg-muted">
                        {formatTime(chapter.seconds)}
                      </span>
                    </button>
                    <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <IconButton
                        label="Edit chapter"
                        onClick={(event) => {
                          event.stopPropagation();
                          startEditing(chapter);
                        }}
                      >
                        <path d="M11.1 2.3a1 1 0 0 1 1.4 0l1.2 1.2a1 1 0 0 1 0 1.4l-7.6 7.6-3.1.5.5-3.1 7.6-7.6Zm-6.2 8.3-.1.7.7-.1 6.8-6.8-.6-.6-6.8 6.8Z" />
                      </IconButton>
                      <IconButton
                        label="Delete chapter"
                        disabled={isBusy}
                        onClick={(event) => handleDelete(event, chapter.id)}
                      >
                        <path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3V1.75ZM11 3V1.75A1.75 1.75 0 0 0 9.25 0h-2.5A1.75 1.75 0 0 0 5 1.75V3H2.75a.75.75 0 0 0 0 1.5h.31l.472 8.958A1.75 1.75 0 0 0 5.28 15h5.44a1.75 1.75 0 0 0 1.748-1.542L12.94 4.5h.31a.75.75 0 0 0 0-1.5H11Zm-5.47 1.5.46 8.73h4.02l.46-8.73H5.53Z" />
                      </IconButton>
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ColorSelect({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-fg-secondary">
      <span>Color</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-white/[0.08] bg-surface-page px-2 py-1 text-xs text-fg-primary outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
      >
        {CHAPTER_COLORS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function IconButton({
  label,
  disabled = false,
  onClick,
  children
}: {
  label: string;
  disabled?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-6 w-6 items-center justify-center rounded text-fg-muted transition-colors ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:bg-white/[0.08] hover:text-fg-primary"
      }`}
    >
      <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
        {children}
      </svg>
    </button>
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
