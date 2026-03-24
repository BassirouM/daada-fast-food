/**
 * POST /api/auth/refresh
 * Rotation du refresh token : génère un nouveau access token + refresh token.
 * Le refresh token doit être présent dans le cookie httpOnly daada-rt.
 *
 * Response: { accessToken: string, expiresAt: number }
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyRefreshToken } from '@/lib/auth/jwt'
import { refreshSession, getRefreshTokenFromRequest } from '@/services/auth/session'
import { getUser } from '@/lib/db/users'

export async function POST(request: NextRequest) {
  // Lire le refresh token depuis le cookie httpOnly
  const refreshToken = getRefreshTokenFromRequest(request.cookies)

  if (!refreshToken) {
    return NextResponse.json({ error: 'Refresh token manquant' }, { status: 401 })
  }

  // Vérifier la validité du refresh token
  const userId = await verifyRefreshToken(refreshToken)
  if (!userId) {
    return NextResponse.json({ error: 'Refresh token invalide ou expiré' }, { status: 401 })
  }

  // Récupérer l'utilisateur
  const user = await getUser(userId)
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  // Rotation des tokens
  const tempResponse = NextResponse.json({ placeholder: true })
  const session = await refreshSession(refreshToken, user, tempResponse)

  if (!session) {
    return NextResponse.json({ error: 'Impossible de rafraîchir la session' }, { status: 500 })
  }

  const jsonResponse = NextResponse.json({
    accessToken: session.accessToken,
    expiresAt: session.expiresAt,
  })

  // Copier les nouveaux cookies
  tempResponse.cookies.getAll().forEach(({ name, value, ...cookieOpts }) => {
    jsonResponse.cookies.set(name, value, cookieOpts)
  })

  return jsonResponse
}
