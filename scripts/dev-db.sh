#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE=".env.local"
MODE="${1:-}"

LOCAL_DB_URL="postgres://carshare:carshare@localhost:5432/carshare"

usage() {
  cat <<'EOF'
Usage: ./scripts/dev-db.sh <local|neon> [--down]

  local        Start Dockerized Postgres + neon proxy, migrate, and seed.
  local --down Stop and remove the local Docker database.
  neon         Validate the Neon DATABASE_URL in .env.local, migrate, and seed.

The same migrate/seed scripts run in both modes; only NEON_LOCAL and
DATABASE_URL differ. After this completes, run: npm run dev
EOF
}

rand_secret() {
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
}

ensure_key() {
  local key="$1" value="$2"
  if grep -qE "^${key}=" "$ENV_FILE" 2>/dev/null; then
    local current
    current="$(grep -E "^${key}=" "$ENV_FILE" | head -1 | cut -d= -f2-)"
    if [ -z "$current" ] || [ "$current" = "change-me-to-your-shared-access-code" ] \
       || [ "$current" = "change-me-to-a-random-32-char-or-longer-string" ]; then
      set_key "$key" "$value"
    fi
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

set_key() {
  local key="$1" value="$2" tmp
  tmp="$(mktemp)"
  grep -vE "^${key}=" "$ENV_FILE" > "$tmp" 2>/dev/null || true
  printf '%s=%s\n' "$key" "$value" >> "$tmp"
  mv "$tmp" "$ENV_FILE"
}

read_key() {
  grep -E "^$1=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- || true
}

bootstrap_secrets() {
  touch "$ENV_FILE"
  ensure_key ACCESS_CODE "carshare-local"
  ensure_key SESSION_SECRET "$(rand_secret)"
}

run_migrations() {
  echo "==> Running migrations + seed..."
  npm run db:migrate
  npm run db:seed
}

case "$MODE" in
  local)
    if [ "${2:-}" = "--down" ]; then
      docker compose -f docker-compose.db.yml down -v
      echo "==> Local database stopped and volume removed."
      exit 0
    fi

    bootstrap_secrets
    set_key DATABASE_URL "$LOCAL_DB_URL"
    set_key NEON_LOCAL "1"

    echo "==> Starting Postgres + neon proxy (Docker)..."
    docker compose -f docker-compose.db.yml up -d --wait

    run_migrations
    echo
    echo "==> Local DB ready. NEON_LOCAL=1 set in $ENV_FILE."
    echo "    Start the app:  npm run dev"
    echo "    Access code:    $(read_key ACCESS_CODE)"
    echo "    Stop the DB:    ./scripts/dev-db.sh local --down"
    ;;

  neon)
    bootstrap_secrets
    set_key NEON_LOCAL "0"
    url="$(read_key DATABASE_URL)"
    if [ -z "$url" ] || ! printf '%s' "$url" | grep -q "neon.tech"; then
      echo "ERROR: Set a real Neon connection string in $ENV_FILE first." >&2
      echo "  DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require" >&2
      exit 1
    fi

    run_migrations
    echo
    echo "==> Neon DB ready. Start the app:  npm run dev"
    echo "    Access code:    $(read_key ACCESS_CODE)"
    ;;

  *)
    usage
    exit 1
    ;;
esac
