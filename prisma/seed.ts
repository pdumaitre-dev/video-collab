import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.video.findFirst();
  if (existing) {
    console.log("Seed data already present, skipping.");
    return;
  }

  const video = await prisma.video.create({
    data: {
      title: "Sample Lecture",
      description: "Sample video for time-range annotation.",
      sourceUrl: "/videos/sample.mp4",
      durationSeconds: 600
    }
  });

  await prisma.comment.createMany({
    data: [
      {
        videoId: video.id,
        startSeconds: 60,
        endSeconds: 75,
        text: "Introductory concept discussed here."
      },
      {
        videoId: video.id,
        startSeconds: 180,
        endSeconds: 210,
        text: "Key explanation that may need revision."
      }
    ]
  });

  console.log("Seed data created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

