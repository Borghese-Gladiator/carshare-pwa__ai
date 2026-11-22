import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLanes, daysOf, withBlocks } from "./week";
import type { Plan } from "./model";

const plan: Plan = {
  people: [{ id: "me", name: "Me" }],
  locations: [
    { id: "home", name: "Home" },
    { id: "gym", name: "Gym" },
  ],
  cars: [{ id: "A", name: "Car A", locationId: "home" }],
  travel: [{ from: "home", to: "gym", minutes: 60 }],
  events: [
    { id: "w", title: "Work", personIds: ["me"], locationId: "home", start: "2026-11-14T09:00:00Z", end: "2026-11-14T10:00:00Z", fixed: true },
    { id: "g", title: "Gym", personIds: ["me"], locationId: "gym", carId: "A", start: "2026-11-14T10:30:00Z", end: "2026-11-14T11:30:00Z" },
    { id: "n", title: "Next day", personIds: ["me"], locationId: "home", start: "2026-11-15T09:00:00Z", end: "2026-11-15T10:00:00Z" },
  ],
  intentions: [],
};

test("daysOf lists each day with an event", () => {
  assert.deepEqual(daysOf(plan), ["2026-11-14", "2026-11-15"]);
});

test("buildLanes gives person and car lanes, a travel gap and conflict flags", () => {
  const lanes = buildLanes(plan, "2026-11-14");
  assert.deepEqual(lanes.map((l) => l.id), ["me", "A"]);
  const me = lanes[0].items;
  assert.equal(me.filter((i) => i.kind === "event").length, 2);
  assert.equal(me.find((i) => i.id === "w")!.fixed, true);
  const travel = me.find((i) => i.kind === "travel")!;
  assert.equal(travel.conflict, true);
  assert.equal(lanes[1].items.length, 1);
});

test("buildLanes leaves out events on other days", () => {
  const lanes = buildLanes(plan, "2026-11-15");
  assert.deepEqual(lanes[0].items.map((i) => i.id), ["n"]);
  assert.deepEqual(lanes[1].items, []);
});

test("withBlocks adds accepted intention blocks as events", () => {
  const withIntent: Plan = {
    ...plan,
    intentions: [{ id: "i", description: "Walk", personIds: ["me"], minMinutes: 60, windowStart: "2026-11-14T12:00:00Z", windowEnd: "2026-11-14T15:00:00Z" }],
  };
  const shown = withBlocks(withIntent, [{ intentionId: "i", start: "2026-11-14T13:00:00Z", end: "2026-11-14T14:00:00Z", locationId: "home" }]);
  assert.equal(shown.events.length, withIntent.events.length + 1);
  assert.deepEqual(buildLanes(shown, "2026-11-14")[0].items.map((i) => i.id).includes("intention:i"), true);
  assert.equal(withBlocks(withIntent).events.length, withIntent.events.length);
});
