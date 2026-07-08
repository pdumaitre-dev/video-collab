# AGENTS.md

## Overview

Video Annotation MVP — Next.js 14 (App Router) + Prisma 6 + Neon PostgreSQL + Vercel Blob + Tailwind CSS. Single monolithic service on port 3000.

Full local setup: `README.md` Quickstart. Env var names: `.env.example`.

## Required environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string (pooled URL recommended) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token — **required** for primary UI (`/` and `/videos` list Blob; upload/playback need it) |

Optional: `BLOB_ACCESS=private|public` (default `private`).

No `.env` file is required if secrets are injected into the process. For a local `.env`:

```bash
cp .env.example .env
# edit .env, or:
python3 -c "
import os
with open('.env','w') as f:
    for k in ('DATABASE_URL','BLOB_READ_WRITE_TOKEN'):
        v = os.environ.get(k,'')
        if v: f.write(f'{k}=\"{v}\"\n')
"
```

## Key commands

- **Dev server:** `npm run dev` (port 3000)
- **Lint:** `npm run lint`
- **Build:** `npm run build`
- **Prisma client:** `npm run prisma:generate` (also runs on `npm install` via `postinstall`)
- **Migrations (local / CI with wire access):** `npx prisma migrate deploy`
- **Seed:** `npm run prisma:seed` — legacy `Video` + `Comment` rows only; does **not** create Blob files or smoke-test fixtures (see below)

## Cursor Cloud bootstrap (ordered)

Run this sequence when opening the repo in a cloud agent (secrets already injected):

1. **Node 24** — `node -v` must match `24.x`. Use `nvm use` if `.nvmrc` is honored; otherwise ensure the environment provides Node 24.
2. **Install** — `npm install` (runs `postinstall` → `prisma generate` automatically).
3. **Env** — confirm `DATABASE_URL` (Neon, not `localhost`) and `BLOB_READ_WRITE_TOKEN` are set.
4. **Migrations** — do **not** rely on `prisma migrate deploy` in cloud; the shared Neon DB should already have migrations applied. Run migrations only from local/CI with wire access if you own a fresh database.
5. **Dev server** — `npm run dev` → http://localhost:3000
6. **Network** — `.cursor/sandbox.json` must allow Neon and Vercel Blob hosts (see below). If outbound calls fail, widen `networkPolicy.allow` before debugging app code.
7. **Smoke test** — optional; see `.cursor/skills/core-e2e-smoke-test/SKILL.md` and **Smoke test data** below.

## Cursor Cloud / restricted environments

- **Neon HTTP adapter.** Port 5432 can be blocked; runtime DB uses `@prisma/adapter-neon` in `lib/db.ts` (HTTPS/WebSocket).
- **`prisma migrate deploy` may fail in cloud.** Use Neon dashboard or a local machine; shared project DB is already migrated.
- **Blob is required for main flows.** Listing, upload, and playback use Vercel Blob. Empty env → empty video list (errors swallowed on `/`).
- **Sandbox network.** `.cursor/sandbox.json` defaults to `deny` with an allowlist for Neon (`*.neon.tech`), Vercel Blob (`blob.vercel-storage.com`, `*.blob.vercel-storage.com`), and `registry.npmjs.org`. Add hosts here if install or runtime still cannot reach external services.

## Smoke test data

The core smoke skill (`.cursor/skills/core-e2e-smoke-test/SKILL.md`) expects the **shared** Neon + Blob environment to already contain:

- Multiple videos under the Blob `videos/` prefix
- Prefer the canonical fixture **`Nadia 12 mars`** (comments + green timebar ranges)
- If that title is missing, use **any** listed video that shows existing comments and green ranges; record the substitute title in the report
- Chapter smoke coverage creates and deletes a transient chapter during the browser test; no pre-seeded chapter fixture is required.

`prisma/seed.ts` does not create Blob objects, `Comment_blob` rows, or `Chapter_blob` rows — do not use seed to satisfy smoke preconditions.

## Local development

- **Node.js 24 required.** `"engines": { "node": "24.x" }` (matches Vercel deployment runtime). Run `nvm use` (`.nvmrc` → 24) or `nvm install 24`.
- **After pulling infra changes:** `npm install` (regenerates Prisma client via `postinstall`).
- **Neon only at runtime.** `DATABASE_URL` must be from the Neon dashboard, not `localhost`.
- **No local PostgreSQL.** Use the remote Neon instance.
- **ESLint:** `.eslintrc.json` extends `next/core-web-vitals` so `npm run lint` stays non-interactive.

## Skills

- **Core critical-path smoke test:** `.cursor/skills/core-e2e-smoke-test/SKILL.md`
  - Run when validating core video annotation behavior.
  - On failure, report expected vs actual behavior with evidence.
- **Ticket to PRD:** `.cursor/skills/ticket-to-prd/SKILL.md`
  - PDDS Jira ticket → grounded PRD in fixed Confluence folder, with Jira link-back. Requires Atlassian MCP.
- **PDDS bug triage:** `.cursor/skills/pdds-bug-triage/SKILL.md`
  - PDDS bug → reproduce, screen recording in cloud agent run, triage comment on Jira (video link = agent run URL, not Jira attachment). Requires Atlassian MCP + cloud agent.
