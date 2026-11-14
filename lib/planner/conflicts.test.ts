import { test } from "node:test";
import assert from "node:assert/strict";
import { findConflicts } from "./conflicts";
import { isMovable, type PlanEvent } from "./model";

const ev = (id: string, start: string, end: string, extra: Partial<PlanEvent> = {}): PlanEvent => ({
  id,
  title: id,
  personIds: ["p1"],
  locationId: "home",
  start: `2026-11-14T${start}`,
  end: `2026-11-14T${end}`,
  ...extra,
});

const travel = [{ from: "home", to: "downtown", minutes: 30 }];

test("isMovable", () => {
  assert.equal(isMovable(ev("a", "10:00", "11:00")), true);
  assert.equal(isMovable(ev("a", "10:00", "11:00", { fixed: false })), true);
  assert.equal(isMovable(ev("a", "10:00", "11:00", { fixed: true })), false);
});

test("car conflicts", () => {
  const a = ev("a", "10:00", "12:00", { carId: "A", personIds: ["p1"] });
  const b = ev("b", "11:00", "13:00", { carId: "A", personIds: ["p2"] });
  assert.deepEqual(findConflicts({ events: [a, b] }), [{ type: "car", carId: "A", eventIds: ["a", "b"] }]);
  assert.deepEqual(findConflicts({ events: [a, { ...b, carId: "B" }] }), []);
});

test("person conflicts", () => {
  assert.deepEqual(findConflicts({ events: [ev("a", "10:00", "12:00"), ev("b", "11:00", "13:00")] }), [
    { type: "person", personId: "p1", eventIds: ["a", "b"] },
  ]);
  assert.deepEqual(findConflicts({ events: [ev("a", "10:00", "11:00"), ev("b", "11:00", "12:00")], travel }), []);
});

test("travel conflicts", () => {
  const a = ev("a", "09:00", "10:00");
  const late = ev("b", "10:15", "11:00", { locationId: "downtown" });
  assert.equal(findConflicts({ events: [a, late], travel })[0]?.type, "travel");
  assert.deepEqual(findConflicts({ events: [a, { ...late, start: "2026-11-14T10:30" }], travel }), []);
});
