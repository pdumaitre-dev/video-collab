# UI — tokens, not raw colors

If a changed file under `components/` adds or changes a raw hex (`#rrggbb`) or `rgb()` color when a Tailwind token exists (`bg-surface-*`, `text-fg-*`, `bg-accent*`), then:

- Add a blocking finding titled `[UI] Raw color, use a token`
- Body: "Use semantic tokens from `docs/style-reference.md` instead of hardcoded colors."

Exception: `VideoPlayer` / `TimeBar` interaction math (not decorative color).
