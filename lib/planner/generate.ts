import { findConflicts, type Conflict } from "./conflicts";
import { isMovable, type Plan, type PlanEvent, type TravelTime } from "./model";

export type ScheduledBlock = { intentionId: string; start: string; end: string };

export type PlanOption = {
  events: PlanEvent[];
  travel: TravelTime[];
  blocks: ScheduledBlock[];
  movedEventIds: string[];
  score: number;
  explanation: string;
};

export type GenerateResult = { options: PlanOption[]; reason?: string };

const STEP = 30 * 60000;
const MAX_SHIFT_STEPS = 24;
const MAX_OPTIONS = 3;
const MIN_GAP = 2 * 3600000;
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 22;
const NODE_BUDGET = 200000;

const ms = (iso: string) => Date.parse(iso);
const iso = (t: number) => new Date(t).toISOString();
const label = (e: PlanEvent) => `${e.title} (${e.id})`;
const fmt = (t: number) => new Date(t).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "UTC" });

function shift(e: PlanEvent, delta: number): PlanEvent {
  return delta === 0 ? e : { ...e, start: iso(ms(e.start) + delta), end: iso(ms(e.end) + delta) };
}

function clean(events: PlanEvent[], travel: TravelTime[]) {
  return findConflicts({ events, travel }).length === 0;
}

function describeConflict(c: Conflict, byId: Map<string, PlanEvent>): string {
  const [a, b] = c.eventIds.map((id) => label(byId.get(id)!));
  if (c.type === "car") return `${a} and ${b} both need car ${c.carId} at the same time`;
  if (c.type === "person") return `${a} and ${b} both need ${c.personId} at the same time`;
  return `${c.personId} cannot travel from ${a} to ${b} in ${c.gapMinutes} minutes (needs ${c.neededMinutes})`;
}

function outsideDayMinutes(start: number, end: number): number {
  let out = 0;
  for (let t = start; t < end; t += STEP) {
    const h = new Date(t).getUTCHours();
    if (h < DAY_START_HOUR || h >= DAY_END_HOUR) out += 30;
  }
  return out;
}

export function generatePlans(plan: Plan): GenerateResult {
  const travel = plan.travel;
  const fixed = plan.events.filter((e) => !isMovable(e));
  const movable = plan.events.filter(isMovable);
  const byId = new Map(plan.events.map((e) => [e.id, e]));

  const fixedConflicts = findConflicts({ events: fixed, travel });
  if (fixedConflicts.length > 0) {
    return {
      options: [],
      reason: `No conflict-free schedule exists: ${fixedConflicts.map((c) => describeConflict(c, byId)).join("; ")}.`,
    };
  }

  const shifts = [0];
  for (let i = 1; i <= MAX_SHIFT_STEPS; i++) shifts.push(i * STEP, -i * STEP);

  let nodes = 0;
  const completeMovables = (placed: PlanEvent[], idx: number): PlanEvent[] | null => {
    if (idx === movable.length) return placed;
    for (const d of shifts) {
      if (++nodes > NODE_BUDGET) return null;
      const next = [...placed, shift(movable[idx], d)];
      if (!clean(next, travel)) continue;
      const done = completeMovables(next, idx + 1);
      if (done) return done;
    }
    return null;
  };

  const solutions: { events: PlanEvent[]; blocks: ScheduledBlock[] }[] = [];
  const placeIntentions = (placed: PlanEvent[], blocks: ScheduledBlock[], idx: number) => {
    if (nodes > NODE_BUDGET) return;
    if (idx === plan.intentions.length) {
      const done = completeMovables(placed, 0);
      if (done) solutions.push({ events: done, blocks });
      return;
    }
    const it = plan.intentions[idx];
    const len = it.minMinutes * 60000;
    for (let s = ms(it.windowStart); s + len <= ms(it.windowEnd); s += STEP) {
      const block: PlanEvent = {
        id: `intention:${it.id}`,
        title: it.description,
        personIds: it.personIds,
        locationId: it.locationId ?? "",
        start: iso(s),
        end: iso(s + len),
      };
      const next = [...placed, block];
      if (!clean(next, travel)) continue;
      placeIntentions(next, [...blocks, { intentionId: it.id, start: block.start, end: block.end }], idx + 1);
    }
  };
  placeIntentions(fixed, [], 0);

  if (solutions.length === 0) {
    return {
      options: [],
      reason: `No conflict-free schedule fits ${plan.intentions.map((i) => `"${i.description}"`).join(", ") || "these events"} around the fixed events ${fixed.map(label).join(", ") || "(none)"}.`,
    };
  }

  const scored = solutions
    .map(({ events, blocks }) => {
      const moved = movable.filter((m) => {
        const now = events.find((e) => e.id === m.id)!;
        return ms(now.start) !== ms(m.start);
      });
      const shiftMinutes = moved.reduce((sum, m) => {
        const now = events.find((e) => e.id === m.id)!;
        return sum + Math.abs(ms(now.start) - ms(m.start)) / 60000;
      }, 0);
      const offHours = blocks.reduce((sum, b) => sum + outsideDayMinutes(ms(b.start), ms(b.end)), 0);
      const score = Math.round(100 - moved.length * 5 - shiftMinutes / 30 - offHours / 15);
      return { events, blocks, moved, score };
    })
    .sort((a, b) => b.score - a.score);

  // ponytail: diversity = first block start 2h apart, compare all blocks if multi-intention options look too alike
  const picked: typeof scored = [];
  for (const s of scored) {
    if (picked.length === MAX_OPTIONS) break;
    const start = s.blocks[0] ? ms(s.blocks[0].start) : 0;
    if (picked.every((p) => !p.blocks[0] || Math.abs(ms(p.blocks[0].start) - start) >= MIN_GAP)) picked.push(s);
  }
  for (const s of scored) {
    if (picked.length === MAX_OPTIONS) break;
    if (!picked.includes(s)) picked.push(s);
  }
  picked.sort((a, b) => b.score - a.score);

  const options = picked.map(({ events, blocks, moved, score }) => {
    const lines = blocks.map((b) => {
      const it = plan.intentions.find((i) => i.id === b.intentionId)!;
      return `Scheduled "${it.description}" ${fmt(ms(b.start))}–${fmt(ms(b.end))}.`;
    });
    for (const m of moved) {
      const now = events.find((e) => e.id === m.id)!;
      lines.push(`Moved ${label(m)} from ${fmt(ms(m.start))} to ${fmt(ms(now.start))}.`);
    }
    if (moved.length === 0) lines.push("No events moved.");
    return { events, travel, blocks, movedEventIds: moved.map((m) => m.id), score, explanation: lines.join(" ") };
  });

  return { options };
}
