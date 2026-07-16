# Expense Tracker (web)

Personal expense tracker built with **Next.js**, **TypeScript**, **Tailwind CSS**, **Prisma 7**, and **PostgreSQL**.

Planning docs live in the parent repo folder: [`../planning/`](../planning/).

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| ORM | Prisma 7 |
| Database | PostgreSQL (local + production) |
| Deploy target | Vercel + hosted Postgres |

## Prerequisites

- **Node.js** (LTS recommended) and **npm**
- **PostgreSQL** running locally (Homebrew, Postgres.app, or Docker)
- Git (optional, for version control)

## Quick start

```bash
cd web
npm install
```

### 1. Database

Create an empty database (name can match your URL):

```bash
# Homebrew / local Postgres (typical macOS role = your OS username)
createdb expense_tracker
```

**Docker alternative** (use a non-conflicting host port if something already uses `5432`):

```bash
docker run --name expense-tracker-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=expense_tracker \
  -p 5433:5432 \
  -d postgres:16
```

> **Port conflict:** On this machine, Homebrew Postgres often owns `localhost:5432`. A Docker container mapped to `5432` may not be what apps connect to. Prefer Homebrew for local dev, or map Docker to another port (e.g. `5433`) and put that port in `DATABASE_URL`.

### 2. Environment variables

Copy the example and edit values if needed:

```bash
cp .env.example .env
```

Example `.env`:

```env
# Homebrew / peer auth (no password) — adjust user/host/port as needed
DATABASE_URL="postgresql://newuser@localhost:5432/expense_tracker?schema=public"

# Docker example (if mapped to host port 5433):
# DATABASE_URL="postgresql://postgres:postgres@localhost:5433/expense_tracker?schema=public"
```

Never commit `.env` (it is gitignored).

### 3. Migrate & generate Prisma Client

From `web/`:

```bash
npx prisma migrate dev
npx prisma generate
```

First-time / named migration example:

```bash
npx prisma migrate dev --name init
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Prisma 7 notes (important)

Prisma 7 does **not** put the connection URL in `schema.prisma`.

| Concern | Where it lives |
| --- | --- |
| Schema / models | `prisma/schema.prisma` — `provider = "postgresql"` only (no `url`) |
| Migrate / introspect URL | `prisma.config.ts` → `datasource.url` from `DATABASE_URL` |
| App runtime client | `src/lib/prisma.ts` — `PrismaClient` + `@prisma/adapter-pg` |
| Generated client | `src/generated/prisma` (gitignored; run `prisma generate`) |

Do **not** add this back to the schema (invalid on Prisma 7):

```prisma
// ❌ url = env("DATABASE_URL")
```

---

## Common commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npx prisma migrate dev` | Apply migrations in development (creates new ones if schema changed) |
| `npx prisma migrate dev --name <name>` | Create/apply a named migration |
| `npx prisma migrate deploy` | Apply migrations in CI/production (no prompts) |
| `npx prisma generate` | Regenerate Prisma Client |
| `npx prisma studio` | Browser UI for the database |
| `npx prisma db pull` | Introspect DB into schema (use carefully) |

### Prisma Studio

```bash
npx prisma studio
```

Opens a local URL (port may vary). If you see `ERR_STREAM_UNABLE_TO_PIPE` in the terminal, Studio often still works in the browser — that log is usually a closed HTTP stream, not a failed DB connection.

---

## Project layout (relevant bits)

```text
web/
  prisma/
    schema.prisma          # models + provider
    migrations/            # SQL migrations
  prisma.config.ts         # Prisma 7 CLI config (DATABASE_URL)
  src/
    app/
      page.tsx             # redirects `/` → `/dashboard`
      (app)/               # shell with nav
        layout.tsx
        dashboard/
        expenses/
        categories/
    components/
      app-nav.tsx          # top navigation
    lib/prisma.ts          # shared PrismaClient (adapter)
    generated/prisma/      # generated client (do not edit)
  .env                     # local secrets (gitignored)
  .env.example             # safe template for others
```

Planning / phases: `../planning/implementation-plan.md`, `../planning/phase-0-todo.md`.

---

## Troubleshooting

### `url` is no longer supported in schema files (P1012)

You are on Prisma 7. Remove `url` from `datasource` in `schema.prisma`. Keep the URL in `prisma.config.ts` and `.env`.

### `User was denied access` / `role "..." does not exist`

`DATABASE_URL` does not match the Postgres instance that actually listens on that host/port. Check:

```bash
psql "$DATABASE_URL" -c 'SELECT current_user, current_database();'
lsof -iTCP:5432 -sTCP:LISTEN
```

### Migration succeeds but app cannot query

Ensure `DATABASE_URL` is available to Next.js (`.env` in `web/`) and that you import the shared client from `src/lib/prisma.ts` (adapter required in Prisma 7).

---

## Deploy (later)

Production target: **Vercel** + **hosted PostgreSQL** (Neon, Supabase, Vercel Postgres, etc.).

1. Set `DATABASE_URL` (and later auth secrets) in the Vercel project.
2. Run migrations against production (`prisma migrate deploy` in CI or a release step).
3. Deploy the Next.js app.

Details will be filled in during Phase 4 of the implementation plan.
