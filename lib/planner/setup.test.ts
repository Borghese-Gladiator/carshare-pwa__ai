import { test } from "node:test";
import assert from "node:assert/strict";
import { addCar, addLocation, addPerson, missingTravel, removeCar, removeLocation, removePerson, setTravel } from "./setup";
import { travelMinutes } from "./model";
import { samplePlan } from "./sample";

test("addPerson adds a person with a unique id and rejects blanks and duplicates", () => {
  const a = addPerson(samplePlan, "Sam");
  assert.equal(a.error, undefined);
  assert.equal(a.plan.people.at(-1)!.id, "sam");
  assert.equal(addPerson(a.plan, "sam").error, "sam is already in the list.");
  assert.match(addPerson(samplePlan, "  ").error!, /name/);
  const clash = addPerson({ ...samplePlan, people: [...samplePlan.people, { id: "sam", name: "Sam Old" }] }, "Sam");
  assert.equal(clash.plan.people.at(-1)!.id, "sam-2");
});

test("removePerson cleans shared events and blocks removing the only person", () => {
  const ok = removePerson(samplePlan, "bro");
  assert.equal(ok.error, undefined);
  assert.deepEqual(ok.plan.events.find((e) => e.id === "gym")!.personIds, ["me"]);
  const blocked = removePerson(samplePlan, "gf");
  assert.match(blocked.error!, /only one/);
  assert.equal(blocked.plan, samplePlan);
});

test("removeLocation blocks a place in use and clears travel for a free place", () => {
  assert.match(removeLocation(samplePlan, "home").error!, /happens here/);
  assert.match(removeLocation(samplePlan, "south").error!, /happens here/);
  const free = removeLocation(samplePlan, "lake");
  assert.equal(free.error, undefined);
  assert.equal(free.plan.travel.some((t) => t.from === "lake" || t.to === "lake"), false);
  assert.deepEqual(free.plan.intentions[0].locationIds, ["cafe"]);
});

test("addLocation and addCar validate input", () => {
  const loc = addLocation(samplePlan, "Library");
  assert.equal(loc.plan.locations.at(-1)!.id, "library");
  assert.match(addLocation(samplePlan, "home").error!, /already/);
  const car = addCar(loc.plan, "Car C", "library");
  assert.equal(car.plan.cars.at(-1)!.locationId, "library");
  assert.match(addCar(samplePlan, "Car C", "nowhere").error!, /place/);
  assert.match(addCar(samplePlan, "car a", "home").error!, /already/);
});

test("removeCar blocks a car in use", () => {
  assert.match(removeCar(samplePlan, "A").error!, /uses this car/);
  assert.equal(removeCar(samplePlan, "B").plan.cars.length, 1);
});

test("setTravel sets, replaces, clears and validates a travel time in both directions", () => {
  const set = setTravel(samplePlan, "cafe", "lake", 25);
  assert.equal(travelMinutes(set.plan.travel, "lake", "cafe"), 25);
  const replaced = setTravel(set.plan, "lake", "cafe", 40);
  assert.equal(replaced.plan.travel.filter((t) => [t.from, t.to].sort().join() === "cafe,lake").length, 1);
  assert.equal(travelMinutes(replaced.plan.travel, "cafe", "lake"), 40);
  assert.equal(travelMinutes(setTravel(replaced.plan, "cafe", "lake", undefined).plan.travel, "cafe", "lake"), undefined);
  assert.match(setTravel(samplePlan, "home", "home", 5).error!, /different/);
  assert.match(setTravel(samplePlan, "home", "cafe", -5).error!, /whole minutes/);
  assert.match(setTravel(samplePlan, "home", "cafe", 2.5).error!, /whole minutes/);
});

test("missingTravel lists place pairs with no time", () => {
  assert.deepEqual(missingTravel(samplePlan), [["cafe", "lake"]]);
  assert.deepEqual(missingTravel(setTravel(samplePlan, "cafe", "lake", 20).plan), []);
});
