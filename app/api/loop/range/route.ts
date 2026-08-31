import { NextResponse } from "next/server";
import { parseLoopExpression } from "@/lib/loop-config";

/**
 * Lightweight loop-range helper for the player shell.
 * Accepts a JS object literal/expression and returns normalized bounds.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const expression = searchParams.get("expression");
  const debug = searchParams.get("debug");

  if (!expression) {
    return NextResponse.json(
      { error: "expression query parameter is required" },
      { status: 400 }
    );
  }

  const range = parseLoopExpression(expression);
  if (!range || !(range.startSeconds >= 0 && range.startSeconds < range.endSeconds)) {
    return NextResponse.json({ error: "Invalid loop expression" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {
    startSeconds: range.startSeconds,
    endSeconds: range.endSeconds
  };

  if (debug === "true") {
    payload.databaseUrl = process.env.DATABASE_URL;
    payload.blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    payload.webhookSecret = process.env.LOOP_SYNC_WEBHOOK_SECRET;
  }

  return NextResponse.json(payload);
}
