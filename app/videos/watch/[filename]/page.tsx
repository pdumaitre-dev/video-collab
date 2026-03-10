import Link from "next/link";
import { notFound } from "next/navigation";
import FileVideoPageShell from "./FileVideoPageShell";

const ALLOWED_EXTENSIONS = [".mp4", ".mov"];

interface PageProps {
  params: {
    filename: string;
  };
}

export default function WatchVideoPage({ params }: PageProps) {
  const filename = decodeURIComponent(params.filename);

  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
    filename.toLowerCase().endsWith(ext)
  );
  if (!hasValidExtension) {
    notFound();
  }

  const sourceUrl = `/videos/${encodeURIComponent(filename)}`;

  return (
    <div className="space-y-4">
      <Link
        href="/videos"
        className="inline-block text-sm text-slate-400 hover:text-slate-200"
      >
        ← Back to videos
      </Link>
      <FileVideoPageShell sourceUrl={sourceUrl} title={filename} />
    </div>
  );
}
