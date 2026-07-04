"use client";

import * as React from "react";
import VideoPlayer from "@/components/VideoPlayer";
import TimeBar from "@/components/TimeBar";
import CommentList from "@/components/CommentList";
import CommentForm from "@/components/CommentForm";
import ChapterList, { type ChapterData } from "@/components/ChapterList";
import ChapterForm from "@/components/ChapterForm";

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

export type PersistChapterFn = (
  label: string,
  seconds: number
) => Promise<ChapterData>;

export type DeleteChapterFn = (chapterId: number) => Promise<void>;

interface VideoPageShellProps {
  video: VideoForClient;
  initialComments: CommentData[];
  initialChapters?: ChapterData[];
  /** Persists comments (e.g. to blob storage or localStorage) */
  persistComment: PersistCommentFn;
  /** Deletes a comment by ID */
  deleteComment: DeleteCommentFn;
  /** Persists chapters (blob-backed videos only) */
  persistChapter?: PersistChapterFn;
  /** Deletes a chapter by ID */
  deleteChapter?: DeleteChapterFn;
  /** When false, chapter UI is hidden (e.g. localStorage-only videos) */
  chaptersEnabled?: boolean;
}

export default function VideoPageShell({
  video,
  initialComments,
  initialChapters = [],
  persistComment,
  deleteComment,
  persistChapter,
  deleteChapter,
  chaptersEnabled = true
}: VideoPageShellProps) {
  const [comments, setComments] = React.useState<CommentData[]>(initialComments);
  const [chapters, setChapters] = React.useState<ChapterData[]>(initialChapters);

  // Sync when parent loads comments after mount (e.g. FileVideoPageShell loading from localStorage)
  React.useEffect(() => {
    if (initialComments.length > 0) {
      setComments(initialComments);
    }
  }, [initialComments]);

  React.useEffect(() => {
    setChapters(initialChapters);
  }, [initialChapters]);

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
  const [selectedChapterId, setSelectedChapterId] = React.useState<
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
    setSelectedChapterId(null);
    const comment = comments.find((c) => c.id === commentId);
    if (comment) {
      handleSeek(comment.startSeconds);
    }
  };

  const handleNewChapter = async (label: string) => {
    if (!persistChapter) {
      throw new Error("Chapters are not available for this video");
    }

    const clampedSeconds =
      duration > 0 ? Math.min(currentTime, duration) : currentTime;

    const created = await persistChapter(label, clampedSeconds);
    setChapters((prev) =>
      [...prev, created].sort((a, b) => a.seconds - b.seconds)
    );
    setSelectedChapterId(created.id);
  };

  const handleDeleteChapter = async (chapterId: number) => {
    if (!deleteChapter) return;

    await deleteChapter(chapterId);
    setChapters((prev) => prev.filter((c) => c.id !== chapterId));
    if (selectedChapterId === chapterId) {
      setSelectedChapterId(null);
    }
  };

  const handleSelectChapter = (chapterId: number) => {
    setSelectedChapterId(chapterId);
    setSelectedCommentId(null);
    const chapter = chapters.find((c) => c.id === chapterId);
    if (chapter) {
      handleSeek(chapter.seconds);
    }
  };

  const activeChapterId = React.useMemo(() => {
    const windowSeconds = 2;
    const active = chapters.find(
      (chapter) => Math.abs(chapter.seconds - currentTime) <= windowSeconds
    );
    return active?.id ?? null;
  }, [chapters, currentTime]);

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
              chapters={chaptersEnabled ? chapters : []}
              selectedChapterId={selectedChapterId}
              selectedRange={selectedRange}
              onSeek={handleSeek}
              onChapterSelect={handleSelectChapter}
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
      <div className="flex h-full flex-col gap-6">
        {chaptersEnabled && (
          <div className="flex flex-col rounded-lg border border-white/[0.08] bg-surface-panel p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]">
            <h3 className="mb-3 font-heading text-sm font-semibold tracking-tight text-fg-primary">
              Chapters
            </h3>
            <ChapterForm
              currentTime={currentTime}
              onSubmit={handleNewChapter}
              disabled={!persistChapter || duration <= 0}
            />
            <div className="mt-3">
              <ChapterList
                chapters={chapters}
                selectedChapterId={selectedChapterId}
                activeChapterId={activeChapterId}
                onSelect={handleSelectChapter}
                onDelete={deleteChapter ? handleDeleteChapter : undefined}
              />
            </div>
          </div>
        )}
        <div className="flex h-full flex-col rounded-lg border border-white/[0.08] bg-surface-panel p-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]">
          <h3 className="mb-3 font-heading text-sm font-semibold tracking-tight text-fg-primary">
            Comments
          </h3>
          <CommentList
            comments={comments}
            selectedCommentId={selectedCommentId}
            onSelect={handleSelectComment}
            onDelete={handleDeleteComment}
          />
        </div>
      </div>
    </div>
  );
}
