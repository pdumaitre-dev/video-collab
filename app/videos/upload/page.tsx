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
            Choose a file, validate it client-side, and upload it into the
            `videos/` prefix in Vercel Blob.
          </p>
        </div>
      </div>

      <VideoUploadForm />
    </div>
  );
}
