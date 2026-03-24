/**
 * POST /api/auth/verify-otp
 * Vérifie le code OTP et crée/récupère l'utilisateur.
 * Génère access + refresh tokens et pose les cookies httpOnly.
 *
 * Body    : { telephone: string, code: string }
 * Response: { user: UserDB, accessToken: string, expiresAt: number, isNewUser: boolean }
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyOtpViaTwilio } from '@/services/auth/twilio'
import { createSession } from '@/services/auth/session'
import { getUserByTelephone, createUser } from '@/lib/db/users'
import { createAdminClient } from '@/lib/supabase'
import { safeValidate, otpSchema, normalizeTelephone } from '@/lib/security/validation'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 })
  }

  // Validation
  const { data, error } = safeValidate(otpSchema, body)
  if (error) {
    return NextResponse.json(
      { error: 'Données invalides', details: error.flatten() },
      { status: 400 }
    )
  }

  const telephone = normalizeTelephone(data.telephone)

  // Vérification OTP via Twilio
  const otpResult = await verifyOtpViaTwilio(telephone, data.code)
  if (!otpResult.success) {
    const status = otpResult.status === 'expired' ? 410 : 401
    return NextResponse.json({ error: otpResult.error }, { status })
  }

  // Récupérer ou créer l'utilisateur
  const response = NextResponse.json({}) // sera remplacé
  let user = await getUserByTelephone(telephone)
  let isNewUser = false

  if (!user) {
    isNewUser = true
    // Créer un utilisateur Supabase Auth (pour respecter la FK users.id → auth.users.id)
    const adminClient = createAdminClient()
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      phone: telephone,
      phone_confirm: true,
    })

    if (authError || !authData.user) {
      console.error('[verify-otp] Erreur création auth.users :', authError)
      return NextResponse.json(
        { error: 'Impossible de créer le compte. Réessayez.' },
        { status: 500 }
      )
    }

    const nom = `Client ${telephone.slice(-4)}`
    user = await createUser({
      id: authData.user.id,
      telephone,
      nom,
    })

    if (!user) {
      console.error('[verify-otp] Erreur création public.users pour id:', authData.user.id)
      return NextResponse.json(
        { error: 'Erreur lors de la création du profil.' },
        { status: 500 }
      )
    }
  }

  // Créer session JWT + cookies
  const finalResponse = NextResponse.json({ placeholder: true })
  const session = await createSession(user, finalResponse)

  // Construire la vraie réponse avec le body correct
  const responseBody = {
    user,
    accessToken: session.accessToken,
    expiresAt: session.expiresAt,
    isNewUser,
  }

  const jsonResponse = NextResponse.json(responseBody, { status: isNewUser ? 201 : 200 })

  // Copier les cookies de finalResponse vers jsonResponse
  finalResponse.cookies.getAll().forEach(({ name, value, ...cookieOpts }) => {
    jsonResponse.cookies.set(name, value, cookieOpts)
  })

  return jsonResponse
}
