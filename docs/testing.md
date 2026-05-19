# Testing

Use Vitest for focused route and utility regression tests.

## Commands

- `npm test`: run the full Vitest suite once.
- `npm run lint`: run Next.js lint checks.
- `npm run build`: run production compilation and type checks when test files or app wiring could affect Next.js discovery.

## Conventions

- Keep tests deterministic and independent of Vercel Blob or PostgreSQL by mocking `@/lib/blob` and `@/lib/db` at module boundaries.
- Prefer route tests for API validation and persistence behavior.
- Add UI tests only when interaction behavior cannot be proven at a smaller boundary.
