#!/usr/bin/env bash
# Deploy expense-tracker web app to Vercel (Phase 4 §4).
# Prerequisites:
#   1. npx vercel login
#   2. web/.env.vercel with DATABASE_URL, AUTH_SECRET, AUTH_URL
#   3. Hosted DB claimed / migrations applied (see .env.hosted)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.vercel}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — create it from .env.hosted + a new AUTH_SECRET."
  exit 1
fi

# shellcheck disable=SC1090
set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

if [[ -z "${DATABASE_URL:-}" || -z "${AUTH_SECRET:-}" ]]; then
  echo "DATABASE_URL and AUTH_SECRET must be set in $ENV_FILE"
  exit 1
fi

if ! npx vercel whoami >/dev/null 2>&1; then
  echo "Not logged in to Vercel."
  echo "Run:  npx vercel login"
  echo "Then re-run:  bash scripts/deploy-vercel.sh"
  exit 1
fi

echo "→ Linking / creating Vercel project (non-interactive where possible)…"
# First link if needed
if [[ ! -d .vercel ]]; then
  npx vercel link --yes
fi

add_env() {
  local name="$1"
  local value="$2"
  local env_target="${3:-production}"
  # Remove existing to allow update (ignore errors)
  npx vercel env rm "$name" "$env_target" --yes >/dev/null 2>&1 || true
  printf '%s' "$value" | npx vercel env add "$name" "$env_target" --yes
}

echo "→ Setting production env vars…"
add_env DATABASE_URL "$DATABASE_URL" production
add_env AUTH_SECRET "$AUTH_SECRET" production

# Preview can use same DB for personal MVP (optional)
add_env DATABASE_URL "$DATABASE_URL" preview
add_env AUTH_SECRET "$AUTH_SECRET" preview

echo "→ Deploying to production…"
DEPLOY_OUT="$(npx vercel deploy --prod --yes 2>&1 | tee /dev/stderr)"
PROD_URL="$(echo "$DEPLOY_OUT" | grep -Eo 'https://[^ ]+\.vercel\.app' | tail -1 || true)"

if [[ -n "$PROD_URL" ]]; then
  echo "→ Production URL: $PROD_URL"
  # Update AUTH_URL for cookies / redirects
  add_env AUTH_URL "$PROD_URL" production
  add_env AUTH_URL "$PROD_URL" preview

  # Persist into local file for next deploys
  if grep -q '^AUTH_URL=' "$ENV_FILE"; then
    # portable-ish in-place update
    tmp="$(mktemp)"
    sed "s|^AUTH_URL=.*|AUTH_URL=\"$PROD_URL\"|" "$ENV_FILE" >"$tmp" && mv "$tmp" "$ENV_FILE"
  else
    echo "AUTH_URL=\"$PROD_URL\"" >>"$ENV_FILE"
  fi

  echo "→ Redeploying so AUTH_URL is applied…"
  npx vercel deploy --prod --yes

  echo ""
  echo "Done. Open: $PROD_URL"
  echo "Smoke-test: register → expense → dashboard → logout/login"
else
  echo "Deploy finished but could not parse production URL."
  echo "Set AUTH_URL manually in Vercel dashboard, then redeploy."
fi
