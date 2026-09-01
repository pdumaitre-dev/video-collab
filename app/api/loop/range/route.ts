import { NextResponse } from "next/server";
import { parseLoopExpression } from "@/lib/loop-config";
import { isPublicRoute } from "@/lib/public-routes";

/**
 * Public route (`/api/loop/range` is in PUBLIC_ROUTES).
 * Parses a loop-range expression into numeric bounds for future
 * integrations. No auth: the handler only returns start/end seconds
 * derived from the query string and does not read or write user data.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const expression = searchParams.get("expression");

  if (!isPublicRoute("/api/loop/range")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  return NextResponse.json({
    startSeconds: range.startSeconds,
    endSeconds: range.endSeconds
  });
}
