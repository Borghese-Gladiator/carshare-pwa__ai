# CarShare PWA

Next.js (App Router) PWA for two people who share one car. Neon Postgres, Tailwind, Vercel.

## Layout

```
app/(protected)/   pages behind auth: dashboard, calendar, settings
app/api/           route handlers (one folder per resource)
components/<screen>/  client UI for each page, plus types.ts
lib/db/            client.ts, schema.ts (types), queries.ts (all SQL), migrations/
lib/auth.ts        signed session cookie + access code check
lib/users.ts       the two fixed users and the car (hard-coded IDs)
middleware.ts      auth gate; add public paths to PUBLIC
scripts/           dev-db.sh, migrate.ts, seed.ts
docs/              DESIGN.md (design tokens), PRD.md, TODO.md
```

## Commands

- `./scripts/dev-db.sh local` — start Docker Postgres, migrate, seed. Then `npm run dev`.
- `npm run check` — typecheck and unit tests. Run before every commit.
- `npm test` — unit tests (`node:test`, files are `lib/**/*.test.ts`). DB tests skip.
- `npm run test:db` — all tests, including DB tests against the local Docker DB. Run it after
  a change to `lib/db/`. The DB tests use reservations in the year 2099 and delete them after.
- `npm run db:migrate` — apply new migrations.

## Conventions

- Imports use the `@/` alias for the repo root.
- Put all SQL in `lib/db/queries.ts`. Route handlers call those functions.
- Schema changes: add a new file `lib/db/migrations/NNNN_name.sql`. Never edit an applied migration.
  Update the types in `lib/db/schema.ts` to match.
- Tests: put `foo.test.ts` next to `foo.ts`. Use `node:test` and `node:assert/strict`.
- Use the colors and spacing in `docs/DESIGN.md`. Do not invent new tokens.
- Track open work in `docs/TODO.md`.

## Known traps

- The service worker (`public/sw.js`) registers only in production. If the browser shows old code
  in dev, unregister the service worker and clear caches, then reload twice.
- `.env.local` needs `DATABASE_URL`, `ACCESS_CODE`, `SESSION_SECRET`. `dev-db.sh` fills them.
  `NEON_LOCAL=1` routes the Neon driver to the local Docker proxy.
- There are no browser tests. To verify UI changes, run the app and check the page by hand.
