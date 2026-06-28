import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db/client'
import {
  getReservationsForWeek,
  createReservationChecked,
  getUsersByGroup,
  withSerializableRetry,
} from '@/lib/db/queries'
import { conflictResponse } from './conflict'
import type { Car } from '@/lib/db/schema'
import type { CalendarReservation } from '@/components/calendar/types'

async function getCar(): Promise<Car | null> {
  const rows = (await sql`SELECT * FROM cars LIMIT 1`) as unknown as Car[]
  return rows[0] ?? null
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const from = req.nextUrl.searchParams.get('from')
  const to = req.nextUrl.searchParams.get('to')
  if (!from || !to) {
    return NextResponse.json({ error: 'from and to are required' }, { status: 400 })
  }

  const car = await getCar()
  if (!car) {
    return NextResponse.json({ error: 'No car configured' }, { status: 404 })
  }

  const [rows, groupMembers] = await Promise.all([
    getReservationsForWeek(car.id, new Date(from), new Date(to)),
    getUsersByGroup(car.group_id),
  ])

  const reservations: CalendarReservation[] = rows.map((r) => {
    const start = new Date(r.start_time).toISOString()
    const end = new Date(r.end_time).toISOString()
    const has_conflict = rows.some((other) => {
      if (other.id === r.id) return false
      const oStart = new Date(other.start_time).toISOString()
      const oEnd = new Date(other.end_time).toISOString()
      return oStart < end && oEnd > start
    })
    return {
      id: r.id,
      car_id: r.car_id,
      user_id: r.user_id,
      user_name: r.user_name,
      start_time: start,
      end_time: end,
      title: r.title,
      purpose: r.purpose,
      status: r.status,
      has_conflict,
    }
  })

  return NextResponse.json({ reservations, groupMembers })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json().catch(() => ({}))) as {
    userId?: string
    startTime?: string
    endTime?: string
    title?: string
    purpose?: string
    force?: boolean
  }
  const { userId, startTime, endTime, title, purpose, force } = body

  if (!userId || !startTime || !endTime) {
    return NextResponse.json(
      { error: 'userId, startTime and endTime are required' },
      { status: 400 },
    )
  }
  const start = new Date(startTime)
  const end = new Date(endTime)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: 'Invalid start or end time' }, { status: 400 })
  }
  if (end <= start) {
    return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
  }

  const car = await getCar()
  if (!car) {
    return NextResponse.json({ error: 'No car configured' }, { status: 404 })
  }

  const members = await getUsersByGroup(car.group_id)
  if (!members.some((m) => m.id === userId)) {
    return NextResponse.json({ error: 'User is not part of this group' }, { status: 400 })
  }

  const result = await withSerializableRetry(() =>
    createReservationChecked({
      carId: car.id,
      userId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      title: title ?? null,
      purpose: purpose ?? null,
      skipConflictCheck: force === true,
    }),
  )

  if (!result.ok) {
    return conflictResponse(result.conflicts, members)
  }
  return NextResponse.json(result.reservation, { status: 201 })
}
