import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db/client'
import {
  createCarRequest,
  getLatestHandoffWithUser,
  getRequestsForUser,
  getUsersByGroup,
} from '@/lib/db/queries'
import type { Car, RequestType } from '@/lib/db/schema'

async function getCar(): Promise<Car | null> {
  const rows = (await sql`SELECT * FROM cars LIMIT 1`) as unknown as Car[]
  return rows[0] ?? null
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const car = await getCar()
  if (!car) {
    return NextResponse.json({ error: 'No car configured' }, { status: 404 })
  }

  const members = await getUsersByGroup(car.group_id)
  if (!members.some((m) => m.id === userId)) {
    return NextResponse.json({ error: 'User is not part of this group' }, { status: 400 })
  }

  const requests = await getRequestsForUser(userId)
  return NextResponse.json({ requests })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json().catch(() => ({}))) as {
    type?: RequestType
    requesterId?: string
    targetReservationId?: string
    requestedStart?: string
    requestedEnd?: string
  }
  const { type, requesterId, targetReservationId } = body

  if (!type || !requesterId) {
    return NextResponse.json({ error: 'type and requesterId are required' }, { status: 400 })
  }
  if (type !== 'borrow_now' && type !== 'swap') {
    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
  }

  const car = await getCar()
  if (!car) {
    return NextResponse.json({ error: 'No car configured' }, { status: 404 })
  }

  const members = await getUsersByGroup(car.group_id)
  if (!members.some((m) => m.id === requesterId)) {
    return NextResponse.json({ error: 'User is not part of this group' }, { status: 400 })
  }

  // Both request types carry the requester's desired/offered window; the
  // reservation is only materialized on accept (see acceptRequest).
  if (!body.requestedStart || !body.requestedEnd) {
    return NextResponse.json(
      { error: 'requestedStart and requestedEnd are required' },
      { status: 400 },
    )
  }
  const start = new Date(body.requestedStart)
  const end = new Date(body.requestedEnd)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: 'Invalid requested time' }, { status: 400 })
  }
  if (end <= start) {
    return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
  }
  if (end <= new Date()) {
    return NextResponse.json({ error: 'Requested window is in the past' }, { status: 400 })
  }
  const requestedStart = start.toISOString()
  const requestedEnd = end.toISOString()

  let targetUserId: string | undefined

  if (type === 'borrow_now') {
    const latestHandoff = await getLatestHandoffWithUser(car.id)
    if (!latestHandoff || latestHandoff.type !== 'pickup') {
      return NextResponse.json({ error: 'Car is not currently in use' }, { status: 400 })
    }
    targetUserId = latestHandoff.user_id
  } else {
    if (!targetReservationId) {
      return NextResponse.json(
        { error: 'targetReservationId is required' },
        { status: 400 },
      )
    }
    const targetRows = (await sql`
      SELECT user_id, status FROM reservations WHERE id = ${targetReservationId}
    `) as unknown as { user_id: string; status: string }[]
    if (targetRows.length === 0) {
      return NextResponse.json({ error: 'Target reservation not found' }, { status: 404 })
    }
    if (targetRows[0].status === 'cancelled' || targetRows[0].status === 'completed') {
      return NextResponse.json({ error: 'Target reservation is no longer active' }, { status: 409 })
    }
    targetUserId = targetRows[0].user_id
  }

  if (targetUserId === requesterId) {
    return NextResponse.json({ error: 'Cannot request from yourself' }, { status: 400 })
  }

  // One pending request per (requester, target holder, car) — covers borrow_now
  // (no target reservation) and prevents duplicate swaps for the same slot.
  const existing = (
    type === 'swap'
      ? await sql`
          SELECT id FROM car_requests
          WHERE requester_id = ${requesterId}
            AND target_user_id = ${targetUserId}
            AND car_id = ${car.id}
            AND status = 'pending'
            AND target_reservation_id = ${targetReservationId}
          LIMIT 1
        `
      : await sql`
          SELECT id FROM car_requests
          WHERE requester_id = ${requesterId}
            AND target_user_id = ${targetUserId}
            AND car_id = ${car.id}
            AND status = 'pending'
            AND type = 'borrow_now'
          LIMIT 1
        `
  ) as unknown as { id: string }[]
  if (existing.length > 0) {
    return NextResponse.json({ error: 'A pending request already exists' }, { status: 409 })
  }

  const request = await createCarRequest({
    carId: car.id,
    requesterId,
    type,
    targetUserId,
    targetReservationId,
    requestedStart,
    requestedEnd,
  })

  return NextResponse.json(request, { status: 201 })
}
