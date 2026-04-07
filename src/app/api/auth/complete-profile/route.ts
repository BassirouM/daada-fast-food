/**
 * POST /api/auth/complete-profile
 *
 * Finalise la création de compte après vérification OTP.
 * Reçoit le tempToken (phone vérifié) + prénom + nom.
 *
 * Body : { tempToken: string, firstName: string, lastName: string, referralCode?: string }
 * Response : { accessToken, expiresAt, user }
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { verifyTempToken } from '@/lib/auth/jwt'
import { createSession } from '@/services/auth/session'
import { createAdminClient } from '@/lib/supabase'
import { getUserByTelephone } from '@/lib/db/users'
import type { UserDB } from '@/types'
import { safeValidate } from '@/lib/security/validation'

// ─── Schéma ───────────────────────────────────────────────────────────────────

const completeProfileSchema = z.object({
  tempToken: z.string().min(10),
  firstName: z.string().trim().min(1, 'Le prénom est requis').max(50),
  lastName:  z.string().trim().min(1, 'Le nom est requis').max(50),
  referralCode: z.string().trim().toUpperCase().length(6).optional().or(z.literal('')),
})

// ─── Génération referral_code unique ─────────────────────────────────────────

const REFERRAL_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'   // sans I, O, 0, 1

function generateReferralCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += REFERRAL_CHARS[Math.floor(Math.random() * REFERRAL_CHARS.length)]
  }
  return code
}

async function uniqueReferralCode(adminClient: ReturnType<typeof createAdminClient>): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateReferralCode()
    const { data } = await adminClient
      .from('users')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle()
    if (!data) return code
  }
  // Fallback ultra-rare : préfixe timestamp
  return `D${Date.now().toString(36).toUpperCase().slice(-5)}`
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 })
  }

  const { data, error } = safeValidate(completeProfileSchema, body)
  if (error) {
    return NextResponse.json(
      { error: 'Données invalides', details: error.flatten() },
      { status: 400 }
    )
  }

  // ── Vérifier le tempToken ─────────────────────────────────────────────────

  const tempPayload = await verifyTempToken(data.tempToken)
  if (!tempPayload) {
    return NextResponse.json(
      { error: 'Lien de vérification invalide ou expiré. Recommencez la connexion.' },
      { status: 401 }
    )
  }

  const { telephone } = tempPayload

  // ── Vérifier que l'utilisateur n'existe pas déjà ─────────────────────────

  const existing = await getUserByTelephone(telephone)
  if (existing) {
    // L'utilisateur a déjà complété son profil (double-submit)
    // On lui renvoie une session valide sans erreur
    const tempResp = NextResponse.json({ placeholder: true })
    const session  = await createSession(existing, tempResp)
    const json = NextResponse.json({ user: existing, accessToken: session.accessToken, expiresAt: session.expiresAt })
    tempResp.cookies.getAll().forEach(({ name, value, ...opts }) => json.cookies.set(name, value, opts))
    return json
  }

  // ── Créer l'utilisateur dans Supabase ────────────────────────────────────

  const adminClient   = createAdminClient()
  const referralCode  = await uniqueReferralCode(adminClient)
  const nom           = `${data.firstName} ${data.lastName}`.trim()

  // 1. Créer l'auth user (phone sans "+")
  const telephoneSansPlus = telephone.replace('+', '')
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    phone:         telephoneSansPlus,
    phone_confirm: true,
  })

  let authUserId: string

  if (authError || !authData.user) {
    // Auth user peut déjà exister (race condition) — chercher par téléphone
    const { data: listData } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
    const found = listData?.users?.find(
      (u) => u.phone === telephone || u.phone === telephoneSansPlus
    )
    if (!found) {
      console.error('[complete-profile] Impossible de créer auth.user :', authError)
      return NextResponse.json({ error: 'Erreur lors de la création du compte.' }, { status: 500 })
    }
    authUserId = found.id
  } else {
    authUserId = authData.user.id
  }

  // 2. Créer le profil public.users
  const insertData: Record<string, unknown> = {
    id:           authUserId,
    telephone,
    nom,
    prenom:       data.firstName,
    nom_famille:  data.lastName,
    role:         'customer',
    referral_code: referralCode,
  }

  // Appliquer le code parrain s'il est fourni
  if (data.referralCode && data.referralCode.length === 6) {
    const { data: parrain } = await adminClient
      .from('users')
      .select('id')
      .eq('referral_code', data.referralCode)
      .maybeSingle()
    if (parrain) {
      insertData['referred_by'] = parrain.id
    }
  }

  const { data: newUser, error: insertError } = await adminClient
    .from('users')
    .insert(insertData)
    .select()
    .single()

  if (insertError || !newUser) {
    console.error('[complete-profile] INSERT public.users:', insertError)
    return NextResponse.json({ error: 'Erreur lors de la création du profil.' }, { status: 500 })
  }

  const user = newUser as UserDB

  console.log(`[complete-profile] Profil créé : ${authUserId} (${telephone}) referral=${referralCode}`)

  // ── Créer la session ──────────────────────────────────────────────────────

  const tempResp = NextResponse.json({ placeholder: true })
  const session  = await createSession(user, tempResp)

  const json = NextResponse.json(
    { user, accessToken: session.accessToken, expiresAt: session.expiresAt },
    { status: 201 }
  )
  tempResp.cookies.getAll().forEach(({ name, value, ...opts }) => json.cookies.set(name, value, opts))
  return json
}
