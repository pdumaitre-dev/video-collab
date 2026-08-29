import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "session";
export const SESSION_COOKIE_NAME = SESSION_COOKIE;

/** Raw session token length in bytes (stored hashed in DB). */
const SESSION_TOKEN_BYTES = 32;

export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;

export type SessionUser = {
  id: number;
  email: string;
  displayName: string | null;
};

export type PublicUser = {
  id: number;
  email: string;
  displayName: string | null;
};

type CookieStore = {
  get(name: string): { value: string } | undefined;
};

export function hashSessionToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

function sessionCookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/" as const,
    maxAge: maxAgeSec
  };
}

export function attachSessionCookie(
  res: NextResponse,
  rawToken: string,
  expiresAt?: Date
) {
  const maxAgeSec = expiresAt
    ? Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
    : SESSION_MAX_AGE_SEC;
  res.cookies.set(
    SESSION_COOKIE_NAME,
    rawToken,
    sessionCookieOptions(Math.min(maxAgeSec, SESSION_MAX_AGE_SEC))
  );
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions(0),
    maxAge: 0
  });
}

export async function createDbSession(userId: number, rawToken: string) {
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1000);
  return prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });
}

export async function createSessionForUser(userId: number) {
  const rawToken = newSessionRawToken();
  const session = await createDbSession(userId, rawToken);
  return { rawToken, expiresAt: session.expiresAt };
}

export function publicUserFields(
  user: User | SessionUser | PublicUser
): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName ?? null
  };
}

export async function deleteSessionByRawToken(rawToken: string | undefined) {
  if (!rawToken) return;
  const tokenHash = hashSessionToken(rawToken);
  await prisma.session.deleteMany({ where: { tokenHash } }).catch(() => {
    /* ignore */
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return getSessionUserForRawToken(token);
}

export async function getSessionUserFromCookies(): Promise<SessionUser | null> {
  return getSessionUser();
}

export async function getUserFromSessionCookie(
  cookieStore: CookieStore
): Promise<User | null> {
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;
  const tokenHash = hashSessionToken(rawToken);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true }
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {
      /* ignore */
    });
    return null;
  }
  return session.user;
}

export async function getSessionUserForRawToken(
  rawToken: string
): Promise<SessionUser | null> {
  const tokenHash = hashSessionToken(rawToken);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true }
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {
      /* ignore */
    });
    return null;
  }
  const { user } = session;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName
  };
}

export function newSessionRawToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

export async function requireUser(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}
