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
  selectedRange?: {
    startSeconds: number;
    endSeconds: number;
  } | null;
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeRange(
  startSeconds: number,
  endSeconds: number,
  durationSeconds: number
) {
  return {
    startSeconds: clamp(
      Math.min(startSeconds, endSeconds),
      0,
      durationSeconds
    ),
    endSeconds: clamp(Math.max(startSeconds, endSeconds), 0, durationSeconds)
  };
}

function toRangeStyle(
  range: { startSeconds: number; endSeconds: number },
  durationSeconds: number
) {
  const safeDuration = durationSeconds > 0 ? durationSeconds : 1;
  return {
    left: `${(range.startSeconds / safeDuration) * 100}%`,
    width: `${((range.endSeconds - range.startSeconds) / safeDuration) * 100}%`
  };
}

const MIN_DRAG_DISTANCE_PX = 3;

export default function TimeBar({
  durationSeconds,
  currentTime,
  comments = [],
  selectedRange = null,
  onSeek,
  onRangeSelected
}: TimeBarProps) {
  const surfaceRef = React.useRef<HTMLDivElement | null>(null);
  const dragStartSecondsRef = React.useRef(0);
  const dragStartClientXRef = React.useRef(0);
  const [selection, setSelection] = React.useState<{
    startSeconds: number;
    endSeconds: number;
  } | null>(null);
  const [surfaceWidth, setSurfaceWidth] = React.useState(0);

  React.useEffect(() => {
    const node = surfaceRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    const updateWidth = () => {
      setSurfaceWidth(node.getBoundingClientRect().width);
    };

    updateWidth();

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSurfaceWidth(entry.contentRect.width);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const toSeconds = React.useCallback(
    (clientX: number): number => {
      const rect = surfaceRef.current?.getBoundingClientRect();
      if (!rect || durationSeconds <= 0) return 0;
      const x = clamp(clientX - rect.left, 0, rect.width);
      return rect.width > 0 ? (x / rect.width) * durationSeconds : 0;
    },
    [durationSeconds]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (durationSeconds <= 0) return;
    e.preventDefault();
    const startSeconds = toSeconds(e.clientX);
    dragStartSecondsRef.current = startSeconds;
    dragStartClientXRef.current = e.clientX;
    setSelection({ startSeconds, endSeconds: startSeconds });
    onSeek(startSeconds);

    const onMove = (moveEvent: MouseEvent) => {
      const endSeconds = toSeconds(moveEvent.clientX);
      setSelection({
        startSeconds: dragStartSecondsRef.current,
        endSeconds
      });
      onSeek(endSeconds);
    };

    const onUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);

      const endSeconds = toSeconds(upEvent.clientX);
      const range = normalizeRange(
        dragStartSecondsRef.current,
        endSeconds,
        durationSeconds
      );
      const dragged =
        Math.abs(upEvent.clientX - dragStartClientXRef.current) >=
        MIN_DRAG_DISTANCE_PX;

      setSelection(null);
      onSeek(endSeconds);

      if (dragged && range.endSeconds - range.startSeconds >= 0.1) {
        onRangeSelected(range.startSeconds, range.endSeconds, endSeconds);
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const playedRatio =
    durationSeconds > 0 ? clamp(currentTime / durationSeconds, 0, 1) : 0;
  const liveRange =
    selection && durationSeconds > 0
      ? normalizeRange(
          selection.startSeconds,
          selection.endSeconds,
          durationSeconds
        )
      : null;
  const committedRange =
    selectedRange && durationSeconds > 0
      ? normalizeRange(
          selectedRange.startSeconds,
          selectedRange.endSeconds,
          durationSeconds
        )
      : null;
  const visibleRange = liveRange ?? committedRange;
  const visibleRangeStyle =
    visibleRange && durationSeconds > 0
      ? toRangeStyle(visibleRange, durationSeconds)
      : null;
  const majorTickCount =
    surfaceWidth > 0 ? Math.max(4, Math.floor(surfaceWidth / 56)) : 8;
  const majorTicks = Array.from({ length: majorTickCount + 1 }, (_, index) =>
    majorTickCount === 0 ? 0 : index / majorTickCount
  );
  const minorTicks = Array.from(
    { length: majorTickCount * 3 },
    (_, index) => (index + 1) / (majorTickCount * 4)
  );
  const currentLabelLeft = `clamp(40px, ${playedRatio * 100}%, calc(100% - 40px))`;

  if (durationSeconds <= 0) {
    return (
      <div className="rounded-full bg-slate-800 py-2 text-center text-xs text-slate-500">
        Load the video to enable the time bar.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={surfaceRef}
        style={{
          position: "relative",
          height: 72,
          width: "100%",
          minWidth: 200,
          cursor: "pointer",
          userSelect: "none"
        }}
        onMouseDown={handleMouseDown}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={durationSeconds}
        aria-valuenow={currentTime}
        aria-label="Video timeline ruler and time bar"
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            fontFamily: "monospace",
            color: "#cbd5e1",
            pointerEvents: "none"
          }}
          aria-hidden
        >
          <span>0:00</span>
          <span>{formatTime(durationSeconds)}</span>
        </div>
        {visibleRangeStyle && (
          <div
            style={{
              position: "absolute",
              top: 18,
              height: 10,
              left: visibleRangeStyle.left,
              width: visibleRangeStyle.width,
              backgroundColor: "rgba(56, 189, 248, 0.35)",
              borderRadius: 9999,
              zIndex: 2
            }}
            aria-hidden
          />
        )}
        <div
          style={{
            position: "absolute",
            top: 23,
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: "#475569",
            borderRadius: 9999,
            zIndex: 1
          }}
          aria-hidden
        />
        {minorTicks.map((position) => (
          <div
            key={`minor-${position}`}
            style={{
              position: "absolute",
              top: 21,
              bottom: 45,
              left: `${position * 100}%`,
              width: 1,
              backgroundColor: "#64748b",
              transform: "translateX(-50%)",
              zIndex: 3
            }}
            aria-hidden
          />
        ))}
        {majorTicks.map((position) => (
          <div
            key={`major-${position}`}
            style={{
              position: "absolute",
              top: 17,
              bottom: 41,
              left: `${position * 100}%`,
              width: 1,
              backgroundColor: "#cbd5e1",
              transform: "translateX(-50%)",
              zIndex: 4
            }}
            aria-hidden
          />
        ))}
        <div
          style={{
            position: "absolute",
            top: 40,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#475569",
            borderRadius: 9999,
            zIndex: 1
          }}
          aria-hidden
        />
        <div
          style={{
            position: "absolute",
            top: 44,
            bottom: 4,
            left: 4,
            right: 4,
            backgroundColor: "#64748b",
            borderRadius: 9999,
            zIndex: 2
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
                top: 44,
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
        {visibleRangeStyle && (
          <div
            style={{
              position: "absolute",
              top: 42,
              bottom: 2,
              left: visibleRangeStyle.left,
              width: visibleRangeStyle.width,
              backgroundColor:
                liveRange !== null
                  ? "rgba(56, 189, 248, 0.7)"
                  : "rgba(56, 189, 248, 0.45)",
              borderRadius: 9999,
              zIndex: 10
            }}
            aria-hidden
          />
        )}
        <div
          style={{
            position: "absolute",
            top: 20,
            bottom: 0,
            left: `${playedRatio * 100}%`,
            width: 3,
            backgroundColor: "white",
            borderRadius: 9999,
            transform: "translateX(-50%)",
            zIndex: 20
          }}
          aria-hidden
        >
          <div
            style={{
              position: "absolute",
              top: -7,
              left: "50%",
              width: 12,
              height: 8,
              backgroundColor: "white",
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              transform: "translateX(-50%)"
            }}
          />
        </div>
        {visibleRange && (
          <div
            style={{
              position: "absolute",
              top: 4,
              left: currentLabelLeft,
              transform: "translateX(-50%)",
              padding: "2px 6px",
              borderRadius: 9999,
              backgroundColor: "#facc15",
              color: "#0f172a",
              fontSize: 11,
              fontFamily: "monospace",
              fontWeight: 600,
              zIndex: 30,
              pointerEvents: "none"
            }}
          >
            {formatTime(currentTime)}
          </div>
        )}
      </div>
      {visibleRange && (
        <p
          style={{
            fontSize: 11,
            fontFamily: "monospace",
            color: "#38bdf8"
          }}
        >
          Selected: {formatTime(visibleRange.startSeconds)} –{" "}
          {formatTime(visibleRange.endSeconds)}
        </p>
      )}
      <p className="text-xs text-slate-500">
        Click or drag on the ruler or time bar to seek and select a range for a
        comment.
      </p>
    </div>
  );
}
