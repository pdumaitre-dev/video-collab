import "./globals.css";
import { Space_Grotesk, Manrope } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import type { ReactNode } from "react";
import ThemeToggle from "@/components/ThemeToggle";

const fontHeading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap"
});

const fontBody = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

export const metadata = {
  title: "Ballet Booster",
  description: "Annotate videos with time-range comments"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontHeading.variable} ${fontBody.variable}`}
    >
      <body className="min-h-screen">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = window.localStorage.getItem("theme");
                  var theme = stored === "light" || stored === "dark"
                    ? stored
                    : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
                  document.documentElement.dataset.theme = theme;
                  document.documentElement.style.colorScheme = theme;
                } catch (_) {
                  var theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                  document.documentElement.dataset.theme = theme;
                  document.documentElement.style.colorScheme = theme;
                }
              })();
            `
          }}
        />
        {process.env.NODE_ENV === "development" && (
          <Script
            src="https://mcp.figma.com/mcp/html-to-design/capture.js"
            strategy="beforeInteractive"
          />
        )}
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6">
          <header className="mb-6 border-b border-border pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/"
                className="font-heading text-xl font-semibold tracking-tight text-fg-primary no-underline transition-colors hover:text-fg-secondary"
              >
                Ballet Booster
              </Link>
              <nav className="flex flex-wrap items-center gap-2">
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
                  className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-contrast no-underline transition-colors hover:bg-accent-hover"
                >
                  Upload
                </Link>
                <ThemeToggle />
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}

