import BackLink from "@/components/ui/BackLink";
import Link from "next/link";

export const metadata = {
  title: "Design System — Ballet Booster",
  description: "Ballet Booster design system: colors, typography, components"
};

const colorTokens = [
  {
    group: "Surfaces",
    tokens: [
      { name: "surface-page", hex: "#0a0a0c", usage: "Page background" },
      { name: "surface-panel", hex: "#121216", usage: "Side panels" },
      { name: "surface-card", hex: "#1a1a1f", usage: "Cards, list items" },
      { name: "surface-elevated", hex: "#222228", usage: "Hover states" }
    ]
  },
  {
    group: "Foreground",
    tokens: [
      { name: "fg-primary", hex: "#f4f4f5", usage: "Primary text" },
      { name: "fg-secondary", hex: "#a1a1aa", usage: "Secondary text" },
      { name: "fg-muted", hex: "#71717a", usage: "Metadata, hints" },
      { name: "fg-disabled", hex: "#52525b", usage: "Disabled" }
    ]
  },
  {
    group: "Accent",
    tokens: [
      { name: "accent", hex: "#3b82f6", usage: "Primary actions" },
      { name: "accent-hover", hex: "#60a5fa", usage: "Hover state" },
      { name: "accent-muted", hex: "rgba(59,130,246,0.15)", usage: "Selected" }
    ]
  }
];

const typographySamples = [
  { label: "Heading H1", className: "font-heading text-3xl font-semibold" },
  { label: "Heading H2", className: "font-heading text-xl font-semibold" },
  { label: "Heading H3", className: "font-heading text-lg font-semibold" },
  { label: "Body", className: "text-base" },
  { label: "Body small", className: "text-sm" },
  { label: "Caption", className: "text-xs text-fg-muted" }
];

export default function DesignSystemPage() {
  return (
    <div className="space-y-12 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold text-fg-primary">
          Ballet Booster Design System
        </h1>
        <BackLink href="/">Back to home</BackLink>
      </div>

      {/* Brand */}
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold text-fg-primary">
          Brand
        </h2>
        <p className="text-sm text-fg-secondary">
          Modern, sport-oriented, studio-athletic. Clean, controlled, premium.
        </p>
      </section>

      {/* Colors */}
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-fg-primary">
          Color Palette
        </h2>
        <div className="flex flex-col gap-6">
          {colorTokens.map((group) => (
            <div key={group.group} className="space-y-3">
              <h3 className="text-sm font-medium text-fg-secondary">
                {group.group}
              </h3>
              <div className="flex flex-wrap gap-4">
                {group.tokens.map((token) => (
                  <div
                    key={token.name}
                    className="flex flex-col gap-2 rounded-lg border border-white/[0.08] bg-surface-card p-4"
                  >
                    <div
                      className="h-12 w-24 rounded-md border border-white/[0.08]"
                      style={{ backgroundColor: token.hex }}
                    />
                    <div>
                      <span className="font-mono text-xs text-fg-muted">
                        {token.name}
                      </span>
                      <p className="text-xs text-fg-secondary">{token.usage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Surface hierarchy */}
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-fg-primary">
          Surface Hierarchy
        </h2>
        <div className="flex flex-col gap-2 rounded-lg border border-white/[0.08] bg-surface-panel p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]">
          <div className="rounded-lg border border-white/[0.08] bg-surface-card p-4">
            <div className="rounded-lg border border-white/[0.08] bg-surface-elevated p-3">
              <span className="text-sm text-fg-primary">
                page → panel → card → elevated
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-fg-primary">
          Typography
        </h2>
        <div className="space-y-2">
          <p className="text-sm text-fg-secondary">
            Heading: Space Grotesk · Body: Manrope
          </p>
          <div className="flex flex-col gap-3 rounded-lg border border-white/[0.08] bg-surface-card p-4">
            {typographySamples.map((sample) => (
              <div key={sample.label} className="flex flex-col gap-1">
                <span className="text-xs text-fg-muted">{sample.label}</span>
                <span className={sample.className}>Ballet Booster</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-fg-primary">
          Buttons
        </h2>
        <div className="flex flex-wrap gap-4 rounded-lg border border-white/[0.08] bg-surface-card p-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white no-underline transition-colors hover:bg-accent-hover"
          >
            Primary
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-fg-secondary no-underline transition-colors hover:bg-surface-card hover:text-fg-primary"
          >
            Secondary
          </Link>
          <BackLink href="/">Back</BackLink>
        </div>
      </section>

      {/* Borders & radius */}
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-fg-primary">
          Borders & Radius
        </h2>
        <div className="flex flex-wrap gap-4">
          <div className="rounded-lg border border-white/[0.08] bg-surface-card p-4">
            <span className="text-sm text-fg-secondary">
              Default border · rounded-lg
            </span>
          </div>
          <div className="rounded-lg border border-white/[0.12] bg-surface-card p-4">
            <span className="text-sm text-fg-secondary">
              Emphasis border · rounded-lg
            </span>
          </div>
          <div className="rounded-md border border-white/[0.08] bg-surface-card px-3 py-2">
            <span className="text-sm text-fg-secondary">
              Control · rounded-md
            </span>
          </div>
        </div>
      </section>

      {/* Spacing */}
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-fg-primary">
          Spacing
        </h2>
        <div className="flex flex-wrap items-end gap-4 rounded-lg border border-white/[0.08] bg-surface-card p-4">
          <div className="flex flex-col items-center gap-1">
            <div className="h-4 w-4 rounded bg-accent/30" />
            <span className="text-xs text-fg-muted">4 (1rem)</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-6 w-6 rounded bg-accent/30" />
            <span className="text-xs text-fg-muted">6 (1.5rem)</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-8 w-8 rounded bg-accent/30" />
            <span className="text-xs text-fg-muted">8 (2rem)</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-12 w-12 rounded bg-accent/30" />
            <span className="text-xs text-fg-muted">12 (3rem)</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-16 w-16 rounded bg-accent/30" />
            <span className="text-xs text-fg-muted">16 (4rem)</span>
          </div>
        </div>
      </section>
    </div>
  );
}
