import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE, USER_ID_HEADER, verifySessionToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(AUTH_COOKIE)?.value
  const userId = token ? await verifySessionToken(token) : null

  // Auth API routes are always public
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Login/signup pages redirect already-authenticated users to songs
  if (pathname === '/login' || pathname === '/signup') {
    if (userId) return NextResponse.redirect(new URL('/songs', request.url))
    return NextResponse.next()
  }

  // Everything else requires auth
  if (!userId) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Inject userId into request headers so API routes can read it
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(USER_ID_HEADER, String(userId))

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
