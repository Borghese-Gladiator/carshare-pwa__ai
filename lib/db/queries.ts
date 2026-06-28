import { sql } from './client';
import type { Car, CarNote, CarRequest, HandoffLog, HandoffType, Reservation, User } from './schema';

export async function getUsersByGroup(groupId: string): Promise<User[]> {
  return sql`SELECT * FROM users WHERE group_id = ${groupId} ORDER BY name` as unknown as User[];
}

export async function getCarsByGroup(groupId: string): Promise<Car[]> {
  return sql`SELECT * FROM cars WHERE group_id = ${groupId} ORDER BY name` as unknown as Car[];
}

export async function getReservationsByCar(
  carId: string,
  status?: string,
): Promise<Reservation[]> {
  if (status) {
    return sql`SELECT * FROM reservations WHERE car_id = ${carId} AND status = ${status} ORDER BY start_time` as unknown as Reservation[];
  }
  return sql`SELECT * FROM reservations WHERE car_id = ${carId} ORDER BY start_time` as unknown as Reservation[];
}

export async function getCarNotesByCar(
  carId: string,
  includeResolved = false,
): Promise<CarNote[]> {
  if (includeResolved) {
    return sql`SELECT * FROM car_notes WHERE car_id = ${carId} ORDER BY created_at DESC` as unknown as CarNote[];
  }
  return sql`SELECT * FROM car_notes WHERE car_id = ${carId} AND resolved = false ORDER BY created_at DESC` as unknown as CarNote[];
}

export async function getHandoffLogsByCar(
  carId: string,
  limit = 20,
): Promise<HandoffLog[]> {
  return sql`SELECT * FROM handoff_logs WHERE car_id = ${carId} ORDER BY logged_at DESC LIMIT ${limit}` as unknown as HandoffLog[];
}

export async function getPendingRequestsByCar(carId: string): Promise<CarRequest[]> {
  return sql`SELECT * FROM car_requests WHERE car_id = ${carId} AND status = 'pending' ORDER BY created_at DESC` as unknown as CarRequest[];
}

export async function getLatestHandoffWithUser(
  carId: string,
): Promise<(HandoffLog & { user_name: string; user_avatar: string | null }) | null> {
  const rows = (await sql`
    SELECT h.*, u.name AS user_name, u.avatar AS user_avatar
    FROM handoff_logs h JOIN users u ON h.user_id = u.id
    WHERE h.car_id = ${carId}
    ORDER BY h.logged_at DESC LIMIT 1
  `) as unknown as (HandoffLog & { user_name: string; user_avatar: string | null })[];
  return rows[0] ?? null;
}

export async function getUpcomingReservationWithUser(
  carId: string,
  hoursAhead: number,
): Promise<(Reservation & { user_name: string }) | null> {
  const rows = (await sql`
    SELECT r.*, u.name AS user_name
    FROM reservations r JOIN users u ON r.user_id = u.id
    WHERE r.car_id = ${carId}
      AND r.status IN ('pending', 'active')
      AND r.end_time > now()
      AND r.start_time <= now() + (${hoursAhead} || ' hours')::interval
    ORDER BY r.start_time LIMIT 1
  `) as unknown as (Reservation & { user_name: string })[];
  return rows[0] ?? null;
}

export async function getLastReturnLocation(carId: string): Promise<string | null> {
  const rows = (await sql`
    SELECT parking_location FROM handoff_logs
    WHERE car_id = ${carId} AND type = 'return' AND parking_location IS NOT NULL
    ORDER BY logged_at DESC LIMIT 1
  `) as unknown as { parking_location: string }[];
  return rows[0]?.parking_location ?? null;
}

export async function getUnresolvedUrgentNotes(carId: string): Promise<CarNote[]> {
  return sql`
    SELECT * FROM car_notes
    WHERE car_id = ${carId} AND urgency = 'urgent' AND resolved = false
    ORDER BY created_at DESC
  ` as unknown as CarNote[];
}

export async function getRecentHandoffsWithUsers(
  carId: string,
  days: number,
): Promise<(HandoffLog & { user_name: string })[]> {
  return sql`
    SELECT h.*, u.name AS user_name
    FROM handoff_logs h JOIN users u ON h.user_id = u.id
    WHERE h.car_id = ${carId}
      AND h.logged_at >= now() - (${days} || ' days')::interval
    ORDER BY h.logged_at DESC LIMIT 20
  ` as unknown as (HandoffLog & { user_name: string })[];
}

export async function insertHandoffLog(data: {
  carId: string;
  userId: string;
  type: HandoffType;
  parkingLocation?: string;
  fuel?: string;
  mileage?: number;
  expectedReturn?: string;
}): Promise<HandoffLog> {
  const rows = (await sql`
    INSERT INTO handoff_logs (car_id, user_id, type, parking_location, fuel, mileage, expected_return)
    VALUES (
      ${data.carId}, ${data.userId}, ${data.type},
      ${data.parkingLocation ?? null}, ${data.fuel ?? null},
      ${data.mileage ?? null}, ${data.expectedReturn ?? null}
    )
    RETURNING *
  `) as unknown as HandoffLog[];
  return rows[0];
}
