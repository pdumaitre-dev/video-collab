import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import {
  attachSessionCookie,
  createSessionForUser,
  publicUserFields
} from "@/lib/auth-session";
import { prisma } from "@/lib/db";

const BCRYPT_ROUNDS = 12;

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = json as { email?: unknown; password?: unknown };
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await bcrypt.hash(password, BCRYPT_ROUNDS);
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const { rawToken, expiresAt } = await createSessionForUser(user.id);
  const response = NextResponse.json({ user: publicUserFields(user) });
  attachSessionCookie(response, rawToken, expiresAt);
  return response;
}
