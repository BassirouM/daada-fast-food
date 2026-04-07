/**
 * POST /api/auth/verify-otp
 *
 * Vérifie le code OTP via Twilio Verify.
 * - Max 3 tentatives par OTP (compteur Redis, TTL 10 min)
 * - Utilisateur existant : {accessToken, expiresAt, user, isNew: false}
 * - Nouvel utilisateur   : {isNew: true, requiresProfile: true, tempToken}
 *
 * Body : { telephone: string, code: string }
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'
import { verifyOtpViaTwilio, isTestMode } from '@/services/auth/twilio'
import { createSession } from '@/services/auth/session'
import { generateTempToken } from '@/lib/auth/jwt'
import { getUserByTelephone } from '@/lib/db/users'
import { safeValidate, otpSchema, normalizeTelephone } from '@/lib/security/validation'

// ─── Redis — compteur de tentatives ──────────────────────────────────────────

const _redis = (() => {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
})()

const MAX_ATTEMPTS    = 3
const ATTEMPT_TTL_SEC = 10 * 60   // 10 minutes (durée de vie de l'OTP)

async function getAttempts(telephone: string): Promise<number> {
  if (!_redis) return 0
  try {
    const val = await _redis.get<number>(`otp:attempts:${telephone}`)
    return val ?? 0
  } catch { return 0 }
}

async function incrementAttempts(telephone: string): Promise<number> {
  if (!_redis) return 1
  try {
    const key   = `otp:attempts:${telephone}`
    const count = await _redis.incr(key)
    if (count === 1) await _redis.expire(key, ATTEMPT_TTL_SEC)
    return count
  } catch { return 1 }
}

async function clearAttempts(telephone: string): Promise<void> {
  if (!_redis) return
  try { await _redis.del(`otp:attempts:${telephone}`) } catch {}
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 })
  }

  const { data, error } = safeValidate(otpSchema, body)
  if (error) {
    return NextResponse.json(
      { error: 'Données invalides', details: error.flatten() },
      { status: 400 }
    )
  }

  const telephone = normalizeTelephone(data.telephone)

  // ── Vérification du compteur de tentatives ────────────────────────────────

  const attempts = await getAttempts(telephone)
  if (attempts >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Demandez un nouveau code SMS.' },
      { status: 429 }
    )
  }

  // ── Vérification OTP Twilio ───────────────────────────────────────────────

  if (isTestMode() && data.code === '123456') {
    console.log(`[verify-otp] MODE TEST — OTP accepté pour "${telephone}"`)
  }

  const otpResult = await verifyOtpViaTwilio(telephone, data.code)

  if (!otpResult.success) {
    const count     = await incrementAttempts(telephone)
    const remaining = Math.max(0, MAX_ATTEMPTS - count)
    const httpStatus = otpResult.status === 'expired' ? 410 : 401

    return NextResponse.json(
      { error: otpResult.error, remaining },
      { status: httpStatus }
    )
  }

  // OTP valide — réinitialiser le compteur
  await clearAttempts(telephone)

  // ── Chercher l'utilisateur existant ──────────────────────────────────────

  const existingUser = await getUserByTelephone(telephone)

  // ── Utilisateur existant → session complète ───────────────────────────────

  if (existingUser) {
    const tempResp = NextResponse.json({ placeholder: true })
    const session  = await createSession(existingUser, tempResp)

    const json = NextResponse.json({
      user:        existingUser,
      accessToken: session.accessToken,
      expiresAt:   session.expiresAt,
      isNew:       false,
    })
    tempResp.cookies.getAll().forEach(({ name, value, ...opts }) =>
      json.cookies.set(name, value, opts)
    )
    return json
  }

  // ── Nouvel utilisateur → tempToken (profil requis) ────────────────────────

  const tempToken = await generateTempToken(telephone)

  console.log(`[verify-otp] Nouvel utilisateur détecté pour "${telephone}" → tempToken émis`)

  return NextResponse.json({
    isNew:           true,
    requiresProfile: true,
    tempToken,
  })
}
