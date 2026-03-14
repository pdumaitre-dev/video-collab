# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Video Annotation MVP — a Next.js 14 (App Router) + Prisma + PostgreSQL + Tailwind CSS app for annotating videos with time-range comments. Single monolithic service on port 3000.

### Required secrets (injected as environment variables)

| Secret | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon cloud DB) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token (for cloud-hosted videos) |

Both are read automatically by Next.js / Prisma from the process environment; no `.env` file is strictly required if secrets are injected, but you can create one for convenience:

```bash
python3 -c "
import os
with open('.env','w') as f:
    for k in ('DATABASE_URL','BLOB_READ_WRITE_TOKEN'):
        v = os.environ.get(k,'')
        if v: f.write(f'{k}=\"{v}\"\n')
"
```

### Key commands

Standard commands are in `package.json` scripts — see `README.md` "Getting started" for the full walkthrough. Quick reference:

- **Dev server:** `npm run dev` (port 3000)
- **Lint:** `npm run lint`
- **Build:** `npm run build`
- **Prisma generate:** `npx prisma generate`
- **Prisma migrate (deploy only):** `npx prisma migrate deploy`
- **Seed:** `npx ts-node prisma/seed.ts`

### Gotchas

- **Node.js 24 required.** The repo enforces `"engines": { "node": ">=24.0.0" }`. Activate via `nvm use 24` (or `nvm install 24` if not yet installed).
- **ESLint config required for non-interactive lint.** Without `.eslintrc.json`, `next lint` prompts interactively. The repo includes `.eslintrc.json` with `"extends": "next/core-web-vitals"`.
- **Remote database.** `DATABASE_URL` points to a Neon cloud PostgreSQL instance — no local PostgreSQL needed.
- **Prisma generate after npm install.** Always run `npx prisma generate` after `npm install` to regenerate the Prisma client in `node_modules`.
- **Vercel Blob is optional.** The homepage (`/`) lists DB-backed videos; `/videos` lists Blob-stored videos. The app works without `BLOB_READ_WRITE_TOKEN` for DB-backed video flows.

### Skills

- **Core critical-path smoke test:** `.cursor/skills/core-e2e-smoke-test/SKILL.md`
  - Run this when validating that core video annotation behavior was not regressed.
  - If any smoke-test step fails or is inconclusive, explicitly notify the reviewer with expected vs actual behavior and evidence.
