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
scripts/      dev.ts (up/down), migrate, seed
public/       PWA manifest, service worker, icons
docs/         DESIGN.md (design system), PRD.md, TODO.md
```

## Data model

```
users · cars · reservations · car_notes · handoff_logs
```

## Development

Works on Windows, macOS, and Linux. Requires Node 22+ and Docker.

```bash
npm install
npm run up     # start local DB, migrate, seed, then the dev server
npm run down   # stop the local DB and delete its volume
```

`npm run up` fills in `ACCESS_CODE` / `SESSION_SECRET` in `.env.local` if they are blank,
and points `DATABASE_URL` at the local DB. It runs local Postgres plus
`local-neon-http-proxy` (see `docker-compose.db.yml`), and sets `NEON_LOCAL=1` so the
`@neondatabase/serverless` driver goes through the proxy (`lib/db/neon-local.ts`).

To use Neon cloud instead, put your Neon string in `.env.local`, then run `npm run up:neon`:

```
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require
```

Migrations are tracked in a `_migrations` table; re-running skips already-applied files.
The seed (one group, two users, one car) is idempotent.

## Tests

```bash
npm run check     # typecheck + unit tests
npm run test:db   # also runs DB tests; needs npm run up first
```

See [`docs/TODO.md`](./docs/TODO.md) for open work.
