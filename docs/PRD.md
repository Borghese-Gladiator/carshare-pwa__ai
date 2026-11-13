# Shared Car Scheduler - Product Spec

## 1. Product Overview
A single-user scheduling optimizer for shared cars. One person (the planner) manages the plans of everyone in the group. The app proposes schedules. The planner discusses the proposals with the other people outside the app.

This is not a collaborative scheduling platform. Other people do not log in.

## 2. Product Decisions

| Decision          | Requirement                                          |
| ----------------- | ---------------------------------------------------- |
| Primary user      | The planner manages the plans of all people          |
| Calendar          | Built-in weekly calendar                             |
| Plan flexibility  | Movable time windows, with configurable constraints  |
| Scheduling        | Constraint-based optimization                        |
| Replanning        | Manual, with a Regenerate button                     |
| Recommendations   | 2–3 feasible options, ranked by preferences          |
| Automatic actions | None                                                 |
| Negotiation       | The planner discusses proposals outside the app      |
| LLM               | Not necessary for the PoC or the MVP                 |
| Google Calendar   | No integration                                       |

## 3. Architectural Principle
Keep planning intentions separate from scheduled events.

An intention is a goal, for example "See girlfriend for at least 4 hours this weekend." The intention stays the same when the scheduled time changes. This separation makes the app different from a conventional calendar.

## 4. PoC (Proof of Concept): Prove the Algorithm
A small, scenario-based scheduling engine with:
- Three people and one shared car.
- Fixed events and flexible events.
- Travel-time constraints.
- Regeneration that the user starts.
- Ranked alternatives, each with an explanation.
- Repeated replanning when constraints change.

**Success:** Change the plans of the brother and regenerate the visit. Then change the availability of the girlfriend and regenerate again. The result has no conflicts, and the engine does not move unrelated events without a reason.

## 5. MVP (Minimum Viable Product): Make It Personally Usable
Add to the PoC:
- A persistent weekly calendar.
- Simple editors for events and availability.
- Both shared cars and their locations.
- Visit scheduling with transportation options.
- Side-by-side comparison of plans.
- Accept or reject a proposal.
- Local or database persistence.

**Success:** The planner manages the logistics of a real weekend in the app only. The planner does not open Google Calendar or move multiple events by hand.

## 6. Out of Scope
These items are removed from the previous MVP. Add them later only if necessary.
- Multi-user authentication.
- Approval workflows.
- Push notifications.
- Real-time synchronization.
- Automatic replanning when a conflict occurs.

## 7. Design Direction
- **Vibe:** Modern, friendly, calm.
- **UI patterns:** Rounded cards, clear status badges, bottom tab bar (mobile), soft shadows.
- **Tone:** Casual and clear.

## 8. Resolved Questions
- Existing events are movable by default. The planner marks an event fixed to lock it.
- The PWA (manifest, offline shell) stays in scope.
