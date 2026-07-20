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
| Auth | Auth.js v5 (`next-auth`) — email/password (Phase 1) |
| Database | PostgreSQL (local + production) |
| Default currency | **THB** (single-currency MVP; see `src/lib/constants.ts`) |
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

Example `.env` (see `.env.example` for full comments):

```env
# Homebrew / peer auth (no password) — adjust user/host/port as needed
DATABASE_URL="postgresql://newuser@localhost:5432/expense_tracker?schema=public"

# Docker example (if mapped to host port 5433):
# DATABASE_URL="postgresql://postgres:postgres@localhost:5433/expense_tracker?schema=public"

# Auth.js — required for sessions (generate a unique value per environment)
#   openssl rand -base64 32
AUTH_SECRET="your-long-random-secret"

# Optional locally; required on Vercel (public HTTPS origin, no trailing slash)
# AUTH_URL="http://localhost:3000"
```

Never commit `.env` (gitignored). Commit `.env.example` only. Use a **different** `AUTH_SECRET` in production than in local dev.

### 3. Migrate & generate Prisma Client

From `web/`:

```bash
# Development — apply migrations and create new ones as schema changes
npm run db:migrate

# Or explicitly:
# npx prisma migrate dev
# npx prisma generate
```

Named migration example:

```bash
npx prisma migrate dev --name init
```

**Production / CI** (never use `migrate dev` against prod):

```bash
npm run db:migrate:deploy
# equivalent: npx prisma migrate deploy
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You should land on **login** (or **dashboard** if already signed in). Create an account at `/register` (password at least 8 characters).

### Auth routes

| Path | Access |
| --- | --- |
| `/login`, `/register` | Public (redirect to dashboard if already logged in) |
| `/dashboard`, `/expenses`, `/categories` | Authenticated only |
| `/api/auth/*` | Auth.js handlers |

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
| `npm run build` | `prisma generate` + production Next.js build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Dev migrations (`prisma migrate dev`) |
| `npm run db:migrate:deploy` | Apply migrations in CI/production (`migrate deploy`) |
| `npm run db:generate` | Regenerate Prisma Client |
| `npm run db:studio` | Prisma Studio |
| `npx prisma migrate dev --name <name>` | Create/apply a named migration |
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

Planning / phases: `../planning/implementation-plan.md`, `../planning/phase-4-todo.md`.

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

## Deploy (Vercel + hosted Postgres)

Production target: **Vercel** + **hosted PostgreSQL** (Neon, Supabase, or Vercel Postgres).

### 1. Hosted database

**This project (Phase 4):** a Prisma Postgres instance was created with `npx create-db` and migrations were applied. Credentials are in **`web/.env.hosted`** (gitignored).

1. **Claim the DB** (required): open `CLAIM_URL` from `.env.hosted` and claim it to your Prisma account so it is not auto-deleted.
2. Use that `DATABASE_URL` on Vercel (and keep `.env.hosted` local only).
3. Re-apply migrations if you ever recreate the database:

```bash
cd web
set -a && source .env.hosted && set +a
npm run db:migrate:deploy
```

Alternative providers (Neon / Supabase / Vercel Postgres) work the same way: put their URL in `DATABASE_URL` and run `db:migrate:deploy`.

Do **not** use `prisma migrate dev` against production.

### 2. Vercel project

**CLI (recommended for this repo):**

```bash
cd web
npx vercel login          # one-time browser login
bash scripts/deploy-vercel.sh
```

The script uses **`web/.env.vercel`** (gitignored) for `DATABASE_URL` / `AUTH_SECRET`, deploys production, then sets `AUTH_URL` to the live `*.vercel.app` URL and redeploys.

**Dashboard alternative:**

1. Import the Git repository in Vercel.
2. Set **Root Directory** to `web` if the app lives under `expense-tracker/web/`.
3. Framework: Next.js (default).
4. Build command: `npm run build` (`prisma generate && next build`).
5. Add **Environment Variables** (Production; Preview optional):

| Variable | Example / notes |
| --- | --- |
| `DATABASE_URL` | From `.env.hosted` / `.env.vercel` |
| `AUTH_SECRET` | New secret: `openssl rand -base64 32` (not the local one) |
| `AUTH_URL` | `https://your-app.vercel.app` (no trailing slash) |

6. Deploy.

After the first deploy, set `AUTH_URL` to the real production URL if it differs, then redeploy.

### 3. Production smoke test

1. Open the Vercel URL → register a user  
2. Categories defaults / add category  
3. Create an expense → dashboard total updates  
4. Filters on `/expenses`  
5. Log out / log in — session persists  

### 4. Checklist

- [ ] Hosted Postgres provisioned  
- [ ] `npm run db:migrate:deploy` against prod URL  
- [ ] Vercel env: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`  
- [ ] Root Directory = `web` (if monorepo layout)  
- [ ] Deploy succeeds  
- [ ] Smoke test passed  

Planning details: [`../planning/phase-4-todo.md`](../planning/phase-4-todo.md).
