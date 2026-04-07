/**
 * POST /api/auth/email/register
 *
 * Inscription email + mot de passe.
 * - Valide email + password (min 8 chars)
 * - Crée l'utilisateur via Supabase Auth (stockage sécurisé du mot de passe)
 * - Crée le profil dans public.users
 * - Génère les tokens JWT Daada
 *
 * Body    : { email, password, firstName, lastName, referralCode? }
 * Response: { user, accessToken, expiresAt }
 */

export const runtime = 'nodejs'   // bcryptjs requires Node.js runtime

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { createSession } from '@/services/auth/session'
import type { UserDB } from '@/types'
import { safeValidate } from '@/lib/security/validation'

// ─── Schéma ───────────────────────────────────────────────────────────────────

const emailRegisterSchema = z.object({
  email:       z.string().trim().email('Email invalide').max(254),
  password:    z.string().min(8, 'Mot de passe minimum 8 caractères').max(128),
  firstName:   z.string().trim().min(1).max(50),
  lastName:    z.string().trim().min(1).max(50),
  referralCode: z.string().trim().toUpperCase().length(6).optional().or(z.literal('')),
})

// ─── Génération referral_code ─────────────────────────────────────────────────

const REFERRAL_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateReferralCode(): string {
  return Array.from({ length: 6 }, () =>
    REFERRAL_CHARS[Math.floor(Math.random() * REFERRAL_CHARS.length)]
  ).join('')
}

async function uniqueReferralCode(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateReferralCode()
    const { data } = await admin.from('users').select('id').eq('referral_code', code).maybeSingle()
    if (!data) return code
  }
  return `D${Date.now().toString(36).toUpperCase().slice(-5)}`
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 })
  }

  const { data, error } = safeValidate(emailRegisterSchema, body)
  if (error) {
    return NextResponse.json({ error: 'Données invalides', details: error.flatten() }, { status: 400 })
  }

  const admin = createAdminClient()

  // ── Vérifier doublon email ────────────────────────────────────────────────

  const { data: existing } = await admin
    .from('users')
    .select('id')
    .eq('email', data.email.toLowerCase())
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 409 })
  }

  // ── Hasher le mot de passe (bcrypt, salt 12) ──────────────────────────────
  // Supabase Auth hash aussi en interne ; notre hash est une couche de validation
  // supplémentaire stockée séparément si besoin d'un flow custom.
  const passwordHash = await bcrypt.hash(data.password, 12)

  // ── Créer l'auth user Supabase ────────────────────────────────────────────

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email:            data.email.toLowerCase(),
    password:         data.password,
    email_confirm:    true,
  })

  if (authError || !authData.user) {
    console.error('[email/register] createUser:', authError)
    if (authError?.message?.includes('already registered')) {
      return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erreur lors de la création du compte.' }, { status: 500 })
  }

  const authUserId   = authData.user.id
  const referralCode = await uniqueReferralCode(admin)
  const nom          = `${data.firstName} ${data.lastName}`.trim()

  // ── Appliquer le code parrain ─────────────────────────────────────────────

  let referredBy: string | undefined
  if (data.referralCode) {
    const { data: parrain } = await admin
      .from('users').select('id').eq('referral_code', data.referralCode).maybeSingle()
    if (parrain) referredBy = parrain.id
  }

  // ── Créer le profil public.users ──────────────────────────────────────────

  const insertData: Record<string, unknown> = {
    id:            authUserId,
    email:         data.email.toLowerCase(),
    nom,
    prenom:        data.firstName,
    nom_famille:   data.lastName,
    role:          'customer',
    referral_code: referralCode,
    password_hash: passwordHash,   // sauvegardé pour audit / migration future
  }
  if (referredBy) insertData['referred_by'] = referredBy

  const { data: newUser, error: insertError } = await admin
    .from('users').insert(insertData).select().single()

  if (insertError || !newUser) {
    console.error('[email/register] INSERT:', insertError)
    // Rollback : supprimer l'auth user
    await admin.auth.admin.deleteUser(authUserId)
    return NextResponse.json({ error: 'Erreur lors de la création du profil.' }, { status: 500 })
  }

  const user = newUser as UserDB
  console.log(`[email/register] Compte créé : ${authUserId} (${data.email}) referral=${referralCode}`)

  // ── Session ───────────────────────────────────────────────────────────────

  const tempResp = NextResponse.json({ placeholder: true })
  const session  = await createSession(user, tempResp)
  const json = NextResponse.json({ user, accessToken: session.accessToken, expiresAt: session.expiresAt }, { status: 201 })
  tempResp.cookies.getAll().forEach(({ name, value, ...opts }) => json.cookies.set(name, value, opts))
  return json
}
