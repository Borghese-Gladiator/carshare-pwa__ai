import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db/client'
import { getPendingIncomingCount, getUsersByGroup } from '@/lib/db/queries'
import type { Car } from '@/lib/db/schema'

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

  const pendingIncomingCount = await getPendingIncomingCount(userId)
  return NextResponse.json({ pendingIncomingCount })
}
