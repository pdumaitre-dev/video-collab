import VideoUploadForm from "@/components/VideoUploadForm";
import BackLink from "@/components/ui/BackLink";

export default function VideoUploadPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <BackLink href="/videos">Back to videos</BackLink>
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold text-fg-primary">
            Upload a video
          </h2>
          <p className="text-sm text-fg-secondary">
            Choose a file, validate it client-side, and upload it into the
            `videos/` prefix in Vercel Blob.
          </p>
        </div>
      </div>

      <VideoUploadForm />
    </div>
  );
}
