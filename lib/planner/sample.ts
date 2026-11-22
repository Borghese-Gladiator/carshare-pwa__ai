import type { Plan } from "./model";

export const samplePlan: Plan = {
  people: [
    { id: "me", name: "Me" },
    { id: "gf", name: "Girlfriend" },
    { id: "bro", name: "Brother" },
  ],
  locations: [
    { id: "home", name: "Home" },
    { id: "south", name: "South Station" },
    { id: "cafe", name: "Cafe" },
    { id: "lake", name: "Lake" },
  ],
  cars: [
    { id: "A", name: "Car A", locationId: "home" },
    { id: "B", name: "Car B", locationId: "home" },
  ],
  travel: [
    { from: "home", to: "south", minutes: 60 },
    { from: "home", to: "cafe", minutes: 15 },
    { from: "home", to: "lake", minutes: 75 },
    { from: "south", to: "cafe", minutes: 45 },
    { from: "south", to: "lake", minutes: 30 },
  ],
  events: [
    { id: "work", title: "Work", personIds: ["me"], locationId: "home", start: "2026-11-27T13:00:00Z", end: "2026-11-27T21:00:00Z", fixed: true },
    { id: "trip", title: "Trip south", personIds: ["gf"], locationId: "south", start: "2026-11-28T14:00:00Z", end: "2026-11-28T16:00:00Z", fixed: true },
    { id: "gym", title: "Gym", personIds: ["me", "bro"], locationId: "home", carId: "A", start: "2026-11-28T15:00:00Z", end: "2026-11-28T17:00:00Z" },
  ],
  intentions: [
    {
      id: "date",
      description: "See girlfriend",
      personIds: ["me", "gf"],
      minMinutes: 240,
      windowStart: "2026-11-28T12:00:00Z",
      windowEnd: "2026-11-29T22:00:00Z",
      locationIds: ["cafe", "lake"],
    },
  ],
};
