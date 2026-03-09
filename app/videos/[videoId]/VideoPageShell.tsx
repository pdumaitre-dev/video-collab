"use client";

import * as React from "react";
import VideoPlayer from "@/components/VideoPlayer";
import Timeline from "@/components/Timeline";
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
  id: number;
  title: string;
  description: string | null;
  sourceUrl: string;
  durationSeconds: number | null;
}

interface VideoPageShellProps {
  video: VideoForClient;
  initialComments: CommentData[];
}

export default function VideoPageShell({
  video,
  initialComments
}: VideoPageShellProps) {
  const [comments, setComments] = React.useState<CommentData[]>(initialComments);
  const [currentTime, setCurrentTime] = React.useState(0);
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
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

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

  const handleNewComment = async (text: string) => {
    if (!selectedRange) return;

    const res = await fetch(`/api/videos/${video.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startSeconds: selectedRange.startSeconds,
        endSeconds: selectedRange.endSeconds,
        text
      })
    });

    if (!res.ok) {
      console.error("Failed to create comment");
      return;
    }

    const created = (await res.json()) as {
      id: number;
      startSeconds: number;
      endSeconds: number;
      text: string;
      createdAt: string;
      updatedAt: string;
    };

    setComments((prev) =>
      [...prev, created].sort((a, b) => a.startSeconds - b.startSeconds)
    );
    setSelectedRange(null);
  };

  const handleSelectComment = (commentId: number) => {
    setSelectedCommentId(commentId);
    const comment = comments.find((c) => c.id === commentId);
    if (comment) {
      handleSeek(comment.startSeconds);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{video.title}</h2>
          {video.description && (
            <p className="text-sm text-slate-400">{video.description}</p>
          )}
        </div>
        <div className="space-y-4">
          <VideoPlayer
            src={video.sourceUrl}
            videoRef={videoRef}
            onTimeUpdate={setCurrentTime}
            onDurationChange={setDuration}
          />
          <Timeline
            durationSeconds={duration}
            currentTime={currentTime}
            comments={comments}
            onSeek={handleSeek}
            onRangeSelected={(startSeconds, endSeconds) =>
              setSelectedRange({ startSeconds, endSeconds })
            }
          />
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-slate-400">
              Time bar (seek & select range)
            </p>
            <TimeBar
              durationSeconds={duration}
              currentTime={currentTime}
              comments={comments}
              onSeek={handleSeek}
              onRangeSelected={(startSeconds, endSeconds) =>
                setSelectedRange({ startSeconds, endSeconds })
              }
            />
          </div>
          <CommentForm
            selectedRange={selectedRange}
            onSubmit={handleNewComment}
          />
        </div>
      </div>
      <div className="flex h-full flex-col rounded-md border border-slate-800 bg-slate-900/60 p-3">
        <h3 className="mb-2 text-sm font-semibold tracking-tight text-slate-100">
          Comments
        </h3>
        <CommentList
          comments={comments}
          selectedCommentId={selectedCommentId}
          onSelect={handleSelectComment}
        />
      </div>
    </div>
  );
}
