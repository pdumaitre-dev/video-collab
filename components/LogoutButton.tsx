"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface LogoutButtonProps {
  redirectTo?: string;
}

export default function LogoutButton({
  redirectTo = "/"
}: LogoutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      router.push(redirectTo);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={pending}
      className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
