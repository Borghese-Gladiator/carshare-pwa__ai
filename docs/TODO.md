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
- Keep the old tables. Remove only the old code, so no data is lost on Neon.

## Engine (lib/planner)
- Eastern time for day hours and for the explanations.
- Travel modes: car, commuter rail, drop-off.
- Weekly recurring events.
- Fixed ranking weights.

## MVP
- Store people, places, cars, travel times, events and intentions in Postgres.
- Remove the two fixed users and the old reservation flow. Keep the access-code gate.
- Weekly calendar.
- Editors for events, intentions, people, places, cars and travel times.
- Regenerate, side-by-side comparison of plans, accept or reject.
- PWA checks: manifest, service worker, offline shell.
