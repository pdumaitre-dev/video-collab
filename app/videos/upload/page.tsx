import Link from "next/link";
import VideoUploadForm from "@/components/VideoUploadForm";

export default function VideoUploadPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/videos"
          className="inline-block text-sm text-slate-400 hover:text-slate-200"
        >
          ← Back to videos
        </Link>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Upload a video</h2>
          <p className="text-sm text-slate-400">
            Step 1 is frontend-only: choose a file, run validation, and review
            the derived metadata before wiring the real upload flow.
          </p>
        </div>
      </div>

      <VideoUploadForm />
    </div>
  );
}
