"use client";

import * as React from "react";
import VideoPlayer from "@/components/VideoPlayer";
import TimeBar from "@/components/TimeBar";
import CommentList, { type CommentData } from "@/components/CommentList";
import CommentForm from "@/components/CommentForm";

export type { CommentData };

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

export type PersistReplyFn = (
  parentId: number,
  text: string
) => Promise<CommentData>;

export type DeleteCommentFn = (commentId: number) => Promise<void>;

interface VideoPageShellProps {
  video: VideoForClient;
  initialComments: CommentData[];
  /** Persists top-level comments for a selected time range */
  persistComment: PersistCommentFn;
  /** Persists replies to an existing top-level comment */
  persistReply?: PersistReplyFn;
  /** Deletes a comment by ID */
  deleteComment: DeleteCommentFn;
}

function sortTopLevelComments(comments: CommentData[]): CommentData[] {
  return [...comments].sort((a, b) => {
    if (a.startSeconds !== b.startSeconds) {
      return a.startSeconds - b.startSeconds;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });
}

function sortReplies(replies: CommentData[]): CommentData[] {
  return [...replies].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function findComment(
  comments: CommentData[],
  commentId: number
): CommentData | undefined {
  for (const comment of comments) {
    if (comment.id === commentId) return comment;
    const reply = comment.replies?.find((item) => item.id === commentId);
    if (reply) return reply;
  }
  return undefined;
}

function removeCommentFromTree(
  comments: CommentData[],
  commentId: number
): CommentData[] {
  return comments
    .filter((comment) => comment.id !== commentId)
    .map((comment) => ({
      ...comment,
      replies: comment.replies?.filter((reply) => reply.id !== commentId) ?? []
    }));
}

export default function VideoPageShell({
  video,
  initialComments,
  persistComment,
  persistReply,
  deleteComment
}: VideoPageShellProps) {
  const [comments, setComments] = React.useState<CommentData[]>(
    sortTopLevelComments(initialComments)
  );

  React.useEffect(() => {
    if (initialComments.length > 0) {
      setComments(sortTopLevelComments(initialComments));
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
  const videoRef = React.useRef<HTMLVideoElement>(null);

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

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setCurrentTime(time);
  };

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

    const created = await persistComment(
      {
        startSeconds: selectedRange.startSeconds,
        endSeconds: selectedRange.endSeconds
      },
      text
    );

    setComments((prev) =>
      sortTopLevelComments([...prev, { ...created, replies: created.replies ?? [] }])
    );
    setSelectedRange(null);
  };

  const handleReplyComment = async (parentId: number, text: string) => {
    if (!persistReply) return;

    const created = await persistReply(parentId, text);
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === parentId
          ? {
              ...comment,
              replies: sortReplies([...(comment.replies ?? []), created])
            }
          : comment
      )
    );
  };

  const handleDeleteComment = async (commentId: number) => {
    await deleteComment(commentId);
    setComments((prev) => removeCommentFromTree(prev, commentId));
    if (selectedCommentId === commentId) {
      setSelectedCommentId(null);
    }
  };

  const handleSelectComment = (commentId: number) => {
    setSelectedCommentId(commentId);
    const comment = findComment(comments, commentId);
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
            onTimeUpdate={setCurrentTime}
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
              onSeek={handleSeek}
              onRangeSelected={(rangeStartSeconds, rangeEndSeconds, dragEndSeconds) => {
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
        <CommentList
          comments={comments}
          selectedCommentId={selectedCommentId}
          onSelect={handleSelectComment}
          onDelete={handleDeleteComment}
          onReply={persistReply ? handleReplyComment : undefined}
        />
      </div>
    </div>
  );
}
