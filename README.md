## Video Annotation MVP

Minimal Next.js + Postgres application for annotating a video with time-range comments.

### Stack

- Next.js (App Router, React + TypeScript)
- PostgreSQL
- Prisma ORM
- Tailwind CSS

### Getting started

1. **Install dependencies**

```bash
npm install
```

2. **Configure Postgres**

Update `DATABASE_URL` in `.env` to point to a running PostgreSQL instance, for example:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/video_annotation_mvp?schema=public"
```

3. **Apply migrations and generate the client**

```bash
npx prisma migrate dev --name init
npx prisma generate
```

4. **Seed sample data (optional)**

```bash
npx ts-node prisma/seed.ts
```

Ensure that a video file exists at `public/videos/sample.mp4` (or update the seed data `sourceUrl`).

5. **Run the dev server**

```bash
npm run dev
```

Then open `http://localhost:3000` to view the app.

