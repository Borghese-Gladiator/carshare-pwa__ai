import { generatePlans } from "./generate";
import type { Intention, Plan } from "./model";

export type Fit = { intentionId: string; fits: boolean; reason: string; options: number };

export function checkFit(plan: Plan, intention: Intention): Fit {
  const { options, reason } = generatePlans({ ...plan, intentions: [intention] });
  if (options.length > 0) {
    const moved = options[0].movedEventIds.length;
    return {
      intentionId: intention.id,
      fits: true,
      options: options.length,
      reason: moved === 0 ? "Fits with no events moved." : `Fits if ${moved} event${moved === 1 ? "" : "s"} move${moved === 1 ? "s" : ""}.`,
    };
  }
  return { intentionId: intention.id, fits: false, options: 0, reason: reason ?? "No conflict-free time found." };
}

export function checkAll(plan: Plan): Fit[] {
  return plan.intentions.map((it) => checkFit(plan, it));
}

export function addIntention(plan: Plan, intention: Intention): Plan {
  return { ...plan, intentions: [...plan.intentions, intention] };
}

export function removeIntention(plan: Plan, id: string): Plan {
  return { ...plan, intentions: plan.intentions.filter((i) => i.id !== id) };
}

export function validateIntention(plan: Plan, it: Intention): string | undefined {
  if (!it.description.trim()) return "Enter a name for the goal.";
  if (it.personIds.length === 0) return "Pick at least one person.";
  if (!(it.minMinutes > 0)) return "Enter a length longer than 0 hours.";
  const start = Date.parse(it.windowStart);
  const end = Date.parse(it.windowEnd);
  if (Number.isNaN(start) || Number.isNaN(end)) return "Enter a start and an end for the time window.";
  if (end <= start) return "The window must end after it starts.";
  if ((end - start) / 60000 < it.minMinutes) return "The window is shorter than the length of the goal.";
  if (plan.intentions.some((i) => i.id === it.id)) return "This goal already exists.";
  return undefined;
}
