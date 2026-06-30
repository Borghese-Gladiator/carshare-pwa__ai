import { NextResponse } from 'next/server'
import { sql } from '@/lib/db/client'
import {
  getLatestHandoffWithUser,
  getUpcomingReservationWithUser,
  getLastReturnLocation,
  getUnresolvedUrgentNotes,
  getRecentHandoffsWithUsers,
} from '@/lib/db/queries'
import { USERS } from '@/lib/users'
import type { Car } from '@/lib/db/schema'

const SOON_HOURS = 2
const ACTIVITY_DAYS = 7

export async function GET(): Promise<NextResponse> {
  const carRows = (await sql`SELECT * FROM cars LIMIT 1`) as unknown as Car[]
  const car = carRows[0]
  if (!car) {
    return NextResponse.json({ error: 'No car configured' }, { status: 404 })
  }

  const [
    latestHandoff,
    upcomingReservation,
    lastLocation,
    urgentNotes,
    recentHandoffs,
  ] = await Promise.all([
    getLatestHandoffWithUser(car.id),
    getUpcomingReservationWithUser(car.id, SOON_HOURS),
    getLastReturnLocation(car.id),
    getUnresolvedUrgentNotes(car.id),
    getRecentHandoffsWithUsers(car.id, ACTIVITY_DAYS),
  ])

  let status: 'available' | 'reserved' | 'in_use' | 'needs_attention'
  if (urgentNotes.length > 0) {
    status = 'needs_attention'
  } else if (latestHandoff?.type === 'pickup') {
    status = 'in_use'
  } else if (upcomingReservation != null) {
    status = 'reserved'
  } else {
    status = 'available'
  }

  return NextResponse.json({
    car: { id: car.id, name: car.name, details: car.details },
    status,
    activeHandoff:
      latestHandoff?.type === 'pickup'
        ? {
            userId: latestHandoff.user_id,
            userName: latestHandoff.user_name,
            userAvatar: latestHandoff.user_avatar,
            since: latestHandoff.logged_at,
            expectedReturn: latestHandoff.expected_return,
          }
        : null,
    nextReservation: upcomingReservation
      ? {
          userId: upcomingReservation.user_id,
          userName: upcomingReservation.user_name,
          startTime: upcomingReservation.start_time,
          endTime: upcomingReservation.end_time,
          title: upcomingReservation.title,
        }
      : null,
    lastLocation,
    groupMembers: USERS,
    recentActivity: recentHandoffs.map((h) => ({
      id: h.id,
      type: h.type,
      userId: h.user_id,
      userName: h.user_name,
      loggedAt: h.logged_at,
      location: h.type === 'return' ? h.parking_location : null,
      note: h.note,
    })),
    urgentNote: urgentNotes[0] ?? null,
  })
}
