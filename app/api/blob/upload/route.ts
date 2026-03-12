import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import {
  buildVideoBlobPath,
  validateVideoFile
} from "@/lib/video-upload";

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

  const pathname = buildVideoBlobPath(maybeFile.name);

  try {
    const blob = await put(pathname, maybeFile, {
      access: BLOB_ACCESS,
      addRandomSuffix: false
    });

    return NextResponse.json(
      {
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
