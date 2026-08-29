"use client";

import Link from "next/link";

import LogoutButton from "@/components/LogoutButton";
import NavButton from "@/components/ui/NavButton";

export default function LogoutPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border border-white/[0.08] bg-surface-card p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-fg-primary">
          Sign out
        </h1>
        <p className="mt-2 text-sm text-fg-secondary">
          You will be signed out on this device. You can sign in again any time.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <LogoutButton redirectTo="/" />
        <NavButton href="/" variant="secondary">
          Cancel
        </NavButton>
      </div>
      <p className="text-center text-sm text-fg-muted">
        <Link
          href="/profile"
          className="font-medium text-accent underline-offset-2 hover:underline"
        >
          Back to profile
        </Link>
      </p>
    </div>
  );
}
