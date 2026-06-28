import { sql } from './client';
import type { Car, CarNote, CarRequest, HandoffLog, Reservation, User } from './schema';

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
