"use client";

import * as React from "react";
import VideoPlayer from "@/components/VideoPlayer";
import TimeBar from "@/components/TimeBar";
import CommentList from "@/components/CommentList";
import CommentForm from "@/components/CommentForm";

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

type TimeRange = {
  startSeconds: number;
  endSeconds: number;
};

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
  const [selectedRange, setSelectedRange] = React.useState<TimeRange | null>(null);
  const [selectedCommentId, setSelectedCommentId] = React.useState<
    number | null
  >(null);
  const [isRangeLoopEnabled, setIsRangeLoopEnabled] = React.useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const skipLoopRewindRef = React.useRef(false);

  const activeLoopRange = React.useMemo<TimeRange | null>(() => {
    if (selectedRange) return selectedRange;
    if (selectedCommentId === null) return null;
    const selectedComment = comments.find((comment) => comment.id === selectedCommentId);
    return selectedComment
      ? {
          startSeconds: selectedComment.startSeconds,
          endSeconds: selectedComment.endSeconds
        }
      : null;
  }, [comments, selectedCommentId, selectedRange]);

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

  const handleSeek = React.useCallback((time: number) => {
    skipLoopRewindRef.current = true;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setCurrentTime(time);
  }, []);

  const handleVideoTimeUpdate = React.useCallback(
    (time: number) => {
      const skipLoopRewind = skipLoopRewindRef.current;
      skipLoopRewindRef.current = false;

      const videoElement = videoRef.current;
      if (
        !skipLoopRewind &&
        isRangeLoopEnabled &&
        activeLoopRange &&
        activeLoopRange.endSeconds > activeLoopRange.startSeconds &&
        time >= activeLoopRange.endSeconds
      ) {
        if (videoElement) {
          videoElement.currentTime = activeLoopRange.startSeconds;
        }
        setCurrentTime(activeLoopRange.startSeconds);
        return;
      }

      setCurrentTime(time);
    },
    [activeLoopRange, isRangeLoopEnabled]
  );

  const handleTimeBarSeek = React.useCallback(
    (time: number, source?: "click" | "drag") => {
      if (source === "click") {
        setSelectedRange(null);
        setSelectedCommentId(null);
      }
      handleSeek(time);
    },
    [handleSeek]
  );

  const handleTogglePlayback = async () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (videoElement.paused) {
      try {
        await videoElement.play();
      } catch (error) {
        console.error("Failed to start playback", error);
      }
      return;
    }

    videoElement.pause();
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
  };

  const handleDeleteComment = async (commentId: number) => {
    await deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    if (selectedCommentId === commentId) {
      setSelectedCommentId(null);
    }
  };

  const handleSelectComment = (commentId: number) => {
    setSelectedCommentId(commentId);
    setSelectedRange(null);
    const comment = comments.find((c) => c.id === commentId);
    if (comment) {
      handleSeek(comment.startSeconds);
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
            onTimeUpdate={handleVideoTimeUpdate}
            onDurationChange={setDuration}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
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
              onSeek={handleTimeBarSeek}
              onRangeSelected={(rangeStartSeconds, rangeEndSeconds, dragEndSeconds) => {
                setSelectedCommentId(null);
                setSelectedRange({
                  startSeconds: rangeStartSeconds,
                  endSeconds: rangeEndSeconds
                });
                handleSeek(dragEndSeconds);
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
        <h3 className="mb-3 font-heading text-sm font-semibold tracking-tight text-fg-primary">
          Comments
        </h3>
        <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-white/[0.08] bg-surface-card px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg-primary">Loop range</p>
            <p className="text-xs text-fg-muted">
              {activeLoopRange
                ? "Repeats the selected range while playing."
                : "Select a comment or draft range to loop."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isRangeLoopEnabled}
            onClick={() => setIsRangeLoopEnabled((enabled) => !enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-panel ${
              isRangeLoopEnabled
                ? "border-accent bg-accent"
                : "border-white/[0.12] bg-surface-elevated"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                isRangeLoopEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
            <span className="sr-only">Toggle selected range looping</span>
          </button>
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
