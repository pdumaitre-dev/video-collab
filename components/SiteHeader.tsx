import Link from "next/link";
import { getSessionUserFromCookies } from "@/lib/auth-session";

export default async function SiteHeader() {
  const user = await getSessionUserFromCookies();

  return (
    <header className="mb-6 border-b border-white/[0.08] pb-4">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-heading text-xl font-semibold tracking-tight text-fg-primary no-underline transition-colors hover:text-fg-secondary"
        >
          Ballet Booster
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/videos"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-fg-secondary no-underline transition-colors hover:bg-surface-card hover:text-fg-primary"
          >
            Videos
          </Link>
          <Link
            href="/design-system"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-fg-muted no-underline transition-colors hover:bg-surface-card hover:text-fg-secondary"
          >
            Design System
          </Link>
          <Link
            href="/videos/upload"
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white no-underline transition-colors hover:bg-accent-hover"
          >
            Upload
          </Link>
          {user ? (
            <div className="flex flex-wrap items-center gap-2 border-l border-white/[0.08] pl-2 sm:pl-3">
              <Link
                href="/profile"
                className="max-w-[10rem] truncate rounded-md px-3 py-1.5 text-sm font-medium text-fg-secondary no-underline transition-colors hover:bg-surface-card hover:text-fg-primary sm:max-w-[14rem]"
              >
                {user.displayName ?? user.email}
              </Link>
              <Link
                href="/logout"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-fg-secondary no-underline transition-colors hover:bg-surface-card hover:text-fg-primary"
              >
                Sign out
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-1 border-l border-white/[0.08] pl-2 sm:pl-3">
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-fg-secondary no-underline transition-colors hover:bg-surface-card hover:text-fg-primary"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-fg-muted no-underline transition-colors hover:bg-surface-card hover:text-fg-secondary"
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
