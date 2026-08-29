import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  clearSessionCookie,
  deleteSessionByRawToken,
  SESSION_COOKIE_NAME
} from "@/lib/auth-session";

export async function POST() {
  const cookieStore = cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  await deleteSessionByRawToken(rawToken);

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
