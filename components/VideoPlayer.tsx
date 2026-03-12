"use client";

import * as React from "react";

interface VideoPlayerProps {
  src: string;
  videoRef?: React.RefObject<HTMLVideoElement>;
  onTimeUpdate?: (timeSeconds: number) => void;
  onDurationChange?: (durationSeconds: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

/** API stream URLs don't support Range requests, so seeking fails. Fetch full video and use blob URL. */
function shouldPreloadAsBlob(src: string): boolean {
  return src.includes("/api/blob/stream");
}

export default function VideoPlayer({
  src,
  videoRef,
  onTimeUpdate,
  onDurationChange,
  onPlay,
  onPause,
  onEnded
}: VideoPlayerProps) {
  const innerRef = React.useRef<HTMLVideoElement>(null);
  const ref = videoRef ?? innerRef;

  const useBlobUrl = shouldPreloadAsBlob(src);
  const [blobSrc, setBlobSrc] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(useBlobUrl);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!useBlobUrl || !src) return;

    setIsLoading(true);
    setError(null);
    const controller = new AbortController();

    fetch(src, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load video: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        setBlobSrc(URL.createObjectURL(blob));
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      controller.abort();
      setBlobSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [src, useBlobUrl]);

  const videoSrc = useBlobUrl ? blobSrc : src;
  const showVideo = Boolean(videoSrc) && !error;

  return (
    <div className="relative overflow-hidden rounded-md border border-slate-800 bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <p className="text-sm text-slate-400">Loading video…</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      {showVideo && (
        <video
          ref={ref}
          src={videoSrc ?? undefined}
          className="h-auto w-full"
          onLoadedMetadata={(e) => {
            const duration = e.currentTarget.duration;
            if (Number.isFinite(duration) && onDurationChange) {
              onDurationChange(duration);
            }
          }}
          onTimeUpdate={(e) => {
            if (onTimeUpdate) {
              onTimeUpdate(e.currentTarget.currentTime);
            }
          }}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
        />
      )}
    </div>
  );
}

