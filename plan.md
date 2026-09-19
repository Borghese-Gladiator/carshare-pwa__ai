# Plan

## Brief
The Upcoming list shows only the weekday name for a reservation time (e.g.
"Sat 2:00 PM"). Today is also a Saturday, so a reservation exactly one week
out reads as if it were today. Add a relative-day formatter and use it in
the Upcoming list.

## Changes
- `lib/relativeDay.ts`: new pure function `formatRelativeDay(date, today)`
  that returns `Today`, `Tomorrow`, `In N days` (2-6 days), `In N weeks`
  (7-27 days), `In N months` (up to a 6-month threshold), or an absolute
  `Mon D` date beyond that threshold.
- `components/dashboard/DashboardClient.tsx`: `UpcomingListCard`'s
  `fmtDateTime` uses `formatRelativeDay` for the day part instead of
  `weekday: 'short'`.
- `package.json`: add a `test` script running Node's built-in test runner
  through `tsx` (already a devDependency, no new package needed).

## Tests

### Unit
`lib/relativeDay.test.ts` using `node:test` + `node:assert/strict`, one
`today` fixture, parametrized over the table's boundaries: 0, 1, 2, 6, 7,
13, 14, 20, 21, 27, 28, ~90, ~180, and one date past the 6-month threshold.

### Manual (browser)
1. Open `/dashboard` with the Sep 26 reservation (7 days from Sep 19).
2. Confirm Upcoming shows "In 1 week", not "Sat 2:00 PM".
3. Confirm a same-day reservation still shows "Today".
