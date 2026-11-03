# Shared Car Web App + PWA - Product Spec

## 1. Product Overview
A responsive web app for two people sharing one car informally. Coordinate availability, reservations, status, handoffs, parking, and notes.

## 2. Core Use Cases
- **Check Availability:** Real-time status (Available, Reserved, In Use, Needs Attention).
- **Reserve Car:** Future time windows with conflict detection.
- **Pickup/Return:** Track current holder and parking location.
- **Shared Notes:** "Needs gas," "Low tire pressure," etc.

## 3. Information Architecture
- **Dashboard:** "Can I use the car right now?" + Primary Actions.
- **Calendar:** Agenda view of upcoming bookings.
- **Notes:** Shared issues and reminders.
- **Settings:** Profile, Car Details, and Shared Rules.

## 4. Design Direction
- **Vibe:** Modern, Friendly, Calm, Trust-based.
- **UI Patterns:** Rounded cards, clear status badges, bottom tab bar (mobile), soft shadows.
- **Tone:** Casual and clear (e.g., "Alex has it right now").

## 5. MVP Scope
- Auth (2-user groups)
- Car Status & Dashboard
- Reservations (CRUD + Conflict detection)
- Conflict Request Flow (Borrow now, swap time)
- Pickup/Return Flow (Location, fuel, mileage)
- Shared Notes (Urgency levels)
- PWA Support (Manifest, offline shell)
