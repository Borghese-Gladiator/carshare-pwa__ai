import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db/client'
import {
  acceptRequest,
  declineRequest,
  getUsersByGroup,
  withSerializableRetry,
} from '@/lib/db/queries'
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
    action?: 'accept' | 'decline'
    userId?: string
  }
  const { action, userId } = body

  if (!userId || (action !== 'accept' && action !== 'decline')) {
    return NextResponse.json(
      { error: 'action (accept|decline) and userId are required' },
      { status: 400 },
    )
  }

  const car = await getCar()
  if (!car) {
    return NextResponse.json({ error: 'No car configured' }, { status: 404 })
  }

  const members = await getUsersByGroup(car.group_id)
  if (!members.some((m) => m.id === userId)) {
    return NextResponse.json({ error: 'User is not part of this group' }, { status: 400 })
  }

  if (action === 'accept') {
    const result = await withSerializableRetry(() => acceptRequest(id, userId))
    if (!result.ok) {
      const status =
        result.reason === 'forbidden' ? 403 : result.reason === 'stale' ? 409 : 404
      return NextResponse.json({ error: result.reason }, { status })
    }
    return NextResponse.json({ ok: true, linkedReservationId: result.linkedReservationId })
  }

  const ok = await declineRequest(id, userId)
  if (!ok) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
