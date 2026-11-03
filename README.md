# CarShare PWA

A mobile-first responsive web app + PWA for two people sharing one car informally. Coordinate
availability, reservations, current status, handoffs, parking location, and shared notes —
without the back-and-forth texting.

## Stack

- **Next.js** (App Router)
- **Vercel** hosting
- **Neon** Postgres (plain SQL migrations, Neon serverless driver / `postgres` npm package)
- **Tailwind CSS + shadcn/ui**
- Shared access-code auth → `HttpOnly`, `Secure`, `SameSite=Lax` signed session cookie (~30d)
- PWA: web manifest + service worker, offline app shell, graceful offline fallback

## Layout

```
app/          Next.js routes and API handlers
components/   UI, grouped by screen
lib/          auth, utils, and db/ (client, queries, migrations/)
scripts/      dev-db setup, migrate, seed
public/       PWA manifest, service worker, icons
docs/         DESIGN.md (design system), PRD.md, TODO.md
```

## Data model

```
users · cars · reservations · car_notes · handoff_logs
```

## Database Setup

One script — `scripts/dev-db.sh` — sets up either backend and runs migrate + seed.
It also fills in `ACCESS_CODE` / `SESSION_SECRET` in `.env.local` if they are blank.

```bash
npm install
```

### Offline (Dockerized Postgres + Neon proxy)

No cloud account needed. Requires Docker running.

```bash
./scripts/dev-db.sh local        # start DB, migrate, seed
npm run dev
./scripts/dev-db.sh local --down # stop DB and drop its volume
```

This runs local Postgres plus `local-neon-http-proxy` (see `docker-compose.db.yml`)
so the `@neondatabase/serverless` driver works against localhost. The script sets
`NEON_LOCAL=1` and a local `DATABASE_URL` in `.env.local`; that flag routes the
driver to the proxy (`lib/db/neon-local.ts`).

### Neon cloud

```bash
# Put your Neon string in .env.local first:
#   DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require
./scripts/dev-db.sh neon
npm run dev
```

Migrations are tracked in a `_migrations` table; re-running skips already-applied files.
The seed (one group, two users, one car) is idempotent.

## Tests

```bash
npm test
```

See [`docs/TODO.md`](./docs/TODO.md) for open work.
