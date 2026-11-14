import { travelMinutes, type PlanEvent, type TravelTime } from "./model";

export type Conflict =
  | { type: "car"; carId: string; eventIds: [string, string] }
  | { type: "person"; personId: string; eventIds: [string, string] }
  | { type: "travel"; personId: string; eventIds: [string, string]; neededMinutes: number; gapMinutes: number };

const ms = (iso: string) => Date.parse(iso);

export function findConflicts(plan: { events: PlanEvent[]; travel?: TravelTime[] }): Conflict[] {
  const travel = plan.travel ?? [];
  const events = [...plan.events].sort((a, b) => ms(a.start) - ms(b.start));
  const conflicts: Conflict[] = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];
      const overlap = ms(a.start) < ms(b.end) && ms(b.start) < ms(a.end);
      const ids: [string, string] = [a.id, b.id];

      if (overlap && a.carId && a.carId === b.carId) {
        conflicts.push({ type: "car", carId: a.carId, eventIds: ids });
      }

      for (const personId of a.personIds.filter((p) => b.personIds.includes(p))) {
        if (overlap) {
          conflicts.push({ type: "person", personId, eventIds: ids });
          continue;
        }
        const needed = travelMinutes(travel, a.locationId, b.locationId);
        const gap = (ms(b.start) - ms(a.end)) / 60000;
        if (needed !== undefined && gap < needed) {
          conflicts.push({ type: "travel", personId, eventIds: ids, neededMinutes: needed, gapMinutes: gap });
        }
      }
    }
  }
  return conflicts;
}
