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
          page: "#0a0a0c",
          panel: "#121216",
          card: "#1a1a1f",
          elevated: "#222228"
        },
        fg: {
          primary: "#f4f4f5",
          secondary: "#a1a1aa",
          muted: "#71717a",
          disabled: "#52525b"
        },
        accent: {
          DEFAULT: "#3b82f6",
          hover: "#60a5fa",
          muted: "rgba(59, 130, 246, 0.15)"
        }
      }
    }
  },
  plugins: []
};

export default config;

