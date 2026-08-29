"use client";

import * as React from "react";

export type ChapterListItem = {
  id: number;
  label: string;
  seconds: number;
  color?: string | null;
};

interface ChapterListProps {
  chapters: ChapterListItem[];
  selectedChapterId: number | null;
  currentTime: number;
  onSelect: (chapterId: number) => void;
  onDelete?: (chapterId: number) => Promise<void> | void;
}

export default function ChapterList({
  chapters,
  selectedChapterId,
  currentTime,
  onSelect,
  onDelete
}: ChapterListProps) {
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const handleDelete = async (e: React.MouseEvent, chapterId: number) => {
    e.stopPropagation();
    if (!onDelete || deletingId !== null) return;

    setDeletingId(chapterId);
    try {
      await onDelete(chapterId);
    } finally {
      setDeletingId(null);
    }
  };

  if (chapters.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/[0.12] bg-surface-card/50 py-6 text-center">
        <p className="text-sm text-fg-secondary">No chapters yet.</p>
        <p className="mt-1 text-xs text-fg-muted">
          Add a label and pin the current moment.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2 text-sm">
      {chapters.map((chapter) => {
        const isNearPlayhead = Math.abs(currentTime - chapter.seconds) <= 2;
        const isSelected =
          chapter.id === selectedChapterId ||
          (selectedChapterId === null && isNearPlayhead);
        const isDeleting = deletingId === chapter.id;
        const markerColor = chapter.color ?? "#3b82f6";

        return (
          <li
            key={chapter.id}
            className={`group cursor-pointer rounded-lg border px-3 py-2.5 text-sm transition-all ${
              isSelected
                ? "border-accent bg-accent-muted ring-1 ring-accent/30"
                : "border-white/[0.08] bg-surface-card hover:border-white/[0.12] hover:bg-surface-elevated"
            }`}
            onClick={() => onSelect(chapter.id)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: markerColor }}
                    aria-hidden
                  />
                  <p className="truncate text-fg-primary">{chapter.label}</p>
                </div>
                <p className="mt-1 font-mono text-[11px] text-fg-muted">
                  {formatTime(chapter.seconds)}
                </p>
              </div>
              {onDelete && (
                <button
                  type="button"
                  aria-label="Delete chapter"
                  disabled={isDeleting}
                  onClick={(e) => handleDelete(e, chapter.id)}
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-fg-muted opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <svg
                      className="h-3 w-3 animate-spin"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <circle
                        cx="8"
                        cy="8"
                        r="6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="28"
                        strokeDashoffset="8"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3V1.75ZM11 3V1.75A1.75 1.75 0 0 0 9.25 0h-2.5A1.75 1.75 0 0 0 5 1.75V3H2.75a.75.75 0 0 0 0 1.5h.31l.472 8.958A1.75 1.75 0 0 0 5.28 15h5.44a1.75 1.75 0 0 0 1.748-1.542L12.94 4.5h.31a.75.75 0 0 0 0-1.5H11Zm-5.47 1.5.46 8.73h4.02l.46-8.73H5.53Z" />
                    </svg>
                  )}
                </button>
              )}
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
