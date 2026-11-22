import { test } from "node:test";
import assert from "node:assert/strict";
import { addIntention, checkAll, checkFit, removeIntention, validateIntention } from "./fit";
import { samplePlan } from "./sample";
import type { Intention } from "./model";

const goal = samplePlan.intentions[0];

test("checkFit says a goal with free time fits", () => {
  const fit = checkFit(samplePlan, goal);
  assert.equal(fit.fits, true);
  assert.ok(fit.options >= 1);
  assert.match(fit.reason, /^Fits/);
});

test("checkFit gives a reason when no time fits", () => {
  const tight: Intention = { ...goal, id: "tight", windowStart: "2026-11-27T13:00:00Z", windowEnd: "2026-11-27T21:00:00Z", personIds: ["me"] };
  const fit = checkFit(samplePlan, tight);
  assert.equal(fit.fits, false);
  assert.match(fit.reason, /No conflict-free schedule/);
});

test("checkAll returns one result for each goal", () => {
  assert.deepEqual(checkAll(samplePlan).map((f) => f.intentionId), ["date"]);
});

test("addIntention and removeIntention change only the goals", () => {
  const extra: Intention = { ...goal, id: "x" };
  const added = addIntention(samplePlan, extra);
  assert.equal(added.intentions.length, 2);
  assert.equal(added.events, samplePlan.events);
  assert.equal(removeIntention(added, "x").intentions.length, 1);
});

test("validateIntention rejects bad input", () => {
  const ok: Intention = { ...goal, id: "new" };
  assert.equal(validateIntention(samplePlan, ok), undefined);
  assert.match(validateIntention(samplePlan, { ...ok, description: " " })!, /name/);
  assert.match(validateIntention(samplePlan, { ...ok, personIds: [] })!, /person/);
  assert.match(validateIntention(samplePlan, { ...ok, minMinutes: 0 })!, /length/);
  assert.match(validateIntention(samplePlan, { ...ok, windowEnd: ok.windowStart })!, /after/);
  assert.match(validateIntention(samplePlan, { ...ok, windowEnd: "2026-11-28T13:00:00Z", windowStart: "2026-11-28T12:00:00Z" })!, /shorter/);
  assert.match(validateIntention(samplePlan, { ...ok, id: "date" })!, /already/);
});
