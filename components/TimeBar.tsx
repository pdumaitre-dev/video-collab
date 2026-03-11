"use client";

import * as React from "react";

type CommentRange = {
  id: number;
  startSeconds: number;
  endSeconds: number;
};

interface TimeBarProps {
  durationSeconds: number;
  currentTime: number;
  comments?: CommentRange[];
  onSeek: (timeSeconds: number) => void;
  /** Called with normalized range (start <= end) and the position where the drag ended */
  onRangeSelected: (
    rangeStartSeconds: number,
    rangeEndSeconds: number,
    dragEndSeconds: number
  ) => void;
}

function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const seconds = Math.floor(totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  const padded = remaining.toString().padStart(2, "0");
  return `${minutes}:${padded}`;
}

export default function TimeBar({
  durationSeconds,
  currentTime,
  comments = [],
  onSeek,
  onRangeSelected
}: TimeBarProps) {
  const barRef = React.useRef<HTMLDivElement | null>(null);
  const dragStartSecondsRef = React.useRef(0);
  const [selection, setSelection] = React.useState<{
    dragStartSeconds: number;
    dragEndSeconds: number;
  } | null>(null);

  const toSeconds = React.useCallback(
    (clientX: number): number => {
      const rect = barRef.current?.getBoundingClientRect();
      if (!rect || durationSeconds <= 0) return 0;
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      return (x / rect.width) * durationSeconds;
    },
    [durationSeconds]
  );

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (durationSeconds <= 0) return;
    const seconds = toSeconds(e.clientX);
    onSeek(seconds);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (durationSeconds <= 0) return;
    e.preventDefault();
    const dragStartSeconds = toSeconds(e.clientX);
    dragStartSecondsRef.current = dragStartSeconds;
    setSelection({ dragStartSeconds, dragEndSeconds: dragStartSeconds });

    const onMove = (moveEvent: MouseEvent) => {
      const dragEndSeconds = toSeconds(moveEvent.clientX);
      setSelection({
        dragStartSeconds: dragStartSecondsRef.current,
        dragEndSeconds
      });
      onSeek(dragEndSeconds);
    };

    const onUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      const dragEndSeconds = toSeconds(upEvent.clientX);
      const rangeStartSeconds = Math.max(
        0,
        Math.min(dragStartSecondsRef.current, dragEndSeconds)
      );
      const rangeEndSeconds = Math.min(
        durationSeconds,
        Math.max(dragStartSecondsRef.current, dragEndSeconds)
      );
      setSelection(null);
      if (rangeEndSeconds - rangeStartSeconds >= 0.1) {
        onRangeSelected(rangeStartSeconds, rangeEndSeconds, dragEndSeconds);
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const playedRatio =
    durationSeconds > 0 ? Math.min(currentTime / durationSeconds, 1) : 0;
  const selectionStyle =
    selection && durationSeconds > 0
      ? (() => {
          const rangeStartSeconds = Math.max(
            0,
            Math.min(selection.dragStartSeconds, selection.dragEndSeconds)
          );
          const rangeEndSeconds = Math.min(
            durationSeconds,
            Math.max(selection.dragStartSeconds, selection.dragEndSeconds)
          );
          return {
            left: `${(rangeStartSeconds / durationSeconds) * 100}%`,
            width: `${((rangeEndSeconds - rangeStartSeconds) / durationSeconds) * 100}%`
          };
        })()
      : null;

  if (durationSeconds <= 0) {
    return (
      <div className="rounded-full bg-slate-800 py-2 text-center text-xs text-slate-500">
        Load the video to enable the time bar.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          fontFamily: "monospace",
          color: "#94a3b8"
        }}
      >
        <span>Current: {formatTime(currentTime)}</span>
        <span>Duration: {formatTime(durationSeconds)}</span>
      </div>
      <div
        ref={barRef}
        style={{
          position: "relative",
          height: 32,
          width: "100%",
          minWidth: 200,
          backgroundColor: "#475569",
          borderRadius: 9999,
          cursor: "pointer"
        }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={durationSeconds}
        aria-valuenow={currentTime}
      >
        <div
          style={{
            position: "absolute",
            top: 4,
            bottom: 4,
            left: 4,
            right: 4,
            backgroundColor: "#64748b",
            borderRadius: 9999
          }}
          aria-hidden
        />
        {comments.map((c) => {
          const left = (c.startSeconds / durationSeconds) * 100;
          const width =
            ((c.endSeconds - c.startSeconds) / durationSeconds) * 100;
          return (
            <div
              key={c.id}
              style={{
                position: "absolute",
                top: 4,
                bottom: 4,
                left: `${left}%`,
                width: `${width}%`,
                backgroundColor: "rgba(16, 185, 129, 0.6)",
                borderRadius: 9999,
                zIndex: 5
              }}
              aria-hidden
            />
          );
        })}
        {selectionStyle && (
          <div
            style={{
              position: "absolute",
              top: 2,
              bottom: 2,
              left: selectionStyle.left,
              width: selectionStyle.width,
              backgroundColor: "rgba(56, 189, 248, 0.7)",
              borderRadius: 9999,
              zIndex: 10
            }}
            aria-hidden
          />
        )}
        <div
          style={{
            position: "absolute",
            top: 2,
            bottom: 2,
            left: `${playedRatio * 100}%`,
            width: 4,
            backgroundColor: "white",
            borderRadius: 2,
            zIndex: 20
          }}
          aria-hidden
        />
      </div>
      {selection && (
        <p
          style={{
            fontSize: 11,
            fontFamily: "monospace",
            color: "#38bdf8"
          }}
        >
          Selected: {formatTime(Math.min(selection.dragStartSeconds, selection.dragEndSeconds))} –{" "}
          {formatTime(Math.max(selection.dragStartSeconds, selection.dragEndSeconds))}
        </p>
      )}
      <p className="text-xs text-slate-500">
        Click to seek; drag to select a range for a comment.
      </p>
    </div>
  );
}
