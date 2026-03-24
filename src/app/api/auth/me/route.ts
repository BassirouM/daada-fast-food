/**
 * GET /api/auth/me
 * Retourne le profil de l'utilisateur authentifié.
 * Accepte Authorization: Bearer <token> ou cookie httpOnly daada-at.
 *
 * Response: { user: UserDB, expiresAt: number }
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getVerifiedPayload } from '@/services/auth/session'
import { getUser } from '@/lib/db/users'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const payload = await getVerifiedPayload(authHeader, request.cookies)

  if (!payload) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const user = await getUser(payload.sub)
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  return NextResponse.json({
    user,
    expiresAt: payload.exp,
  })
}
