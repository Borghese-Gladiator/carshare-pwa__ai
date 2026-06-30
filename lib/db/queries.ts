import { sql, getPool } from './client';
import type {
  Car,
  CarNote,
  HandoffLog,
  HandoffType,
  NoteUrgency,
  Reservation,
  User,
} from './schema';

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

export async function getReservationsForWeek(
  carId: string,
  from: Date,
  to: Date,
): Promise<(Reservation & { user_name: string })[]> {
  return sql`
    SELECT r.*, u.name AS user_name
    FROM reservations r JOIN users u ON r.user_id = u.id
    WHERE r.car_id = ${carId}
      AND r.status IN ('pending', 'active')
      AND r.start_time < ${to.toISOString()}::timestamptz
      AND r.end_time   > ${from.toISOString()}::timestamptz
    ORDER BY r.start_time
  ` as unknown as (Reservation & { user_name: string })[];
}

// SERIALIZABLE transactions can abort with SQLSTATE 40001 when a concurrent
// transaction touches the same rows; the documented remedy is to retry.
export async function withSerializableRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== '40001' && code !== '40P01') throw err;
      lastErr = err;
    }
  }
  throw lastErr;
}

export type CreateResult =
  | { ok: true; reservation: Reservation }
  | { ok: false; conflicts: Reservation[] };

// Runs the conflict check and the write in one SERIALIZABLE transaction so two
// concurrent unforced creates for the same slot can't both observe an empty
// conflict set and silently commit. Coexistence is still allowed: callers pass
// skipConflictCheck (force) to deliberately create an overlapping reservation.
export async function createReservationChecked(data: {
  carId: string;
  userId: string;
  startTime: string;
  endTime: string;
  title?: string | null;
  purpose?: string | null;
  skipConflictCheck: boolean;
}): Promise<CreateResult> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    if (!data.skipConflictCheck) {
      const { rows: conflicts } = await client.query<Reservation>(
        `SELECT * FROM reservations
         WHERE car_id = $1
           AND status IN ('pending', 'active')
           AND start_time < $3::timestamptz
           AND end_time   > $2::timestamptz`,
        [data.carId, data.startTime, data.endTime],
      );
      if (conflicts.length > 0) {
        await client.query('ROLLBACK');
        return { ok: false, conflicts };
      }
    }
    const { rows } = await client.query<Reservation>(
      `INSERT INTO reservations (car_id, user_id, start_time, end_time, title, purpose)
       VALUES ($1, $2, $3::timestamptz, $4::timestamptz, $5, $6)
       RETURNING *`,
      [data.carId, data.userId, data.startTime, data.endTime, data.title ?? null, data.purpose ?? null],
    );
    await client.query('COMMIT');
    return { ok: true, reservation: rows[0] };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export type UpdateResult =
  | { ok: true; reservation: Reservation }
  | { ok: false; conflicts: Reservation[] }
  | { ok: 'not_found' };

export async function updateReservationChecked(
  id: string,
  data: {
    carId: string;
    userId: string;
    startTime: string;
    endTime: string;
    title: string | null;
    purpose: string | null;
    skipConflictCheck: boolean;
  },
): Promise<UpdateResult> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    if (!data.skipConflictCheck) {
      const { rows: conflicts } = await client.query<Reservation>(
        `SELECT * FROM reservations
         WHERE car_id = $1
           AND id != $2
           AND status IN ('pending', 'active')
           AND start_time < $4::timestamptz
           AND end_time   > $3::timestamptz`,
        [data.carId, id, data.startTime, data.endTime],
      );
      if (conflicts.length > 0) {
        await client.query('ROLLBACK');
        return { ok: false, conflicts };
      }
    }
    const { rows } = await client.query<Reservation>(
      `UPDATE reservations
       SET user_id = $2, start_time = $3::timestamptz, end_time = $4::timestamptz,
           title = $5, purpose = $6
       WHERE id = $1 AND status NOT IN ('cancelled', 'completed')
       RETURNING *`,
      [id, data.userId, data.startTime, data.endTime, data.title, data.purpose],
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return { ok: 'not_found' };
    }
    await client.query('COMMIT');
    return { ok: true, reservation: rows[0] };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function cancelReservation(id: string): Promise<boolean> {
  const rows = (await sql`
    UPDATE reservations SET status = 'cancelled'
    WHERE id = ${id} AND status NOT IN ('cancelled', 'completed')
    RETURNING id
  `) as unknown as { id: string }[];
  return rows.length > 0;
}

export async function insertHandoffLog(data: {
  carId: string;
  userId: string;
  type: HandoffType;
  parkingLocation?: string;
  fuel?: string;
  mileage?: number;
  expectedReturn?: string;
  note?: string;
}): Promise<HandoffLog> {
  const rows = (await sql`
    INSERT INTO handoff_logs (car_id, user_id, type, parking_location, fuel, mileage, expected_return, note)
    VALUES (
      ${data.carId}, ${data.userId}, ${data.type},
      ${data.parkingLocation ?? null}, ${data.fuel ?? null},
      ${data.mileage ?? null}, ${data.expectedReturn ?? null}, ${data.note ?? null}
    )
    RETURNING *
  `) as unknown as HandoffLog[];
  return rows[0];
}

// Returns active (unresolved) notes joined with author name, newest first.
export async function getActiveNotesWithAuthors(
  carId: string,
): Promise<(CarNote & { author_name: string })[]> {
  return sql`
    SELECT n.*, u.name AS author_name
    FROM car_notes n JOIN users u ON n.author_id = u.id
    WHERE n.car_id = ${carId} AND n.resolved = false
    ORDER BY n.created_at DESC
  ` as unknown as (CarNote & { author_name: string })[];
}

export async function insertCarNote(data: {
  carId: string;
  authorId: string;
  body: string;
  urgency: NoteUrgency;
  location?: string;
}): Promise<CarNote> {
  const rows = (await sql`
    INSERT INTO car_notes (car_id, author_id, body, urgency, location)
    VALUES (${data.carId}, ${data.authorId}, ${data.body}, ${data.urgency}, ${data.location ?? null})
    RETURNING *
  `) as unknown as CarNote[];
  return rows[0];
}

export async function resolveCarNote(id: string): Promise<boolean> {
  const rows = (await sql`
    UPDATE car_notes SET resolved = true
    WHERE id = ${id} AND resolved = false
    RETURNING id
  `) as unknown as { id: string }[];
  return rows.length > 0;
}
