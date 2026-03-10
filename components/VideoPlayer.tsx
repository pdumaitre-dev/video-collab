"use client";

import * as React from "react";

interface VideoPlayerProps {
  src: string;
  videoRef?: React.RefObject<HTMLVideoElement>;
  onTimeUpdate?: (timeSeconds: number) => void;
  onDurationChange?: (durationSeconds: number) => void;
}

export default function VideoPlayer({
  src,
  videoRef,
  onTimeUpdate,
  onDurationChange
}: VideoPlayerProps) {
  const innerRef = React.useRef<HTMLVideoElement>(null);
  const ref = videoRef ?? innerRef;

  return (
    <div className="overflow-hidden rounded-md border border-slate-800 bg-black">
      <video
        ref={ref}
        src={src}
        controls
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
      />
    </div>
  );
}

