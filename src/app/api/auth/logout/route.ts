/**
 * POST /api/auth/logout
 * Révoque l'access token (blacklist Redis) et efface les cookies.
 *
 * Response: { success: true }
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { terminateSession, getAccessTokenFromRequest } from '@/services/auth/session'

export async function POST(request: NextRequest) {
  const accessToken = getAccessTokenFromRequest(request.cookies)

  const tempResponse = NextResponse.json({ placeholder: true })
  await terminateSession(accessToken, tempResponse)

  const jsonResponse = NextResponse.json({ success: true })

  // Copier les cookies effacés
  tempResponse.cookies.getAll().forEach(({ name, value, ...cookieOpts }) => {
    jsonResponse.cookies.set(name, value, cookieOpts)
  })

  return jsonResponse
}
