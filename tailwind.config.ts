import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./app/**/*.css",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"]
      },
      colors: {
        surface: {
          page: "rgb(var(--color-surface-page) / <alpha-value>)",
          panel: "rgb(var(--color-surface-panel) / <alpha-value>)",
          card: "rgb(var(--color-surface-card) / <alpha-value>)",
          elevated: "rgb(var(--color-surface-elevated) / <alpha-value>)"
        },
        fg: {
          primary: "rgb(var(--color-fg-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-fg-secondary) / <alpha-value>)",
          muted: "rgb(var(--color-fg-muted) / <alpha-value>)",
          disabled: "rgb(var(--color-fg-disabled) / <alpha-value>)"
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          hover: "rgb(var(--color-accent-hover) / <alpha-value>)",
          muted: "rgb(var(--color-accent) / 0.15)",
          contrast: "rgb(var(--color-accent-contrast) / <alpha-value>)"
        },
        border: {
          DEFAULT: "rgb(var(--color-border) / <alpha-value>)",
          emphasis: "rgb(var(--color-border-emphasis) / <alpha-value>)"
        }
      }
    }
  },
  plugins: []
};

export default config;

