import { notFound } from "next/navigation";
import FileVideoPageShell from "./FileVideoPageShell";
import BackLink from "@/components/ui/BackLink";

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
      <BackLink href="/videos">Back to videos</BackLink>
      <FileVideoPageShell
        sourceUrl={sourceUrl}
        title={filename}
        pathname={`videos/${filename}`}
      />
    </div>
  );
}
