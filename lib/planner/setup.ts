import type { Plan } from "./model";

export type Edit = { plan: Plan; error?: string };

const slug = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function uniqueId(base: string, taken: string[]): string {
  const root = slug(base) || "item";
  let id = root;
  for (let n = 2; taken.includes(id); n++) id = `${root}-${n}`;
  return id;
}

export function addPerson(plan: Plan, name: string): Edit {
  if (!name.trim()) return { plan, error: "Enter a name." };
  if (plan.people.some((p) => same(p.name, name))) return { plan, error: `${name.trim()} is already in the list.` };
  const id = uniqueId(name, plan.people.map((p) => p.id));
  return { plan: { ...plan, people: [...plan.people, { id, name: name.trim() }] } };
}

export function removePerson(plan: Plan, id: string): Edit {
  const busy = plan.events.find((e) => e.personIds.length === 1 && e.personIds[0] === id);
  if (busy) return { plan, error: `Move or delete "${busy.title}" first. This person is the only one on it.` };
  const goal = plan.intentions.find((i) => i.personIds.length === 1 && i.personIds[0] === id);
  if (goal) return { plan, error: `Delete the goal "${goal.description}" first. This person is the only one on it.` };
  return {
    plan: {
      ...plan,
      people: plan.people.filter((p) => p.id !== id),
      events: plan.events.map((e) => ({ ...e, personIds: e.personIds.filter((p) => p !== id) })),
      intentions: plan.intentions.map((i) => ({ ...i, personIds: i.personIds.filter((p) => p !== id) })),
    },
  };
}

export function addLocation(plan: Plan, name: string): Edit {
  if (!name.trim()) return { plan, error: "Enter a name." };
  if (plan.locations.some((l) => same(l.name, name))) return { plan, error: `${name.trim()} is already in the list.` };
  const id = uniqueId(name, plan.locations.map((l) => l.id));
  return { plan: { ...plan, locations: [...plan.locations, { id, name: name.trim() }] } };
}

export function removeLocation(plan: Plan, id: string): Edit {
  const event = plan.events.find((e) => e.locationId === id);
  if (event) return { plan, error: `"${event.title}" happens here. Move or delete it first.` };
  const car = plan.cars.find((c) => c.locationId === id);
  if (car) return { plan, error: `${car.name} is kept here. Move or delete the car first.` };
  const goal = plan.intentions.find((i) => i.locationId === id || (i.locationIds?.length === 1 && i.locationIds[0] === id));
  if (goal) return { plan, error: `The goal "${goal.description}" needs this place. Change the goal first.` };
  return {
    plan: {
      ...plan,
      locations: plan.locations.filter((l) => l.id !== id),
      travel: plan.travel.filter((t) => t.from !== id && t.to !== id),
      intentions: plan.intentions.map((i) => (i.locationIds ? { ...i, locationIds: i.locationIds.filter((l) => l !== id) } : i)),
    },
  };
}

export function addCar(plan: Plan, name: string, locationId: string): Edit {
  if (!name.trim()) return { plan, error: "Enter a name." };
  if (!plan.locations.some((l) => l.id === locationId)) return { plan, error: "Pick a place for the car." };
  if (plan.cars.some((c) => same(c.name, name))) return { plan, error: `${name.trim()} is already in the list.` };
  const id = uniqueId(name, plan.cars.map((c) => c.id));
  return { plan: { ...plan, cars: [...plan.cars, { id, name: name.trim(), locationId }] } };
}

export function removeCar(plan: Plan, id: string): Edit {
  const event = plan.events.find((e) => e.carId === id);
  if (event) return { plan, error: `"${event.title}" uses this car. Change or delete it first.` };
  const goal = plan.intentions.find((i) => i.carId === id);
  if (goal) return { plan, error: `The goal "${goal.description}" uses this car. Change the goal first.` };
  return { plan: { ...plan, cars: plan.cars.filter((c) => c.id !== id) } };
}

export function setTravel(plan: Plan, from: string, to: string, minutes: number | undefined): Edit {
  if (from === to) return { plan, error: "Pick two different places." };
  const ids = plan.locations.map((l) => l.id);
  if (!ids.includes(from) || !ids.includes(to)) return { plan, error: "Pick two places from the list." };
  const rest = plan.travel.filter((t) => !((t.from === from && t.to === to) || (t.from === to && t.to === from)));
  if (minutes === undefined || Number.isNaN(minutes)) return { plan: { ...plan, travel: rest } };
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 24 * 60) return { plan, error: "Enter whole minutes from 0 to 1440." };
  return { plan: { ...plan, travel: [...rest, { from, to, minutes }] } };
}

export function missingTravel(plan: Plan): [string, string][] {
  const pairs: [string, string][] = [];
  const ids = plan.locations.map((l) => l.id);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const known = plan.travel.some((t) => (t.from === ids[i] && t.to === ids[j]) || (t.from === ids[j] && t.to === ids[i]));
      if (!known) pairs.push([ids[i], ids[j]]);
    }
  }
  return pairs;
}
