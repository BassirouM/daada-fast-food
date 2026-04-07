/**
 * POST /api/auth/email/login
 *
 * Connexion email + mot de passe.
 * - Vérifie les credentials via Supabase Auth
 * - Génère les tokens JWT Daada
 *
 * Body    : { email, password }
 * Response: { user, accessToken, expiresAt }
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { createSession } from '@/services/auth/session'
import { getUser } from '@/lib/db/users'
import type { UserDB } from '@/types'
import { safeValidate } from '@/lib/security/validation'

// ─── Schéma ───────────────────────────────────────────────────────────────────

const emailLoginSchema = z.object({
  email:    z.string().trim().email('Email invalide').max(254),
  password: z.string().min(1).max(128),
})

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 })
  }

  const { data, error } = safeValidate(emailLoginSchema, body)
  if (error) {
    return NextResponse.json({ error: 'Données invalides', details: error.flatten() }, { status: 400 })
  }

  // ── Vérification credentials via Supabase Auth ────────────────────────────
  // On utilise le client anon pour signInWithPassword (vérifie email+password)

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )

  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email:    data.email.toLowerCase(),
    password: data.password,
  })

  if (signInError || !signInData.user) {
    // Message générique pour éviter l'énumération de comptes
    return NextResponse.json(
      { error: 'Email ou mot de passe incorrect.' },
      { status: 401 }
    )
  }

  const authUserId = signInData.user.id

  // ── Récupérer le profil public.users ─────────────────────────────────────

  let user = await getUser(authUserId)

  if (!user) {
    // Profil manquant (compte créé via Supabase Dashboard, etc.) → créer
    const admin = createAdminClient()
    const nom   = signInData.user.email?.split('@')[0] ?? 'Utilisateur'

    const { data: newProfile, error: insertError } = await admin
      .from('users')
      .insert({
        id:    authUserId,
        email: data.email.toLowerCase(),
        nom,
        role:  'customer',
      })
      .select()
      .single()

    if (insertError || !newProfile) {
      console.error('[email/login] INSERT profil manquant:', insertError)
      return NextResponse.json({ error: 'Erreur serveur. Réessayez.' }, { status: 500 })
    }
    user = newProfile as UserDB
  }

  console.log(`[email/login] Connexion réussie : ${authUserId} (${data.email})`)

  // ── Session ───────────────────────────────────────────────────────────────

  const tempResp = NextResponse.json({ placeholder: true })
  const session  = await createSession(user, tempResp)
  const json = NextResponse.json({ user, accessToken: session.accessToken, expiresAt: session.expiresAt })
  tempResp.cookies.getAll().forEach(({ name, value, ...opts }) => json.cookies.set(name, value, opts))
  return json
}
