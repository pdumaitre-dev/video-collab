"use client";

import * as React from "react";

type ChapterData = {
  id: number;
  label: string;
  seconds: number;
  color?: string | null;
  createdAt: string;
};

interface ChapterListProps {
  chapters: ChapterData[];
  selectedChapterId: number | null;
  onSelect: (chapterId: number) => void;
  onDelete?: (chapterId: number) => Promise<void> | void;
}

export default function ChapterList({
  chapters,
  selectedChapterId,
  onSelect,
  onDelete
}: ChapterListProps) {
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const handleDelete = async (event: React.MouseEvent, chapterId: number) => {
    event.stopPropagation();
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
          Pause or seek to a section, then add a named jump point.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2 text-sm">
      {chapters.map((chapter) => {
        const isSelected = chapter.id === selectedChapterId;
        const isDeleting = deletingId === chapter.id;
        const markerColor = chapter.color ?? "#60a5fa";

        return (
          <li
            key={chapter.id}
            className={`group cursor-pointer rounded-lg border px-3 py-3 text-sm transition-all ${
              isSelected
                ? "border-accent bg-accent-muted ring-1 ring-accent/30"
                : "border-white/[0.08] bg-surface-card hover:border-white/[0.12] hover:bg-surface-elevated"
            }`}
            onClick={() => onSelect(chapter.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: markerColor }}
                    aria-hidden
                  />
                  <span className="truncate font-medium text-fg-primary">
                    {chapter.label}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-fg-muted">
                  {formatTime(chapter.seconds)}
                </div>
              </div>
              {onDelete && (
                <button
                  type="button"
                  aria-label="Delete chapter"
                  disabled={isDeleting}
                  onClick={(event) => handleDelete(event, chapter.id)}
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-fg-muted opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" />
                    </svg>
                  ) : (
                    <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
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
