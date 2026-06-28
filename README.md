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

## Design

The design system and reference screens live in [`design/`](./design):

- `design/serene_mobility/DESIGN.md` — "Calm & Capable" design system (colors, type, spacing, components)
- `design/<screen>/screen.png` + `code.html` — reference mockups for Dashboard (available / in-use),
  Calendar/Reservations agenda, and Notes & Issues
- `design/shared_car_app_prd.txt` — condensed PRD

## Data model

```
users · cars · reservations · car_notes · handoff_logs
car_requests   (conflict / borrow-now requests)
```

## Database Setup

Prerequisites: a [Neon](https://neon.tech) Postgres database.

1. Copy `.env.local.example` → `.env.local` and fill in your Neon connection string.
2. Install dependencies: `npm install`
3. Run migrations (creates all tables):
   ```bash
   npm run db:migrate
   ```
4. Seed v1 data — one group, two users (Alice + Bob), one car — idempotent/re-runnable:
   ```bash
   npm run db:seed
   ```

Migrations are tracked in a `_migrations` table; re-running `db:migrate` skips already-applied files.

## Status

Built incrementally via Agent Workbench. See the project task queue.
