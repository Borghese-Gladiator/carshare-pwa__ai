import { NextResponse } from 'next/server'
import type { Reservation, User } from '@/lib/db/schema'

export function conflictResponse(conflicts: Reservation[], members: User[]): NextResponse {
  const nameById = new Map(members.map((m) => [m.id, m.name]))
  return NextResponse.json(
    {
      error: 'conflict',
      conflicts: conflicts.map((c) => ({
        id: c.id,
        title: c.title,
        start_time: new Date(c.start_time).toISOString(),
        end_time: new Date(c.end_time).toISOString(),
        user_name: nameById.get(c.user_id),
      })),
    },
    { status: 409 },
  )
}
