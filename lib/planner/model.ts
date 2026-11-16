export type Person = { id: string; name: string };

export type Location = { id: string; name: string };

export type Car = { id: string; name: string; locationId: string };

export type TravelTime = { from: string; to: string; minutes: number };

export type PlanEvent = {
  id: string;
  title: string;
  personIds: string[];
  locationId: string;
  start: string;
  end: string;
  carId?: string;
  fixed?: boolean;
};

export type Intention = {
  id: string;
  description: string;
  personIds: string[];
  minMinutes: number;
  windowStart: string;
  windowEnd: string;
  locationId?: string;
  carId?: string;
};

export type Plan = {
  people: Person[];
  locations: Location[];
  cars: Car[];
  travel: TravelTime[];
  events: PlanEvent[];
  intentions: Intention[];
};

export function isMovable(event: Pick<PlanEvent, "fixed">): boolean {
  return event.fixed !== true;
}

export function travelMinutes(travel: TravelTime[], from: string, to: string): number | undefined {
  if (from === to) return 0;
  return travel.find((t) => (t.from === from && t.to === to) || (t.from === to && t.to === from))?.minutes;
}
