import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db/client'
import { getUsersByGroup, insertHandoffLog } from '@/lib/db/queries'
import type { Car } from '@/lib/db/schema'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}))
  const userId: string = typeof body?.userId === 'string' ? body.userId : ''
  const expectedReturn: string | undefined =
    typeof body?.expectedReturn === 'string' ? body.expectedReturn : undefined

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const carRows = (await sql`SELECT * FROM cars LIMIT 1`) as unknown as Car[]
  const car = carRows[0]
  if (!car) {
    return NextResponse.json({ error: 'No car configured' }, { status: 404 })
  }

  const members = await getUsersByGroup(car.group_id)
  if (!members.some((m) => m.id === userId)) {
    return NextResponse.json({ error: 'Unknown user' }, { status: 400 })
  }

  await insertHandoffLog({ carId: car.id, userId, type: 'pickup', expectedReturn })
  return NextResponse.json({ ok: true })
}
