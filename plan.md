# Plan: simplify to 2 hardcoded users, remove requests/inbox, calendar week nav, always-on Return+note

## Brief
Strip the borrow/swap request system entirely, remove Inbox + Notes from the bottom nav,
make the calendar a navigable Mon–Sun week, always surface "Return Car" with an optional
note (stored on the handoff log), hardcode the two users (Jon, Timmy) in code while keeping
them provisioned in the DB, and replace the dashboard Bell with a switch-user control.

## Changes

### A. Hardcoded users (always provisioned)
- New `lib/users.ts`: `Jon` and `Timmy` with fixed UUID constants + `GROUP_ID`, `CAR_ID`.
  Export `USERS: User[]`.
- `scripts/seed.ts`: insert Jon & Timmy (those UUIDs) + group + car, idempotent
  (`ON CONFLICT DO NOTHING`). Remove Alice/Bob.
- App member lists read `USERS` from the constant instead of fetching group members:
  - `DashboardClient` switch-user picker, `PickupModal`, `ReservationModal`.
  - `/api/dashboard/status` can stop returning `groupMembers` (clients use constant) —
    but keep the field populated from the constant to avoid churn, OR drop it. Decision:
    drop `groupMembers` from payload + type; clients import `USERS`.

### B. Delete borrow/swap/request backend
- Delete dirs/files:
  - `app/api/requests/` (route.ts, [id]/route.ts, count/route.ts)
  - `app/(protected)/inbox/` (page.tsx)
  - `components/inbox/InboxClient.tsx`
  - `components/dashboard/RequestCarModal.tsx`
- `lib/db/queries.ts`: remove `createCarRequest`, `getRequestsForUser`,
  `getPendingIncomingCount`, `getPendingRequestIdsByReservation`, `acceptRequest`,
  `declineRequest`, `getPendingRequestsByCar`, `RequestWithDetails`.
- `lib/db/schema.ts`: remove `CarRequest`, `RequestType`, `RequestStatus`.
- DB: new migration `0011_drop_car_requests.sql` → `DROP TABLE IF EXISTS car_requests`.
  (Leave 0007/0010 in history; new migration removes the table.)
- `/api/reservations` route: remove `has_pending_request` / pending-request-id usage.
  Calendar `StatusPill` drops the "Pending" badge + `has_pending_request` from types.
- `/api/dashboard/status`: drop `getPendingIncomingCount` + `pendingIncomingCount`.

### C. Bottom nav
- `BottomNav.tsx`: remove Inbox and Notes tabs + the pending-count fetch + Inbox dot.
  Remaining tabs: Dashboard, Calendar, Settings. (Notes page/route/backend stay; just
  not in nav.)

### D. Dashboard: switch-user button + always-on Return
- `DashboardClient` header: replace Bell with a `UserSwitcher` button showing current
  user's initial; tap → small picker (Jon/Timmy) → set `carshare_user_id` + refetch.
  Remove `pendingIncomingCount` badge.
- `StatusHero`: remove `onRequestCar` + Request/Message buttons branch. Always render a
  "Return Car" button (in every status). Remove RequestCarModal wiring from DashboardClient.
- `ReturnModal`: add optional `note` field → `ReturnData.note`.
- `handleReturn` sends `note`; identity from `carshare_user_id` (the switcher guarantees it).

### E. Return note storage
- Migration `0012_add_handoff_note.sql`: `ALTER TABLE handoff_logs ADD COLUMN note text`.
- `schema.ts` HandoffLog: add `note: string | null`.
- `insertHandoffLog`: accept + write `note`.
- `/api/dashboard/return`: accept `note`, pass through.
- Recent activity (`status` route + dashboard) shows the note inline on return rows.

### F. Calendar: navigable Mon–Sun week
- `CalendarClient`: add `weekStart` state (Monday of current week). 7-day `getWeekDays`
  (length 7), `DAY_LABELS` Mon–Sun. Prev/next week arrows shift `weekStart` ±7 days.
- Fetch range = weekStart .. weekStart+7d (Sun 23:59). `fetchData` depends on weekStart.
- Selected day resets sensibly when paging weeks.

## Tests

### Unit / type
- `npx tsc --noEmit` clean for all touched app files (qa-harness preexisting errors ignored).
- Grep: no remaining imports of deleted modules (RequestCarModal, InboxClient, requests
  queries, getPendingIncomingCount, has_pending_request).

### Manual (browser actions)
1. Login → dashboard. Top-right shows user initial; tap → pick Jon → header shows "J".
2. Switch to Timmy → reservations/returns attribute to Timmy.
3. Dashboard always shows "Return Car" regardless of status; open it, add parking +
   optional note, confirm → Recent Activity shows return with the note text.
4. Bottom nav shows only Dashboard / Calendar / Settings (no Inbox, no Notes). No badge.
5. Calendar shows Mon–Sun; prev/next arrows page weeks and load that week's reservations.
6. No "Request Car"/"Message" buttons anywhere; no "Pending" pill on calendar items.
7. /notes still loads directly (feature intact).
```
```
