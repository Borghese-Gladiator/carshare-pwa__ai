# TODO

Work to move the app to the scope in `docs/PRD.md`.

## Decisions
- Existing events are movable by default. The planner marks an event fixed to lock it.
- The PWA (manifest, offline shell) stays in scope.
- The planner types travel times by hand, for each pair of places and each mode.
- Events can repeat each week, for example a work shift Mon–Fri.
- All times are Eastern time (`America/New_York`).
- Transport modes: car A, car B, commuter rail, or a drop-off by another person.
- Ranking uses fixed weights in code: fewer moved events, then smaller shifts, then less
  travel time, then fewer hours outside 8:00–22:00, then car before drop-off.
- Drop the old tables and remove the old code. There are no users yet, so no data must be kept.

## Engine (lib/planner)
- Eastern time for day hours and for the explanations.
- Travel modes: car, commuter rail, drop-off.
- Weekly recurring events.
- Fixed ranking weights.
- Candidate places on an intention (`locationIds`). Done: the engine picks the place with the least travel.
- No priority field. An event is fixed or movable.
- Slack report for a "Tight" badge. Not started.

## Views (desktop first, PWA, responsive)
- Compare (home, `/compare`): 2-3 option columns, Regenerate, Accept, Reject.
- Week (`/week`): lanes for each person and car, lock icon, travel gaps, red conflicts.
- Intentions (`/intentions`): one card for each goal, Fits or Cannot fit, one-line reason.
- What if: a sheet on Compare. Nothing saves until Accept.
- Editors: sheets for event, intention and quick add.
- Setup (`/setup`): people, places, cars, travel-time grid.
- Nav: left sidebar at `md` and above, bottom nav below `md`.

## MVP
- Store people, places, cars, travel times, events and intentions in Postgres.
- Remove the two fixed users and the old reservation flow. Keep the access-code gate.
- Weekly calendar.
- Editors for events, intentions, people, places, cars and travel times.
- Regenerate, side-by-side comparison of plans, accept or reject.
- PWA checks: manifest, service worker, offline shell.
