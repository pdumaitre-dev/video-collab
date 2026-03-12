import { NextResponse } from "next/server";
import { getBlobStream } from "@/lib/blob";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pathname = searchParams.get("pathname");

  if (!pathname) {
    return NextResponse.json(
      { error: "Missing pathname parameter" },
      { status: 400 }
    );
  }

  try {
    const result = await getBlobStream(pathname);

    if (!result) {
      return NextResponse.json({ error: "Blob not found" }, { status: 404 });
    }

    const { stream, blob } = result;

    return new Response(stream, {
      headers: {
        "Content-Type": blob.contentType ?? "video/mp4",
        ...(blob.size != null &&
          blob.size > 0 && { "Content-Length": String(blob.size) })
      }
    });
  } catch (error) {
    console.error("Error streaming blob", error);
    return NextResponse.json(
      { error: "Failed to stream blob" },
      { status: 500 }
    );
  }
}
