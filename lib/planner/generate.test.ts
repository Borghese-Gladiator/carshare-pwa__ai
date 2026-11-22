import { test } from "node:test";
import assert from "node:assert/strict";
import { findConflicts } from "./conflicts";
import { generatePlans } from "./generate";
import type { Plan } from "./model";

const base: Plan = {
  people: [
    { id: "me", name: "Me" },
    { id: "gf", name: "Girlfriend" },
    { id: "bro", name: "Brother" },
  ],
  locations: [
    { id: "home", name: "Home" },
    { id: "gym", name: "Gym" },
  ],
  cars: [
    { id: "A", name: "Car A", locationId: "home" },
    { id: "B", name: "Car B", locationId: "home" },
  ],
  travel: [{ from: "home", to: "gym", minutes: 20 }],
  events: [
    { id: "work", title: "Work", personIds: ["me"], locationId: "home", start: "2026-11-14T09:00:00Z", end: "2026-11-14T17:00:00Z", fixed: true },
    { id: "gym", title: "Gym", personIds: ["me", "bro"], locationId: "gym", carId: "A", start: "2026-11-15T10:00:00Z", end: "2026-11-15T12:00:00Z" },
  ],
  intentions: [
    { id: "date", description: "See girlfriend", personIds: ["me", "gf"], minMinutes: 240, windowStart: "2026-11-14T08:00:00Z", windowEnd: "2026-11-15T14:00:00Z" },
  ],
};

test("generatePlans returns ranked conflict-free options", () => {
  const { options } = generatePlans(base);
  assert.ok(options.length >= 2 && options.length <= 3);
  for (const o of options) {
    assert.deepEqual(findConflicts({ events: o.events, travel: o.travel }), []);
    assert.ok(o.explanation.length > 0);
    for (const id of o.movedEventIds) assert.match(o.explanation, new RegExp(id));
    const work = o.events.find((e) => e.id === "work")!;
    assert.equal(work.start, "2026-11-14T09:00:00Z");
  }
  assert.deepEqual(options.map((o) => o.score), [...options.map((o) => o.score)].sort((a, b) => b - a));
});

test("forced move is explained", () => {
  const plan = { ...base, intentions: [{ ...base.intentions[0], windowStart: "2026-11-15T09:00:00Z", windowEnd: "2026-11-15T14:00:00Z" }] };
  const { options } = generatePlans(plan);
  assert.ok(options.length > 0);
  for (const o of options) {
    assert.deepEqual(o.movedEventIds, ["gym"]);
    assert.match(o.explanation, /Gym \(gym\)/);
  }
});

test("overlapping fixed trips on one car give a reason", () => {
  const plan: Plan = {
    ...base,
    cars: [base.cars[0]],
    intentions: [],
    events: [
      { id: "t1", title: "Airport run", personIds: ["me"], locationId: "home", carId: "A", start: "2026-11-14T10:00:00Z", end: "2026-11-14T12:00:00Z", fixed: true },
      { id: "t2", title: "Beach trip", personIds: ["bro"], locationId: "home", carId: "A", start: "2026-11-14T11:00:00Z", end: "2026-11-14T13:00:00Z", fixed: true },
    ],
  };
  const r = generatePlans(plan);
  assert.deepEqual(r.options, []);
  assert.match(r.reason!, /t1/);
  assert.match(r.reason!, /t2/);
});

const places: Plan = {
  people: [{ id: "me", name: "Me" }],
  locations: [
    { id: "home", name: "Home" },
    { id: "cafe", name: "Cafe" },
    { id: "lake", name: "Lake" },
  ],
  cars: [],
  travel: [
    { from: "home", to: "cafe", minutes: 10 },
    { from: "home", to: "lake", minutes: 90 },
  ],
  events: [{ id: "class", title: "Class", personIds: ["me"], locationId: "home", start: "2026-11-14T10:00:00Z", end: "2026-11-14T12:00:00Z", fixed: true }],
  intentions: [{ id: "walk", description: "Walk", personIds: ["me"], minMinutes: 60, windowStart: "2026-11-14T12:00:00Z", windowEnd: "2026-11-14T15:00:00Z", locationIds: ["lake", "cafe"] }],
};

test("candidate places: the option with less travel wins", () => {
  const { options } = generatePlans(places);
  assert.equal(options[0].blocks[0].locationId, "cafe");
  assert.match(options[0].explanation, /at Cafe/);
  for (const o of options) assert.deepEqual(findConflicts({ events: o.events, travel: o.travel }), []);
});

test("one candidate place gives the same blocks as a single locationId", () => {
  const one = { ...places.intentions[0], locationIds: ["cafe"] };
  const old = { ...places.intentions[0], locationIds: undefined, locationId: "cafe" };
  const a = generatePlans({ ...places, intentions: [one] });
  const b = generatePlans({ ...places, intentions: [old] });
  assert.deepEqual(a.options.map((o) => [o.score, o.blocks[0].start]), b.options.map((o) => [o.score, o.blocks[0].start]));
});

test("no candidate place fits: result has a reason", () => {
  const tight = { ...places.intentions[0], windowEnd: "2026-11-14T13:00:00Z", locationIds: ["lake"] };
  const r = generatePlans({ ...places, intentions: [tight] });
  assert.deepEqual(r.options, []);
  assert.match(r.reason!, /Walk/);
});
