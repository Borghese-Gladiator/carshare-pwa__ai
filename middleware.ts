import { NextRequest, NextResponse } from 'next/server'
import { verifySession, COOKIE_NAME } from '@/lib/auth'

const PUBLIC = new Set(['/login', '/api/auth/login'])

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl
  if (PUBLIC.has(pathname)) return NextResponse.next()

  const raw = req.cookies.get(COOKIE_NAME)?.value
  const session = raw ? await verifySession(raw) : null

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
