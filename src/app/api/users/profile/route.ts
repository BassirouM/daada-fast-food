/**
 * PATCH /api/users/profile
 * Met à jour le profil de l'utilisateur authentifié.
 * Accepte : { nom?, quartier?, avatar_url?, fcm_token? }
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getVerifiedPayload } from '@/services/auth/session'
import { updateUser } from '@/lib/db/users'
import { updateProfilSchema, safeValidate } from '@/lib/security/validation'

export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const payload = await getVerifiedPayload(authHeader, request.cookies)

  if (!payload) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de la requête invalide' }, { status: 400 })
  }

  const { data, error } = safeValidate(updateProfilSchema, body)
  if (error) {
    return NextResponse.json({ error: error.flatten() }, { status: 400 })
  }

  // avatar_url n'est pas dans updateProfilSchema (pas de regex Zod) — on l'accepte séparément
  const avatar_url =
    typeof (body as Record<string, unknown>).avatar_url === 'string'
      ? ((body as Record<string, unknown>).avatar_url as string)
      : undefined

  const updateInput: Parameters<typeof updateUser>[1] = {}
  if (data.nom !== undefined) updateInput.nom = data.nom
  if (data.quartier !== undefined) updateInput.quartier = data.quartier
  if (data.fcm_token !== undefined) updateInput.fcm_token = data.fcm_token
  if (avatar_url !== undefined) updateInput.avatar_url = avatar_url

  const updated = await updateUser(payload.sub, updateInput)

  if (!updated) {
    return NextResponse.json({ error: 'Mise à jour échouée' }, { status: 500 })
  }

  return NextResponse.json({ user: updated })
}
