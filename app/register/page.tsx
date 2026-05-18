"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const body: { email: string; password: string; displayName?: string } = {
        email,
        password
      };
      const trimmed = displayName.trim();
      if (trimmed) {
        body.displayName = trimmed;
      }
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not register");
        return;
      }
      router.refresh();
      router.push("/");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border border-white/[0.08] bg-surface-card p-6">
      <h1 className="font-heading text-2xl font-semibold text-fg-primary">
        Register
      </h1>
      <p className="mt-1 text-sm text-fg-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="rounded-sm font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Sign in
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
          Display name <span className="text-fg-muted">(optional)</span>
          <input
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(ev) => setDisplayName(ev.target.value)}
            className="rounded-md border border-white/[0.12] bg-surface-page px-3 py-2 text-fg-primary outline-none ring-accent/40 focus:ring-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-fg-secondary">
          Password
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            className="rounded-md border border-white/[0.12] bg-surface-page px-3 py-2 text-fg-primary outline-none ring-accent/40 focus:ring-2"
          />
          <span className="text-xs text-fg-muted">At least 8 characters.</span>
        </label>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
