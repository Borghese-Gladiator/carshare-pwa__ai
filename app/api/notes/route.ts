import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db/client'
import {
  getActiveNotesWithAuthors,
  insertCarNote,
  getUsersByGroup,
} from '@/lib/db/queries'
import type { Car, NoteUrgency } from '@/lib/db/schema'

async function getCar(): Promise<Car | null> {
  const rows = (await sql`SELECT * FROM cars LIMIT 1`) as unknown as Car[]
  return rows[0] ?? null
}

export async function GET(): Promise<NextResponse> {
  const car = await getCar()
  if (!car) return NextResponse.json({ error: 'No car configured' }, { status: 404 })
  const notes = await getActiveNotesWithAuthors(car.id)
  return NextResponse.json({ notes })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}))
  const userId: string = typeof body?.userId === 'string' ? body.userId : ''
  const noteBody: string = typeof body?.body === 'string' ? body.body.trim() : ''
  const urgency: NoteUrgency = body?.urgency === 'urgent' ? 'urgent' : 'fyi'
  const location: string | undefined =
    typeof body?.location === 'string' && body.location.trim()
      ? body.location.trim()
      : undefined

  if (!userId || !noteBody) {
    return NextResponse.json({ error: 'userId and body are required' }, { status: 400 })
  }

  const car = await getCar()
  if (!car) return NextResponse.json({ error: 'No car configured' }, { status: 404 })

  const members = await getUsersByGroup(car.group_id)
  if (!members.some((m) => m.id === userId)) {
    return NextResponse.json({ error: 'Unknown user' }, { status: 400 })
  }

  const note = await insertCarNote({
    carId: car.id,
    authorId: userId,
    body: noteBody,
    urgency,
    location,
  })
  return NextResponse.json(note, { status: 201 })
}
