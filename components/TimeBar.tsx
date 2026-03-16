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

/** Tick interval in seconds based on duration */
function getTickInterval(durationSeconds: number): number {
  if (durationSeconds <= 60) return 10;
  if (durationSeconds <= 300) return 30;
  if (durationSeconds <= 900) return 60;
  return 300;
}

export default function TimeBar({
  durationSeconds,
  currentTime,
  comments = [],
  onSeek,
  onRangeSelected
}: TimeBarProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const dragStartSecondsRef = React.useRef(0);
  const [selection, setSelection] = React.useState<{
    dragStartSeconds: number;
    dragEndSeconds: number;
  } | null>(null);

  const toSeconds = React.useCallback(
    (clientX: number): number => {
      const rect = containerRef.current?.getBoundingClientRect();
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

  const startDrag = React.useCallback(
    (clientX: number) => {
      const dragStartSeconds = toSeconds(clientX);
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
    },
    [durationSeconds, toSeconds, onSeek, onRangeSelected]
  );

  const handleBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (durationSeconds <= 0) return;
    e.preventDefault();
    startDrag(e.clientX);
  };

  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (durationSeconds <= 0) return;
    e.preventDefault();
    startDrag(e.clientX);
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

  const tickInterval = getTickInterval(durationSeconds);
  const ticks: number[] = [];
  for (let t = 0; t <= durationSeconds; t += tickInterval) {
    ticks.push(t);
  }
  if (ticks[ticks.length - 1] !== durationSeconds) {
    ticks.push(durationSeconds);
  }

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
        ref={containerRef}
        className="flex w-full min-w-[200px] flex-col"
        style={{ width: "100%" }}
      >
        {/* Ruler */}
        <div
          className="relative flex items-end border-b border-white/10 pb-0.5"
          style={{
            height: 28,
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: 10,
            color: "#94a3b8"
          }}
          onClick={handleClick}
          onMouseDown={handleRulerMouseDown}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={durationSeconds}
          aria-valuenow={currentTime}
        >
          {/* Tick marks */}
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute bottom-0"
              style={{
                left: `${(t / durationSeconds) * 100}%`,
                transform: "translateX(-50%)",
                height: t % (tickInterval * 2) === 0 ? 8 : 4,
                width: 1,
                backgroundColor: "#64748b"
              }}
              aria-hidden
            />
          ))}
          {/* 0:00 label */}
          <span
            className="absolute left-0"
            style={{ bottom: 10 }}
            aria-hidden
          >
            0:00
          </span>
          {/* Duration label */}
          <span
            className="absolute right-0"
            style={{ bottom: 10 }}
            aria-hidden
          >
            {formatTime(durationSeconds)}
          </span>
          {/* Selection highlight on ruler */}
          {selectionStyle && (
            <div
              className="absolute bottom-0"
              style={{
                left: selectionStyle.left,
                width: selectionStyle.width,
                height: 6,
                backgroundColor: "rgba(56, 189, 248, 0.6)",
                borderRadius: 2,
                zIndex: 5
              }}
              aria-hidden
            />
          )}
          {/* Current time label in ruler (while selecting) */}
          {selection && (
            <span
              className="absolute font-semibold"
              style={{
                left: `${playedRatio * 100}%`,
                transform: "translateX(-50%)",
                bottom: 10,
                color: "#fbbf24",
                textShadow: "0 0 2px rgba(0,0,0,0.8)",
                zIndex: 15,
                pointerEvents: "none"
              }}
              aria-hidden
            >
              {formatTime(currentTime)}
            </span>
          )}
        </div>

        {/* Time bar */}
        <div
          style={{
            position: "relative",
            height: 32,
            width: "100%",
            backgroundColor: "#475569",
            borderRadius: 9999,
            cursor: "pointer"
          }}
          onClick={handleClick}
          onMouseDown={handleBarMouseDown}
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
          {/* Current time cursor: white bar from bottom to ruler, inverted arrow at top */}
          <div
            className="absolute"
            style={{
              left: `${playedRatio * 100}%`,
              transform: "translateX(-50%)",
              bottom: 0,
              top: -28,
              width: 4,
              zIndex: 20,
              pointerEvents: "none"
            }}
            aria-hidden
          >
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 4,
                height: 32,
                backgroundColor: "white",
                borderRadius: 2
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "8px solid white"
              }}
            />
          </div>
        </div>
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
        Click to seek; drag on ruler or time bar to select a range for a comment.
      </p>
    </div>
  );
}
