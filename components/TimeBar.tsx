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
  const timelineRef = React.useRef<HTMLDivElement | null>(null);
  const dragStartSecondsRef = React.useRef(0);
  const [selection, setSelection] = React.useState<{
    dragStartSeconds: number;
    dragEndSeconds: number;
  } | null>(null);

  const toSeconds = React.useCallback(
    (clientX: number): number => {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect || durationSeconds <= 0) return 0;
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      return (x / rect.width) * durationSeconds;
    },
    [durationSeconds]
  );

  const handleClickSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (durationSeconds <= 0) return;
    const seconds = toSeconds(e.clientX);
    onSeek(seconds);
  };

  const handleMouseDownSelection = (e: React.MouseEvent<HTMLDivElement>) => {
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
      if (rangeEndSeconds - rangeStartSeconds >= 0.1) {
        onRangeSelected(rangeStartSeconds, rangeEndSeconds, dragEndSeconds);
        setSelection({ dragStartSeconds: rangeStartSeconds, dragEndSeconds: rangeEndSeconds });
      } else {
        setSelection(null);
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const tickCount = 24;
  const playedRatio =
    durationSeconds > 0 ? Math.min(currentTime / durationSeconds, 1) : 0;
  const cursorOffsetPercent = playedRatio * 100;
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
            rangeStartSeconds,
            rangeEndSeconds,
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
        ref={timelineRef}
        style={{
          position: "relative",
          width: "100%",
          minWidth: 200,
          cursor: "pointer"
        }}
      >
        <div
          style={{
            position: "relative",
            height: 26,
            backgroundColor: "#334155",
            borderRadius: 8,
            overflow: "hidden"
          }}
          onClick={handleClickSeek}
          onMouseDown={handleMouseDownSelection}
          aria-hidden
        >
          {selectionStyle && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                left: selectionStyle.left,
                width: selectionStyle.width,
                backgroundColor: "rgba(56, 189, 248, 0.28)",
                zIndex: 7
              }}
              aria-hidden
            />
          )}
          {Array.from({ length: tickCount + 1 }, (_, index) => {
            const percent = (index / tickCount) * 100;
            const isMajor = index % 4 === 0;
            return (
              <div
                key={`ruler-tick-${index}`}
                style={{
                  position: "absolute",
                  left: `${percent}%`,
                  bottom: 0,
                  width: 1,
                  height: isMajor ? 12 : 7,
                  backgroundColor: isMajor ? "#e2e8f0" : "#94a3b8",
                  opacity: isMajor ? 0.9 : 0.65,
                  transform: "translateX(-0.5px)"
                }}
                aria-hidden
              />
            );
          })}
          <span
            style={{
              position: "absolute",
              left: 6,
              top: 4,
              fontSize: 10,
              fontFamily: "monospace",
              color: "#e2e8f0"
            }}
          >
            0:00
          </span>
          <span
            style={{
              position: "absolute",
              right: 6,
              top: 4,
              fontSize: 10,
              fontFamily: "monospace",
              color: "#e2e8f0"
            }}
          >
            {formatTime(durationSeconds)}
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            top: 34,
            left: 0,
            right: 0,
            height: 32,
            backgroundColor: "#475569",
            borderRadius: 9999,
            overflow: "hidden",
            cursor: "pointer"
          }}
          onClick={handleClickSeek}
          onMouseDown={handleMouseDownSelection}
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
        </div>
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${cursorOffsetPercent}%`,
            width: 2,
            backgroundColor: "#ffffff",
            transform: "translateX(-1px)",
            zIndex: 20,
            pointerEvents: "none"
          }}
          aria-hidden
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: `${cursorOffsetPercent}%`,
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "8px solid #ffffff",
            zIndex: 21,
            pointerEvents: "none"
          }}
          aria-hidden
        />
        {selection && (
          <>
            <div
              style={{
                position: "absolute",
                left: `${(selection.dragStartSeconds / durationSeconds) * 100}%`,
                top: -4,
                transform: "translate(-50%, -100%)",
                pointerEvents: "none",
                zIndex: 8
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "#fde68a",
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(253, 230, 138, 0.8)",
                  borderRadius: 9999,
                  padding: "1px 6px",
                  whiteSpace: "nowrap"
                }}
              >
                {formatTime(selection.dragStartSeconds)}
              </span>
            </div>
            <div
              style={{
                position: "absolute",
                left: `${(selection.dragEndSeconds / durationSeconds) * 100}%`,
                top: -4,
                transform: "translate(-50%, -100%)",
                pointerEvents: "none",
                zIndex: 8
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "#fde68a",
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(253, 230, 138, 0.8)",
                  borderRadius: 9999,
                  padding: "1px 6px",
                  whiteSpace: "nowrap"
                }}
              >
                {formatTime(selection.dragEndSeconds)}
              </span>
            </div>
          </>
        )}
        <div
          style={{
            height: 66
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}
