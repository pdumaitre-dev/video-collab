import { notFound } from "next/navigation";
import FileVideoPageShell from "../watch/[filename]/FileVideoPageShell";
import BackLink from "@/components/ui/BackLink";
import {
  listVideoBlobs,
  getVideoPlaybackUrl
} from "@/lib/blob";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    videoId: string;
  };
}

export default async function VideoPage({ params }: PageProps) {
  const { videoId } = params;
  const lookupValue = decodeURIComponent(videoId);

  try {
    const videos = await listVideoBlobs();
    const storedVideo = await prisma.video.findFirst({
      where: {
        OR: [{ publicId: lookupValue }, { pathname: lookupValue }]
      },
      select: {
        publicId: true,
        name: true,
        pathname: true
      }
    });

    const pathname = storedVideo?.pathname ?? lookupValue;
    const blob = videos.find((v) => v.pathname === pathname);

    if (!blob) {
      notFound();
    }

    const sourceUrl = getVideoPlaybackUrl(blob);

    return (
      <div className="space-y-4">
        <BackLink href="/videos">Back to videos</BackLink>
        <FileVideoPageShell
          sourceUrl={sourceUrl}
          title={storedVideo?.name ?? blob.filename}
          pathname={blob.pathname}
        />
      </div>
    );
  } catch (error) {
    console.error("Error fetching blob video", error);
    notFound();
  }
}
