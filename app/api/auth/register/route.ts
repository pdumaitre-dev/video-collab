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

  const body = json as {
    email?: unknown;
    password?: unknown;
    displayName?: unknown;
  };
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const displayName =
    typeof body.displayName === "string"
      ? body.displayName.trim() || null
      : null;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName
      }
    });
    const { rawToken, expiresAt } = await createSessionForUser(user.id);
    const response = NextResponse.json(
      { user: publicUserFields(user) },
      { status: 201 }
    );
    attachSessionCookie(response, rawToken, expiresAt);
    return response;
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    console.error("register", e);
    return NextResponse.json(
      { error: "Could not create account" },
      { status: 500 }
    );
  }
}
