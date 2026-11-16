# TODO

Work to move the app to the scope in `docs/PRD.md`.

## PoC
- Model the intentions (goals) separately from the scheduled events.
- Model three people, one shared car, fixed events and flexible events.
- Add travel-time constraints.
- Add the Regenerate action.
- Add tests for repeated replanning. The engine must not add conflicts or move unrelated events.

## MVP
- Persistent weekly calendar.
- Editors for events and availability.
- Both shared cars and their locations.
- Visit scheduling with transportation options.
- Side-by-side comparison of plans.
- Accept or reject a proposal.

## Remove (out of scope)
- Multi-user auth and the two fixed users (`lib/auth.ts`, `lib/users.ts`, `middleware.ts`).
- The old reservation flow, if the new calendar replaces it.
