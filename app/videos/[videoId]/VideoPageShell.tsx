"use client";

import * as React from "react";
import VideoPlayer from "@/components/VideoPlayer";
import TimeBar, { type TimeBarSeekSource } from "@/components/TimeBar";
import CommentList from "@/components/CommentList";
import CommentForm from "@/components/CommentForm";
import {
  isOutsidePlaybackRange,
  rangeReachesMediaEnd,
  shouldWrapPlayback
} from "@/lib/range-loop";

export type CommentData = {
  id: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  createdAt: string;
};

export interface VideoForClient {
  id?: number;
  title: string;
  description?: string | null;
  sourceUrl: string;
  durationSeconds?: number | null;
}

export type PersistCommentFn = (
  range: { startSeconds: number; endSeconds: number },
  text: string
) => Promise<CommentData>;

export type DeleteCommentFn = (commentId: number) => Promise<void>;

interface VideoPageShellProps {
  video: VideoForClient;
  initialComments: CommentData[];
  /** Persists comments (e.g. to blob storage or localStorage) */
  persistComment: PersistCommentFn;
  /** Deletes a comment by ID */
  deleteComment: DeleteCommentFn;
}

export default function VideoPageShell({
  video,
  initialComments,
  persistComment,
  deleteComment
}: VideoPageShellProps) {
  const [comments, setComments] = React.useState<CommentData[]>(initialComments);

  // Sync when parent loads comments after mount (e.g. FileVideoPageShell loading from localStorage)
  React.useEffect(() => {
    if (initialComments.length > 0) {
      setComments(initialComments);
    }
  }, [initialComments]);

  const [currentTime, setCurrentTime] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [duration, setDuration] = React.useState<number>(
    video.durationSeconds ?? 0
  );
  const [selectedRange, setSelectedRange] = React.useState<{
    startSeconds: number;
    endSeconds: number;
  } | null>(null);
  const [selectedCommentId, setSelectedCommentId] = React.useState<
    number | null
  >(null);
  const [isLoopEnabled, setIsLoopEnabled] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const isTimelineDraggingRef = React.useRef(false);

  const selectedComment = React.useMemo(
    () => comments.find((comment) => comment.id === selectedCommentId) ?? null,
    [comments, selectedCommentId]
  );
  const activeLoopRange = selectedRange ?? selectedComment;

  React.useEffect(() => {
    if (duration > 0) return;
    const el = videoRef.current;
    if (el && Number.isFinite(el.duration)) {
      setDuration(el.duration);
      return;
    }
    const id = setInterval(() => {
      const el = videoRef.current;
      if (el && Number.isFinite(el.duration)) {
        setDuration(el.duration);
      }
    }, 300);
    return () => clearInterval(id);
  }, [duration]);

  const handleSeek = (
    time: number,
    source: TimeBarSeekSource = "programmatic"
  ) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setCurrentTime(time);
    if (
      source === "timeline-click" &&
      activeLoopRange &&
      isOutsidePlaybackRange(time, activeLoopRange)
    ) {
      setIsLoopEnabled(false);
    }
  };

  const startPlayback = React.useCallback(async () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    try {
      await videoElement.play();
    } catch (error) {
      console.error("Failed to start playback", error);
    }
  }, []);

  const handleTimeUpdate = React.useCallback(
    (time: number) => {
      const videoElement = videoRef.current;
      if (
        shouldWrapPlayback({
          currentTime: time,
          range: activeLoopRange,
          isLoopEnabled,
          isPaused: videoElement?.paused ?? true,
          isTimelineDragging: isTimelineDraggingRef.current
        }) &&
        videoElement &&
        activeLoopRange
      ) {
        videoElement.currentTime = activeLoopRange.startSeconds;
        setCurrentTime(activeLoopRange.startSeconds);
        return;
      }

      setCurrentTime(time);
    },
    [activeLoopRange, isLoopEnabled]
  );

  const handleEnded = React.useCallback(() => {
    const videoElement = videoRef.current;
    const mediaDuration = videoElement?.duration ?? duration;
    if (
      videoElement &&
      isLoopEnabled &&
      !isTimelineDraggingRef.current &&
      rangeReachesMediaEnd(activeLoopRange, mediaDuration) &&
      activeLoopRange
    ) {
      videoElement.currentTime = activeLoopRange.startSeconds;
      setCurrentTime(activeLoopRange.startSeconds);
      void startPlayback();
      return;
    }

    setIsPlaying(false);
  }, [activeLoopRange, duration, isLoopEnabled, startPlayback]);

  const handleLoopToggle = (enabled: boolean) => {
    setIsLoopEnabled(enabled);
    if (!enabled || !activeLoopRange) return;

    if (isOutsidePlaybackRange(currentTime, activeLoopRange)) {
      handleSeek(activeLoopRange.startSeconds);
    }
    void startPlayback();
  };

  const handleTogglePlayback = async () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (videoElement.paused) {
      await startPlayback();
      return;
    }

    videoElement.pause();
    setIsLoopEnabled(false);
  };

  const handleNewComment = async (text: string) => {
    if (!selectedRange) return;

    if (!persistComment) {
      console.error("persistComment is required for saving comments");
      return;
    }

    const created = await persistComment(
      {
        startSeconds: selectedRange.startSeconds,
        endSeconds: selectedRange.endSeconds
      },
      text
    );
    setComments((prev) =>
      [...prev, created].sort((a, b) => a.startSeconds - b.startSeconds)
    );
    setSelectedRange(null);
    setIsLoopEnabled(false);
  };

  const handleDeleteComment = async (commentId: number) => {
    await deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    if (selectedCommentId === commentId) {
      setSelectedCommentId(null);
      setIsLoopEnabled(false);
    }
  };

  const handleSelectComment = (commentId: number) => {
    if (selectedCommentId === commentId) {
      setSelectedCommentId(null);
      setIsLoopEnabled(false);
      return;
    }

    const comment = comments.find((c) => c.id === commentId);
    if (comment) {
      setSelectedRange(null);
      setSelectedCommentId(commentId);
      setIsLoopEnabled(true);
      handleSeek(comment.startSeconds);
      void startPlayback();
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold text-fg-primary">
            {video.title}
          </h2>
          {video.description && (
            <p className="text-sm text-fg-secondary">{video.description}</p>
          )}
        </div>
        <div className="space-y-4">
          <VideoPlayer
            src={video.sourceUrl}
            videoRef={videoRef}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={setDuration}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={handleEnded}
          />
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleTogglePlayback}
              aria-label={isPlaying ? "Pause video" : "Play video"}
              className="inline-flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              style={{ minWidth: 36, minHeight: 36 }}
            >
              {isPlaying ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="block h-5 w-5"
                  fill="currentColor"
                  width={20}
                  height={20}
                >
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="block h-5 w-5"
                  fill="currentColor"
                  width={20}
                  height={20}
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>
          <div className="space-y-1">
            <TimeBar
              durationSeconds={duration}
              currentTime={currentTime}
              comments={comments}
              selectedRange={selectedRange}
              onSeek={handleSeek}
              onDragStateChange={(isDragging) => {
                isTimelineDraggingRef.current = isDragging;
              }}
              onRangeSelected={(rangeStartSeconds, rangeEndSeconds, dragEndSeconds) => {
                setSelectedCommentId(null);
                setSelectedRange({
                  startSeconds: rangeStartSeconds,
                  endSeconds: rangeEndSeconds
                });
                setIsLoopEnabled(true);
                handleSeek(dragEndSeconds);
                void startPlayback();
              }}
            />
          </div>
          <CommentForm
            selectedRange={selectedRange}
            onSubmit={handleNewComment}
          />
        </div>
      </div>
      <div className="flex h-full flex-col rounded-lg border border-white/[0.08] bg-surface-panel p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-heading text-sm font-semibold tracking-tight text-fg-primary">
            Comments
          </h3>
          {activeLoopRange && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-fg-secondary">
                <input
                  type="checkbox"
                  checked={isLoopEnabled}
                  onChange={(event) => handleLoopToggle(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border-white/[0.12] bg-surface-card accent-accent"
                  aria-label="Loop selected range"
                />
                Loop range
              </label>
              {isLoopEnabled && (
                <span className="font-mono text-[11px] text-fg-muted">
                  Repeating {formatTime(activeLoopRange.startSeconds)} –{" "}
                  {formatTime(activeLoopRange.endSeconds)}
                </span>
              )}
            </div>
          )}
        </div>
        <CommentList
          comments={comments}
          selectedCommentId={selectedCommentId}
          onSelect={handleSelectComment}
          onDelete={handleDeleteComment}
        />
      </div>
    </div>
  );
}

function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const seconds = Math.floor(totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}
