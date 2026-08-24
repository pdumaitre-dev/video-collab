"use client";

import * as React from "react";

type Theme = "light" | "dark";

function getCurrentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  try {
    window.localStorage.setItem("theme", theme);
  } catch {
    // Some privacy modes block storage; the active page can still switch theme.
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>("light");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setTheme(getCurrentTheme());
    setMounted(true);
  }, []);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === "dark"}
      onClick={() => {
        applyTheme(nextTheme);
        setTheme(nextTheme);
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-card px-3 py-1.5 text-sm font-medium text-fg-secondary transition-colors hover:bg-surface-elevated hover:text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page"
    >
      <span>{mounted ? `Theme: ${theme === "dark" ? "Dark" : "Light"}` : "Theme"}</span>
    </button>
  );
}
