import { test } from "node:test";
import assert from "node:assert/strict";
import { findConflicts } from "./conflicts";
import { generatePlans, regenerate } from "./generate";
import type { Plan } from "./model";

const plan: Plan = {
  people: [
    { id: "me", name: "Me" },
    { id: "gf", name: "Girlfriend" },
    { id: "bro", name: "Brother" },
  ],
  locations: [
    { id: "home", name: "Home" },
    { id: "gfhome", name: "Her place" },
    { id: "gym", name: "Gym" },
  ],
  cars: [
    { id: "A", name: "Car A", locationId: "home" },
    { id: "B", name: "Car B", locationId: "home" },
  ],
  travel: [
    { from: "home", to: "gfhome", minutes: 30 },
    { from: "home", to: "gym", minutes: 20 },
  ],
  events: [
    { id: "bro-shift", title: "Brother shift", personIds: ["bro"], locationId: "gym", carId: "B", start: "2026-11-14T08:00:00Z", end: "2026-11-14T10:00:00Z", fixed: true },
    { id: "bro-lunch", title: "Brother lunch", personIds: ["bro"], locationId: "home", start: "2026-11-14T20:00:00Z", end: "2026-11-14T21:00:00Z" },
    { id: "dentist", title: "Dentist", personIds: ["me"], locationId: "home", start: "2026-11-15T09:00:00Z", end: "2026-11-15T10:00:00Z" },
  ],
  intentions: [
    { id: "visit", description: "Visit girlfriend", personIds: ["me", "gf"], minMinutes: 180, windowStart: "2026-11-14T10:00:00Z", windowEnd: "2026-11-14T20:00:00Z", locationId: "gfhome", carId: "B" },
  ],
};

const at = (events: { id: string; start: string; end: string }[], id: string) => {
  const e = events.find((x) => x.id === id)!;
  return [e.start, e.end];
};

test("regenerate keeps unrelated events and respects new availability", () => {
  const first = generatePlans(plan).options[0];
  const visit = first.blocks[0];

  const moved: Plan = {
    ...plan,
    events: plan.events.map((e) => (e.id === "bro-shift" ? { ...e, start: visit.start, end: visit.end } : e)),
  };
  const r1 = regenerate(moved, first);
  assert.ok(r1.options.length > 0);
  for (const o of r1.options) {
    assert.deepEqual(findConflicts({ events: o.events, travel: o.travel }), []);
    assert.deepEqual(at(o.events, "dentist"), at(first.events, "dentist"));
  }
  assert.deepEqual(regenerate(moved, first), r1);

  const picked = r1.options[0];
  const narrowed: Plan = {
    ...moved,
    intentions: [{ ...plan.intentions[0], windowStart: "2026-11-14T15:00:00Z", windowEnd: "2026-11-14T19:00:00Z" }],
  };
  const r2 = regenerate(narrowed, picked);
  assert.ok(r2.options.length > 0);
  for (const o of r2.options) {
    assert.deepEqual(findConflicts({ events: o.events, travel: o.travel }), []);
    const b = o.blocks[0];
    assert.ok(b.start >= "2026-11-14T15:00:00.000Z" && b.end <= "2026-11-14T19:00:00.000Z");
    for (const id of ["bro-shift", "bro-lunch"]) assert.deepEqual(at(o.events, id), at(picked.events, id));
  }
});
