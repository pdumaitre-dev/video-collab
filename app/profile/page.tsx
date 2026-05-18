import Link from "next/link";
import { redirect } from "next/navigation";

import NavButton from "@/components/ui/NavButton";
import { getSessionUserFromCookies } from "@/lib/auth-session";
import { prisma } from "@/lib/db";

export default async function ProfilePage() {
  const sessionUser = await getSessionUserFromCookies();
  if (!sessionUser) {
    redirect("/login?next=/profile");
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      email: true,
      displayName: true,
      createdAt: true
    }
  });

  if (!user) {
    redirect("/login?next=/profile");
  }

  const memberSince = user.createdAt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="rounded-lg border border-white/[0.08] bg-surface-card p-6">
        <h1 className="font-heading text-2xl font-semibold text-fg-primary">
          Profile
        </h1>
        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="text-fg-muted">Display name</dt>
            <dd className="mt-1 text-fg-primary">
              {user.displayName ?? (
                <span className="text-fg-muted">Not set</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-fg-muted">Email</dt>
            <dd className="mt-1 text-fg-primary">{user.email}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Member since</dt>
            <dd className="mt-1 text-fg-primary">{memberSince}</dd>
          </div>
        </dl>
      </div>
      <div className="flex flex-wrap gap-2">
        <NavButton href="/logout" variant="primary">
          Sign out
        </NavButton>
        <NavButton href="/" variant="secondary">
          Home
        </NavButton>
      </div>
      <p className="text-center text-xs text-fg-muted">
        Need a different account?{" "}
        <Link
          href="/register"
          className="font-medium text-accent underline-offset-2 hover:underline"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
