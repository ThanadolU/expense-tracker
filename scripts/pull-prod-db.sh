#!/usr/bin/env bash
# Copy the PRODUCTION Postgres database into the LOCAL one (one-way, prod is read-only).
#
# Usage:
#   bash scripts/pull-prod-db.sh            # asks for confirmation
#   bash scripts/pull-prod-db.sh --yes      # no prompt
#
# Config (all optional):
#   PROD_ENV_FILE   file holding the prod DATABASE_URL   (default: .env.vercel)
#   LOCAL_ENV_FILE  file holding the local DATABASE_URL  (default: .env)
#   PROD_DATABASE_URL / LOCAL_DATABASE_URL  override the files above
#   KEEP_SENSITIVE=1  keep password-reset tokens / pending invites (default: wiped locally)
#
# What it does: pg_dump (prod, read-only) -> DROP + recreate local `public` schema -> pg_restore.
# The local schema is replaced with prod's, including the _prisma_migrations table.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# pg_dump refuses to talk to a server newer than itself. Prefer the newest Homebrew
# PostgreSQL client tools (18 → 15) over whatever is first on PATH. Override with PG_BIN=/path/to/bin.
if [[ -n "${PG_BIN:-}" ]]; then
  export PATH="$PG_BIN:$PATH"
else
  for v in 18 17 16 15; do
    for prefix in /opt/homebrew /usr/local; do
      if [[ -x "$prefix/opt/postgresql@$v/bin/pg_dump" ]]; then
        export PATH="$prefix/opt/postgresql@$v/bin:$PATH"
        break 2
      fi
    done
  done
fi
echo "Using $(pg_dump --version)"

PROD_ENV_FILE="${PROD_ENV_FILE:-.env.vercel}"
LOCAL_ENV_FILE="${LOCAL_ENV_FILE:-.env}"
ASSUME_YES=0
[[ "${1:-}" == "--yes" || "${1:-}" == "-y" ]] && ASSUME_YES=1

# Read DATABASE_URL from an env file without sourcing it (no code execution).
read_url() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  grep -E '^DATABASE_URL=' "$file" | tail -1 | cut -d= -f2- | sed -E 's/^["'\'']//; s/["'\'']$//'
}

PROD_URL="${PROD_DATABASE_URL:-$(read_url "$PROD_ENV_FILE")}"
LOCAL_URL="${LOCAL_DATABASE_URL:-$(read_url "$LOCAL_ENV_FILE")}"

[[ -n "$PROD_URL"  ]] || { echo "No prod DATABASE_URL (looked in $PROD_ENV_FILE). Set PROD_DATABASE_URL."; exit 1; }
[[ -n "$LOCAL_URL" ]] || { echo "No local DATABASE_URL (looked in $LOCAL_ENV_FILE). Set LOCAL_DATABASE_URL."; exit 1; }

# libpq rejects Prisma-only query params such as ?schema=public — strip them.
clean_url() {
  echo "$1" | sed -E 's/([?&])(schema|connection_limit|pool_timeout|pgbouncer)=[^&]*&?/\1/g; s/[?&]$//'
}
PROD_URL="$(clean_url "$PROD_URL")"
LOCAL_URL="$(clean_url "$LOCAL_URL")"

host_of() { echo "$1" | sed -E 's#^[a-z]+://([^@/]*@)?([^:/?]+).*#\2#'; }
PROD_HOST="$(host_of "$PROD_URL")"
LOCAL_HOST="$(host_of "$LOCAL_URL")"

# --- Safety rails: never overwrite a non-local database ---
if [[ "$LOCAL_URL" == "$PROD_URL" ]]; then
  echo "Refusing: local and prod DATABASE_URL are identical."; exit 1
fi
case "$LOCAL_HOST" in
  localhost|127.0.0.1|::1|host.docker.internal) ;;
  *) echo "Refusing: local target host is '$LOCAL_HOST', not localhost."; exit 1 ;;
esac
case "$PROD_HOST" in
  localhost|127.0.0.1|::1) echo "Refusing: 'prod' host is '$PROD_HOST' — wrong env file?"; exit 1 ;;
esac

for bin in pg_dump pg_restore psql; do
  command -v "$bin" >/dev/null || { echo "Missing $bin (brew install libpq postgresql)"; exit 1; }
done

echo "Source (prod):  $PROD_HOST"
echo "Target (local): $LOCAL_HOST — its 'public' schema will be DROPPED and replaced."
if [[ "$ASSUME_YES" -ne 1 ]]; then
  read -r -p "Continue? [y/N] " ans
  [[ "$ans" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }
fi

DUMP="$(mktemp -t prod-db-XXXXXX).dump"
trap 'rm -f "$DUMP"' EXIT

echo "→ Dumping prod…"
# pg_dump must be >= the server's major version (prod is PG17); see PATH setup at the top.
pg_dump "$PROD_URL" \
  --format=custom --schema=public \
  --no-owner --no-privileges \
  --file="$DUMP"

echo "→ Resetting local public schema…"
psql "$LOCAL_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
SQL

echo "→ Restoring into local…"
# Not using --exit-on-error: a newer pg_restore may emit settings an older local server
# rejects (e.g. `SET transaction_timeout` from PG17 -> PG<17). Those are harmless;
# real problems show up as missing tables in the row counts below.
pg_restore --dbname="$LOCAL_URL" --no-owner --no-privileges "$DUMP" || \
  echo "  (pg_restore reported warnings — check the row counts below)"

if [[ "${KEEP_SENSITIVE:-0}" != "1" ]]; then
  echo "→ Wiping password-reset tokens and pending invites locally…"
  psql "$LOCAL_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
TRUNCATE TABLE "PasswordResetToken";
TRUNCATE TABLE "HouseholdInvite";
SQL
fi

echo "→ Row counts:"
psql "$LOCAL_URL" -At -c \
  "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY relname;" || true

echo "Done. Prod data is now in local. Run 'npx prisma migrate status' to check migrations."
