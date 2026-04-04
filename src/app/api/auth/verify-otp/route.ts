/**
 * POST /api/auth/verify-otp
 * Vérifie le code OTP et crée/récupère l'utilisateur.
 * Génère access + refresh tokens et pose les cookies httpOnly.
 *
 * Body    : { telephone: string, code: string }
 * Response: { user: UserDB, accessToken: string, expiresAt: number, isNewUser: boolean }
 *
 * NOTE : toutes les opérations public.users utilisent adminClient (service role)
 * pour contourner la RLS (auth.uid() = NULL côté serveur avec le client anon).
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyOtpViaTwilio, isTestMode } from '@/services/auth/twilio'
import { createSession } from '@/services/auth/session'
import { createAdminClient } from '@/lib/supabase'
import type { UserDB } from '@/types'
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

  // Court-circuit test : isTestMode() + code "123456" → valide sans appel Twilio
  if (isTestMode() && data.code === '123456') {
    console.log(`[verify-otp] MODE TEST - OTP accepté pour "${telephone}" sans appel Twilio`)
  }

  // Vérification OTP via Twilio (ou mode test intégré dans twilio.ts)
  const otpResult = await verifyOtpViaTwilio(telephone, data.code)
  if (!otpResult.success) {
    const status = otpResult.status === 'expired' ? 410 : 401
    return NextResponse.json({ error: otpResult.error }, { status })
  }

  // ── adminClient pour tous les accès DB (contourne RLS) ────────────────────
  const adminClient = createAdminClient()

  // ── Étape 1 : chercher dans public.users par téléphone (avec ET sans "+") ─
  const avecPlus = telephone.startsWith('+') ? telephone : `+${telephone}`
  const sansPlus = telephone.startsWith('+') ? telephone.slice(1) : telephone

  const { data: d1 } = await adminClient.from('users').select('*').eq('telephone', avecPlus).maybeSingle()
  const { data: d2 } = d1 ? { data: null } : await adminClient.from('users').select('*').eq('telephone', sansPlus).maybeSingle()

  let user = (d1 ?? d2) as UserDB | null
  let isNewUser = false

  if (!user) {
    isNewUser = true
    const telephoneSansPlus = telephone.replace('+', '')

    // ── Étape 2 : résoudre l'auth user (existant ou nouveau) ──────────────
    let authUserId: string

    // Supabase auth attend le numéro sans "+" (format "237697580863")
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      phone: telephoneSansPlus,
      phone_confirm: true,
    })

    if (authError || !authData.user) {
      console.warn(`[verify-otp] createUser auth.users échoué (${authError?.message}), recherche user existant…`)

      const { data: listData } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
      const existingAuth = listData?.users?.find(
        (u) => u.phone === telephone || u.phone === telephoneSansPlus
      )

      if (!existingAuth) {
        console.error('[verify-otp] auth user introuvable après échec création :', authError)
        return NextResponse.json(
          { error: 'Impossible de créer le compte. Réessayez.' },
          { status: 500 }
        )
      }

      authUserId = existingAuth.id
      console.log(`[verify-otp] auth user existant récupéré : ${authUserId}`)
    } else {
      authUserId = authData.user.id
      console.log(`[verify-otp] auth user créé : ${authUserId}`)
    }

    // ── Étape 3 : vérifier si public.users contient déjà ce profil ────────
    const { data: existingProfile } = await adminClient
      .from('users')
      .select('*')
      .eq('id', authUserId)
      .maybeSingle()

    if (existingProfile) {
      user = existingProfile as UserDB
      isNewUser = false
      console.log(`[verify-otp] profil public.users existant récupéré : ${authUserId}`)
    } else {
      // ── Étape 4 : créer le profil dans public.users ──────────────────
      const nom = `Client ${telephone.slice(-4)}`

      console.log('[verify-otp] Tentative création profil:', {
        id: authUserId,
        telephone,
        nom,
        quartier: undefined,
      })

      const { data: newUser, error: insertError } = await adminClient
        .from('users')
        .insert({ id: authUserId, telephone, nom })
        .select()
        .single()

      if (insertError || !newUser) {
        console.error('[verify-otp] Erreur INSERT public.users:', {
          code:    insertError?.code,
          message: insertError?.message,
          details: insertError?.details,
          hint:    insertError?.hint,
        })
        return NextResponse.json(
          { error: 'Erreur lors de la création du profil.' },
          { status: 500 }
        )
      }

      user = newUser as UserDB
      console.log(`[verify-otp] profil public.users créé : ${authUserId}`)
    }
  }

  // ── Créer session JWT + cookies ──────────────────────────────────────────
  const finalResponse = NextResponse.json({ placeholder: true })
  const session = await createSession(user, finalResponse)

  const responseBody = {
    user,
    accessToken: session.accessToken,
    expiresAt: session.expiresAt,
    isNewUser,
  }

  const jsonResponse = NextResponse.json(responseBody, { status: isNewUser ? 201 : 200 })

  finalResponse.cookies.getAll().forEach(({ name, value, ...cookieOpts }) => {
    jsonResponse.cookies.set(name, value, cookieOpts)
  })

  return jsonResponse
}

