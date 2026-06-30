import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db/client'
import { insertHandoffLog } from '@/lib/db/queries'
import { USERS } from '@/lib/users'
import type { Car } from '@/lib/db/schema'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}))
  const userId: string = typeof body?.userId === 'string' ? body.userId : ''
  const parkingLocation: string =
    typeof body?.parkingLocation === 'string' ? body.parkingLocation : ''
  const fuel: string | undefined = typeof body?.fuel === 'string' ? body.fuel : undefined
  const mileage: number | undefined =
    typeof body?.mileage === 'number' ? body.mileage : undefined
  const note: string | undefined =
    typeof body?.note === 'string' && body.note.trim() ? body.note.trim() : undefined

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }
  if (!parkingLocation.trim()) {
    return NextResponse.json({ error: 'parkingLocation is required' }, { status: 400 })
  }

  const carRows = (await sql`SELECT * FROM cars LIMIT 1`) as unknown as Car[]
  const car = carRows[0]
  if (!car) {
    return NextResponse.json({ error: 'No car configured' }, { status: 404 })
  }

  if (!USERS.some((m) => m.id === userId)) {
    return NextResponse.json({ error: 'Unknown user' }, { status: 400 })
  }

  await insertHandoffLog({
    carId: car.id,
    userId,
    type: 'return',
    parkingLocation,
    fuel,
    mileage,
    note,
  })
  return NextResponse.json({ ok: true })
}
