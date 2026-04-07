import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ─── Route patterns ──────────────────────────────────────────────────────────

// Routes nécessitant une authentification simple
const PROTECTED_ROUTES = ['/checkout', '/profile', '/orders', '/profil', '/commandes', '/panier']

// Routes nécessitant un rôle spécifique
const ADMIN_ROUTES  = ['/admin']
const DRIVER_ROUTES = ['/driver', '/livreur']
const ADMIN_API     = ['/api/admin']

// Routes auth (redirige vers /menu si déjà connecté)
const AUTH_ROUTES   = ['/login', '/register', '/verify', '/email']

// Routes premium (/cuisine/:slug/premium)
const PREMIUM_PATTERN = /^\/cuisine\/[^/]+\/premium/

// ─── Rate limiters ───────────────────────────────────────────────────────────
// Graceful degradation : si Upstash n'est pas configuré, le rate limiting est désactivé.

const _redisUrl   = process.env.UPSTASH_REDIS_REST_URL
const _redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

const _redis = _redisUrl && _redisToken
  ? new Redis({ url: _redisUrl, token: _redisToken })
  : null

// Auth : 5 requêtes / 15 min
const rlAuth = _redis
  ? new Ratelimit({ redis: _redis, limiter: Ratelimit.slidingWindow(5, '15 m'), prefix: 'rl:auth' })
  : null

// Paiement : 10 requêtes / min
const rlPayment = _redis
  ? new Ratelimit({ redis: _redis, limiter: Ratelimit.slidingWindow(10, '60 s'), prefix: 'rl:pay' })
  : null

// API générale : 100 requêtes / min
const rlApi = _redis
  ? new Ratelimit({ redis: _redis, limiter: Ratelimit.slidingWindow(100, '60 s'), prefix: 'rl:api' })
  : null

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getClientIp(req: NextRequest): string {
  const cfIp = req.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp

  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]
    if (first) return first.trim()
  }

  return req.ip ?? 'unknown'
}

async function applyRateLimit(
  limiter: Ratelimit,
  key: string,
  response: NextResponse
): Promise<NextResponse | null> {
  try {
    const { success, limit, remaining, reset } = await limiter.limit(key)
    response.headers.set('X-RateLimit-Limit',     limit.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset',     reset.toString())

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessayez plus tard.', retryAfter },
        {
          status: 429,
          headers: { 'Retry-After': retryAfter.toString() },
        }
      )
    }
  } catch {
    // Redis indisponible — on continue sans rate limiting
  }
  return null
}

function logSuspicious(ip: string, pathname: string, ua: string, reason: string): void {
  console.warn(
    `[Security] Requête suspecte — raison="${reason}" ip=${ip} path=${pathname} ua="${ua}"`
  )
}

function redirectTo(url: string, req: NextRequest, returnUrl?: string): NextResponse {
  const dest = new URL(url, req.url)
  if (returnUrl) dest.searchParams.set('returnUrl', returnUrl)
  return NextResponse.redirect(dest)
}

// ─── Middleware principal ─────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl
  const ip = getClientIp(request)
  const ua = request.headers.get('user-agent') ?? ''

  // ── 1. Rate limiting ────────────────────────────────────────────────────────
  if (rlAuth && pathname.startsWith('/api/auth/')) {
    const blocked = await applyRateLimit(rlAuth, `auth:${ip}`, response)
    if (blocked) {
      logSuspicious(ip, pathname, ua, 'rate-limit-auth')
      return blocked
    }
  } else if (rlPayment && pathname.startsWith('/api/payment/')) {
    const blocked = await applyRateLimit(rlPayment, `pay:${ip}`, response)
    if (blocked) {
      logSuspicious(ip, pathname, ua, 'rate-limit-payment')
      return blocked
    }
  } else if (rlApi && pathname.startsWith('/api/')) {
    const blocked = await applyRateLimit(rlApi, `api:${ip}`, response)
    if (blocked) {
      logSuspicious(ip, pathname, ua, 'rate-limit-api')
      return blocked
    }
  }

  // ── 2. Session Supabase ─────────────────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const meta = (session?.user.app_metadata ?? {}) as Record<string, unknown>
  const role = (meta['role'] as string | undefined) ?? 'customer'

  // ── 3. Protection routes admin ──────────────────────────────────────────────
  const isAdminPath =
    ADMIN_ROUTES.some((r) => pathname.startsWith(r)) ||
    ADMIN_API.some((r) => pathname.startsWith(r))

  if (isAdminPath) {
    if (!session) {
      return redirectTo('/login', request, pathname)
    }
    if (role !== 'admin' && role !== 'super_admin') {
      logSuspicious(ip, pathname, ua, `admin-access-denied:role=${role}`)
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
  }

  // ── 4. Protection routes driver ─────────────────────────────────────────────
  const isDriverPath = DRIVER_ROUTES.some((r) => pathname.startsWith(r))
  if (isDriverPath) {
    if (!session) {
      return redirectTo('/login', request, pathname)
    }
    if (role !== 'driver' && role !== 'delivery_agent' && role !== 'admin' && role !== 'super_admin') {
      logSuspicious(ip, pathname, ua, `driver-access-denied:role=${role}`)
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // ── 5. Protection routes premium ────────────────────────────────────────────
  if (PREMIUM_PATTERN.test(pathname)) {
    if (!session) {
      return redirectTo('/login', request, pathname)
    }
    // Vérifie le flag premium dans app_metadata (mis à jour par le webhook paiement)
    const isPremium = meta['premium_active'] === true
    const premiumExpiry = meta['premium_expires_at'] as string | undefined
    const isExpired = premiumExpiry ? new Date(premiumExpiry) < new Date() : true

    if (!isPremium || isExpired) {
      // Redirige vers la page d'abonnement
      return NextResponse.redirect(new URL('/premium', request.url))
    }
  }

  // ── 6. Routes protégées (authentification requise) ──────────────────────────
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))
  if (isProtected && !session) {
    return redirectTo('/login', request, pathname)
  }

  // ── 7. Pages auth (redirige vers /menu si déjà connecté) ───────────────────
  const isAuthPage = AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/menu', request.url))
  }

  // ── 8. Détection patterns suspects ─────────────────────────────────────────
  const hasPathTraversal = pathname.includes('..')
  const hasInjection     = /[<>'"`;]/.test(decodeURIComponent(pathname))
  const hasLfiAttempt    = /etc\/passwd|proc\/self|\.env/i.test(pathname)
  const suspiciousAdmin  = pathname.toLowerCase().includes('admin') && !session

  if (hasPathTraversal) logSuspicious(ip, pathname, ua, 'path-traversal')
  if (hasInjection)     logSuspicious(ip, pathname, ua, 'injection-attempt')
  if (hasLfiAttempt)    logSuspicious(ip, pathname, ua, 'lfi-attempt')
  if (suspiciousAdmin)  logSuspicious(ip, pathname, ua, 'unauthenticated-admin-probe')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-).*)',
  ],
}
