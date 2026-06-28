import { NextRequest, NextResponse } from 'next/server'
import { resolveCarNote } from '@/lib/db/queries'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const ok = await resolveCarNote(id)
  if (!ok) return NextResponse.json({ error: 'Note not found or already resolved' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
