import { findConflicts } from "./conflicts";
import type { ScheduledBlock } from "./generate";
import { travelMinutes, type Plan, type PlanEvent } from "./model";

export function withBlocks(plan: Plan, blocks: ScheduledBlock[] = []): Plan {
  const extra: PlanEvent[] = [];
  for (const b of blocks) {
    const it = plan.intentions.find((i) => i.id === b.intentionId);
    if (!it) continue;
    extra.push({
      id: `intention:${it.id}`,
      title: it.description,
      personIds: it.personIds,
      locationId: b.locationId ?? it.locationId ?? "",
      carId: it.carId,
      start: b.start,
      end: b.end,
    });
  }
  return { ...plan, events: [...plan.events, ...extra] };
}

export type LaneItem = {
  kind: "event" | "travel";
  id: string;
  title: string;
  start: number;
  end: number;
  fixed: boolean;
  conflict: boolean;
};

export type Lane = { id: string; label: string; kind: "person" | "car"; items: LaneItem[] };

const ms = (iso: string) => Date.parse(iso);
const DAY = 86400000;

export function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

export function daysOf(plan: Plan): string[] {
  const days = new Set<string>();
  for (const e of plan.events) {
    for (let t = ms(dayOf(e.start) + "T00:00:00Z"); t < ms(e.end); t += DAY) days.add(new Date(t).toISOString().slice(0, 10));
  }
  return [...days].sort();
}

function toItem(e: PlanEvent, conflictIds: Set<string>): LaneItem {
  return { kind: "event", id: e.id, title: e.title, start: ms(e.start), end: ms(e.end), fixed: e.fixed === true, conflict: conflictIds.has(e.id) };
}

export function buildLanes(plan: Plan, day: string): Lane[] {
  const from = ms(day + "T00:00:00Z");
  const to = from + DAY;
  const conflictIds = new Set(findConflicts(plan).flatMap((c) => c.eventIds));
  const onDay = (i: { start: number; end: number }) => i.start < to && i.end > from;
  const byStart = (a: PlanEvent, b: PlanEvent) => ms(a.start) - ms(b.start);

  const people: Lane[] = plan.people.map((p) => {
    const mine = plan.events.filter((e) => e.personIds.includes(p.id)).sort(byStart);
    const items: LaneItem[] = mine.map((e) => toItem(e, conflictIds));
    for (let i = 0; i + 1 < mine.length; i++) {
      const a = mine[i];
      const b = mine[i + 1];
      const needed = travelMinutes(plan.travel, a.locationId, b.locationId);
      if (!needed) continue;
      const start = ms(a.end);
      const end = Math.min(start + needed * 60000, Math.max(ms(b.start), start));
      if (end > start) items.push({ kind: "travel", id: `travel:${a.id}:${b.id}`, title: `Travel ${needed} min`, start, end, fixed: false, conflict: ms(b.start) - start < needed * 60000 });
    }
    return { id: p.id, label: p.name, kind: "person" as const, items: items.filter(onDay) };
  });

  const cars: Lane[] = plan.cars.map((c) => ({
    id: c.id,
    label: c.name,
    kind: "car" as const,
    items: plan.events
      .filter((e) => e.carId === c.id)
      .sort(byStart)
      .map((e) => toItem(e, conflictIds))
      .filter(onDay),
  }));

  return [...people, ...cars];
}
