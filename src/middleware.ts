import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Routes that require authentication
const PROTECTED_ROUTES = ['/cart', '/orders', '/profile', '/checkout']

// Routes that are only for unauthenticated users
const AUTH_ROUTES = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname

  // Redirect to login if accessing protected route without session
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
  if (isProtected && !session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth routes
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/menu', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (manifest, icons, sw.js)
     * - API routes that don't need auth check
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-).*)',
  ],
}
