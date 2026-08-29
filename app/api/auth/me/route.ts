import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getUserFromSessionCookie,
  publicUserFields
} from "@/lib/auth-session";

export async function GET() {
  const user = await getUserFromSessionCookie(cookies());
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: publicUserFields(user) });
}
