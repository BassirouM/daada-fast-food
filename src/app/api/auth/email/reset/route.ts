/**
 * POST /api/auth/email/reset
 *
 * Déclenche l'envoi d'un email de réinitialisation de mot de passe via Supabase Auth.
 *
 * Body    : { email }
 * Response: { success: true } — toujours 200 (évite l'énumération de comptes)
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { safeValidate } from '@/lib/security/validation'

const resetSchema = z.object({
  email: z.string().trim().email('Email invalide').max(254),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 })
  }

  const { data, error } = safeValidate(resetSchema, body)
  if (error) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
  }

  // Déclenchement silencieux — on ne révèle pas si l'email existe
  try {
    const admin = createAdminClient()
    await admin.auth.resetPasswordForEmail(data.email.toLowerCase(), {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth/reset-password`,
    })
    console.log(`[email/reset] Email de reset envoyé à ${data.email}`)
  } catch (err) {
    console.error('[email/reset] Erreur:', err)
    // On répond toujours success pour éviter l'énumération
  }

  return NextResponse.json({ success: true })
}
