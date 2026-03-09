import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function HomePage() {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Videos</h2>
      {videos.length === 0 ? (
        <p className="text-sm text-slate-400">
          No videos yet. Once the database is seeded, they will appear here.
        </p>
      ) : (
        <ul className="space-y-2">
          {videos.map((video) => (
            <li
              key={video.id}
              className="rounded-md border border-slate-800 bg-slate-900/60 p-3 hover:border-slate-500"
            >
              <Link
                href={`/videos/${video.id}`}
                className="flex flex-col gap-1"
              >
                <span className="font-medium">{video.title}</span>
                {video.description && (
                  <span className="text-xs text-slate-400">
                    {video.description}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

