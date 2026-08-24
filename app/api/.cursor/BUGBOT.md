# Blob API — validate input, leak nothing

For changed files under `app/api/`:

- Blob/comment/stream handlers must validate `pathname` (or the upload file) before Prisma or Blob I/O.
- 4xx/5xx responses must return `{ error: string }` — never raw `Error.message`, stack traces, or env values.
- Do not log `DATABASE_URL` or `BLOB_READ_WRITE_TOKEN`.
- Comment GET must reject pathnames that are not under `videos/` or that contain `..` before querying Prisma.

If any of those fail, add a blocking finding titled `[Blob API] Unsafe handler`.
