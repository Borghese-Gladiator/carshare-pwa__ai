import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db/client'
import {
  updateReservationChecked,
  cancelReservation,
  getUsersByGroup,
  withSerializableRetry,
} from '@/lib/db/queries'
import { conflictResponse } from '../conflict'
import type { Car } from '@/lib/db/schema'

async function getCar(): Promise<Car | null> {
  const rows = (await sql`SELECT * FROM cars LIMIT 1`) as unknown as Car[]
  return rows[0] ?? null
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
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
    updateReservationChecked(id, {
      carId: car.id,
      userId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      title: title ?? null,
      purpose: purpose ?? null,
      skipConflictCheck: force === true,
    }),
  )

  if (result.ok === 'not_found') {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
  }
  if (!result.ok) {
    return conflictResponse(result.conflicts, members)
  }
  return NextResponse.json(result.reservation)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const ok = await cancelReservation(id)
  if (!ok) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
