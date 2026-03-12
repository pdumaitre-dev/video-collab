import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import {
  buildVideoBlobPath,
  generatePublicId,
  normalizeVideoName,
  validateVideoFile
} from "@/lib/video-upload";
import { prisma } from "@/lib/db";

const BLOB_ACCESS = (process.env.BLOB_ACCESS as "private" | "public") ?? "private";

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data body" },
      { status: 400 }
    );
  }

  const maybeFile = formData.get("file");
  if (!(maybeFile instanceof File)) {
    return NextResponse.json(
      { error: "Video file is required" },
      { status: 400 }
    );
  }

  const validationError = validateVideoFile(maybeFile);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const requestedName = formData.get("name");
  const name =
    typeof requestedName === "string"
      ? normalizeVideoName(requestedName, maybeFile.name)
      : normalizeVideoName("", maybeFile.name);
  const pathname = buildVideoBlobPath(maybeFile.name);

  try {
    const blob = await put(pathname, maybeFile, {
      access: BLOB_ACCESS,
      addRandomSuffix: false
    });

    const video = await createVideoRecord({
      name,
      pathname: blob.pathname,
      sourceUrl: blob.url
    });

    return NextResponse.json(
      {
        id: video.id,
        publicId: video.publicId,
        name: video.name,
        pathname: blob.pathname,
        url: blob.url
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading blob video", error);
    return NextResponse.json(
      {
        error:
          "Upload failed. A file with that name may already exist in Blob storage."
      },
      { status: 500 }
    );
  }
}

async function createVideoRecord({
  name,
  pathname,
  sourceUrl
}: {
  name: string;
  pathname: string;
  sourceUrl: string;
}) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.video.create({
        data: {
          title: name,
          name,
          publicId: generatePublicId(),
          pathname,
          sourceUrl
        }
      });
    } catch (error) {
      if (isPublicIdConflict(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Failed to generate a unique public video id.");
}

function isPublicIdConflict(error: unknown) {
  const target =
    typeof error === "object" &&
    error !== null &&
    "meta" in error &&
    typeof error.meta === "object" &&
    error.meta !== null &&
    "target" in error.meta
      ? error.meta.target
      : null;

  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002" &&
    Array.isArray(target) &&
    target.includes("publicId")
  );
}
