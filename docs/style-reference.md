# Ballet Booster — Style Reference

This document defines the visual system for the Ballet Booster webapp. Use it as the source of truth when adding or modifying UI.

**Design system in Figma:** A live design system page at `/design-system` can be captured into Figma via the Figma MCP `generate_figma_design` tool. See `docs/design-system-figma.md` for the capture workflow.

## Brand and Visual Intent

- **Tone**: Modern, sport-oriented, fashionable — in the spirit of hot yoga, dynamo, ballet.
- **Feel**: Studio-athletic — clean, controlled, premium, energetic. Not playful or playful-cute.
- **Avoid**: Handwritten fonts, overly artsy or decorative elements, flat generic UI.

## Typography

### Font Stack

| Role | Font | Usage |
|------|------|-------|
| Headings & navigation | **Space Grotesk** | Page titles, section headers, nav labels, brand name |
| Body & UI copy | **Manrope** | Paragraphs, form labels, buttons, comments, metadata |

Fonts are loaded via `next/font/google` in `app/layout.tsx` and exposed as CSS variables (`--font-heading`, `--font-body`). Apply via Tailwind: `font-heading` and `font-body`.

### Usage Rules

- Use `font-heading` for `h1`–`h6` and any prominent navigation or section labels.
- Use the default body font for all other text.
- Avoid monospace except for timestamps, IDs, and technical metadata.

## Color Palette

Semantic colors are **CSS variables** in `app/globals.css`. **Dark** is the default (`:root`). **Light** applies when `html` has class `light` (see Theme below). Tailwind maps `surface-*`, `fg-*`, `accent`, and `divider` to those variables.

### Dark (default)


| Token | Hex | Usage |
|-------|-----|-------|
| `surface-page` | `#0a0a0c` | Page background, deepest layer |
| `surface-panel` | `#121216` | Side panels, comments column |
| `surface-card` | `#1a1a1f` | Cards, form containers, list items |
| `surface-elevated` | `#222228` | Hover states, elevated cards |

### Foreground (Text)

| Token | Hex | Usage |
|-------|-----|-------|
| `fg-primary` | `#f4f4f5` | Primary text, headings |
| `fg-secondary` | `#a1a1aa` | Secondary text, descriptions |
| `fg-muted` | `#71717a` | Metadata, hints, disabled-like states |
| `fg-disabled` | `#52525b` | Disabled controls |

### Accent

| Token | Hex | Usage |
|-------|-----|-------|
| `accent` | `#3b82f6` | Primary actions, links, focus rings |
| `accent-hover` | `#60a5fa` | Hover state for accent buttons |
| `accent-muted` | `rgba(59, 130, 246, 0.15)` | Selected states, subtle highlights |

### Light (`html.light`)

| Token | Hex | Usage |
|-------|-----|-------|
| `surface-page` | `#f4f4f5` | Page background |
| `surface-panel` | `#ececee` | Side panels |
| `surface-card` | `#ffffff` | Cards |
| `surface-elevated` | `#fafafa` | Hover states |
| `fg-primary` | `#18181b` | Primary text |
| `fg-secondary` | `#52525b` | Secondary text |
| `accent` | `#2563eb` | Primary actions (hover `#3b82f6`) |

### Borders

Use `border-divider` for default borders and `border-divider-emphasis` for hover/emphasis. Values are theme-aware (`rgba` white in dark, black in light). Avoid hard-coded `border-white/[0.08]`.

## Theme

- **Toggle:** Header sun/moon control (`components/ui/ThemeToggle.tsx`).
- **Persistence:** `localStorage` key `bb-theme` (`light` | `dark`).
- **Default:** System `prefers-color-scheme` when no stored preference; dark palette on `:root`, light on `html.light`.
- **No flash:** Inline `ThemeInitScript` in `app/theme-init.tsx` runs before paint.

## Surface Hierarchy

```
surface-page (deepest)
  └── surface-panel (e.g. comments column)
        └── surface-card (e.g. comment form, list items)
              └── surface-elevated (hover, active)
```

- **Page**: Base background. No content sits directly on it without a card or panel.
- **Panel**: Distinct side areas (e.g. comments). Use `rounded-lg`, subtle shadow for depth.
- **Card**: Form containers, list items. Use `rounded-lg`, `border-divider`.
- **Elevated**: Hover/active states. Slightly lighter than card.

## Navigation and Buttons

### Global Header

- Brand name links to `/` and uses `font-heading`.
- Nav items: "Videos" (secondary), "Upload" (primary accent).
- Use `BackLink` for page-level back navigation (e.g. "Back to videos").

### Button Styles

| Type | Component / Class | When to Use |
|------|------------------|-------------|
| Primary | `NavButton variant="primary"` or `bg-accent` | Main CTAs (Upload, Save) |
| Secondary | `NavButton variant="secondary"` | Secondary actions (Browse) |
| Back | `BackLink` | Return to parent (e.g. videos list) |

### Rules

- Do **not** use plain text links (`text-*-400 hover:text-*-200`) for navigation. Use `BackLink`, `NavButton`, or button-styled `Link` components.
- Primary actions: accent background, white text.
- Secondary actions: ghost/outline style, `text-fg-secondary` with hover `bg-surface-card`.

## Comments

### Panel

- Comments column uses `bg-surface-panel`, `rounded-lg`, `border-divider`.
- Optional subtle shadow: `shadow-panel` for depth.

### Comment Form

- Card-style container: `bg-surface-card`, `rounded-lg`, `p-4`.
- When no range selected: no header; placeholder "Select a time range on the timeline to add a comment." When selected: header "Add comment on range" with range inline (e.g. `0:00 – 1:30`).
- Textarea: `bg-surface-page`, `border-divider`, `focus:border-accent`.
- Submit: `bg-accent`, white text, disabled state with `opacity-50`.

### Comment List

- Empty state: Dashed border, centered message, two-line hint.
- Comment items: `rounded-lg`, `bg-surface-card`, `border-divider`.
- Delete button: trash icon, shown on hover; red hover state, loading spinner while deleting.
- Selected: `border-accent`, `bg-accent-muted`, `ring-1 ring-accent/30`.
- Metadata (time range, created): `font-mono`, `text-fg-muted`, `text-[11px]`.

## Depth and Feel (Without Images)

- **Layered surfaces**: Use page → panel → card → elevated hierarchy.
- **Borders**: Hairline `border-divider` and `border-divider-emphasis` for separation.
- **Shadows**: Restrained `shadow-panel` on panels.
- **Rounded corners**: `rounded-lg` for cards/panels, `rounded-md` for inputs/buttons.
- **Spacing**: Consistent `space-y-*` and `gap-*` for rhythm.
- **Transitions**: `transition-colors` or `transition-all` on interactive elements.

## Do Not Touch

The following components and UI elements are **out of scope** for style changes:

- **Video player** (`components/VideoPlayer.tsx`): Video surface, loading, error states.
- **Time bar** (`components/TimeBar.tsx`): Seek bar, range selection, current time, duration. Drag start/end times use same format as current time (yellow `#fde68a`, monospace, 11px) and sit slightly above the ruler. Selected range is drawn as a yellow border only (`#fde68a`, transparent fill) on both ruler and pill track; it persists until comment is submitted. Saved comment ranges use the same pattern in green (`rgb(16, 185, 129)`). Green (z-index 5) sits below yellow (z-index 6–7) so yellow wins when overlapping.
- **Play/pause button**: The control in `VideoPageShell` that toggles playback.

These remain as-is to preserve playback behavior and accessibility.

## Acceptable vs. Avoid

| Acceptable | Avoid |
|------------|-------|
| Space Grotesk, Manrope | Handwritten, script, or decorative fonts |
| Layered dark surfaces | Flat single-tone backgrounds |
| Accent blue for actions | Many competing accent colors |
| Button/pill navigation | Plain underlined text links |
| Subtle borders and shadows | Heavy gradients or busy patterns |
| Clean, geometric shapes | Overly rounded or organic shapes |
