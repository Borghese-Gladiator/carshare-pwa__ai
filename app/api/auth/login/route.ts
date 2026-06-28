import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessCode, signSession, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}))
  const candidate: string = typeof body?.code === 'string' ? body.code : ''

  if (!verifyAccessCode(candidate)) {
    return NextResponse.json({ error: 'Invalid access code' }, { status: 401 })
  }

  const token = await signSession({ iat: Date.now() })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
  return res
}
