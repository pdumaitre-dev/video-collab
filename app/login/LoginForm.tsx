"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { safeRedirectPath } from "@/lib/auth-redirect";

interface LoginFormProps {
  nextPath?: string;
}

export default function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not sign in");
        return;
      }
      router.refresh();
      router.push(safeRedirectPath(nextPath));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border border-white/[0.08] bg-surface-card p-6">
      <h1 className="font-heading text-2xl font-semibold text-fg-primary">
        Sign in
      </h1>
      <p className="mt-1 text-sm text-fg-muted">
        No account?{" "}
        <Link
          href="/register"
          className="rounded-sm font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Register
        </Link>
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-fg-secondary">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            className="rounded-md border border-white/[0.12] bg-surface-page px-3 py-2 text-fg-primary outline-none ring-accent/40 focus:ring-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-fg-secondary">
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            className="rounded-md border border-white/[0.12] bg-surface-page px-3 py-2 text-fg-primary outline-none ring-accent/40 focus:ring-2"
          />
        </label>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
