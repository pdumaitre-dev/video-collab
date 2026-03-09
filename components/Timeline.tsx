"use client";

import * as React from "react";

type CommentRange = {
  id: number;
  startSeconds: number;
  endSeconds: number;
};

interface TimelineProps {
  durationSeconds: number;
  currentTime: number;
  comments: CommentRange[];
  onSeek: (timeSeconds: number) => void;
  onRangeSelected: (startSeconds: number, endSeconds: number) => void;
}

export default function Timeline({
  durationSeconds,
  currentTime,
  comments,
  onSeek,
  onRangeSelected
}: TimelineProps) {
  const barRef = React.useRef<HTMLDivElement | null>(null);
  const dragStartSecondsRef = React.useRef<number>(0);
  const [selection, setSelection] = React.useState<{
    start: number;
    end: number;
  } | null>(null);
  const isDraggingRef = React.useRef(false);

  const toSeconds = React.useCallback(
    (clientX: number): number => {
      const rect = barRef.current?.getBoundingClientRect();
      if (!rect || durationSeconds <= 0) return 0;
      const clampedX = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      const ratio = clampedX / rect.width;
      return ratio * durationSeconds;
    },
    [durationSeconds]
  );

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (durationSeconds <= 0) return;
    if (isDraggingRef.current) return;
    const seconds = toSeconds(e.clientX);
    onSeek(seconds);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (durationSeconds <= 0) return;
    e.preventDefault();
    const startSeconds = toSeconds(e.clientX);
    dragStartSecondsRef.current = startSeconds;
    isDraggingRef.current = true;
    setSelection({ start: startSeconds, end: startSeconds });

    const onWindowMouseMove = (moveEvent: MouseEvent) => {
      const endSeconds = toSeconds(moveEvent.clientX);
      setSelection({
        start: dragStartSecondsRef.current,
        end: endSeconds
      });
    };

    const onWindowMouseUp = (upEvent: MouseEvent) => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);

      const endSeconds = toSeconds(upEvent.clientX);
      const start = Math.max(
        0,
        Math.min(dragStartSecondsRef.current, endSeconds)
      );
      const end = Math.min(
        durationSeconds,
        Math.max(dragStartSecondsRef.current, endSeconds)
      );
      setSelection(null);

      if (end - start >= 0.1) {
        onRangeSelected(start, end);
      }
    };

    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onWindowMouseUp);
  };

  const playedRatio =
    durationSeconds > 0 ? Math.min(currentTime / durationSeconds, 1) : 0;

  const selectionStyle = (() => {
    if (!selection || durationSeconds <= 0 || !barRef.current) return null;
    const start = Math.max(0, Math.min(selection.start, selection.end));
    const end = Math.min(
      durationSeconds,
      Math.max(selection.start, selection.end)
    );
    const left = (start / durationSeconds) * 100;
    const width = ((end - start) / durationSeconds) * 100;
    return { left: `${left}%`, width: `${width}%` };
  })();

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span title="Current time">Current: {formatTime(currentTime)}</span>
        <span title="Total duration">
          Duration: {durationSeconds > 0 ? formatTime(durationSeconds) : "…"}
        </span>
      </div>
      {durationSeconds <= 0 ? (
        <p className="rounded-full bg-slate-800 py-2 text-center text-xs text-slate-500">
          Load the video to enable the timeline and range selection.
        </p>
      ) : (
        <>
      <div
        ref={barRef}
        className="relative h-6 cursor-pointer rounded-full bg-slate-800"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
      >
        <div
          className="absolute inset-y-1 left-1 rounded-full bg-slate-700"
          style={{ right: "0.25rem" }}
        />

        {comments.map((c) => {
          if (durationSeconds <= 0) return null;
          const left = (c.startSeconds / durationSeconds) * 100;
          const width =
            ((c.endSeconds - c.startSeconds) / durationSeconds) * 100;
          return (
            <div
              key={c.id}
              className="absolute inset-y-1 rounded-full bg-emerald-500/60"
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          );
        })}

        {selectionStyle && (
          <div
            className="absolute inset-y-0.5 z-10 rounded-full bg-sky-500/70"
            style={selectionStyle}
          />
        )}

        <div
          className="absolute top-0.5 bottom-0.5 z-20 w-1 rounded-full bg-slate-50"
          style={{ left: `${playedRatio * 100}%` }}
        />
      </div>
          {selection && (
            <p className="text-[11px] font-mono text-sky-400">
              Selected: {formatTime(selection.start)} – {formatTime(selection.end)}
            </p>
          )}
        </>
      )}
      <p className="text-xs text-slate-500">
        Drag on the bar to select a time range and create a comment.
      </p>
    </div>
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

