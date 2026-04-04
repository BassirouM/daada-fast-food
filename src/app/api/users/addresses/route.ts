/**
 * PATCH /api/users/addresses
 * Met à jour le tableau d'adresses sauvegardées de l'utilisateur.
 * Body : { adresses: AdresseSauvegardee[] }   (max 3 éléments)
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getVerifiedPayload } from '@/services/auth/session'
import { updateUser } from '@/lib/db/users'
import type { AdresseSauvegardee } from '@/types'

export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const payload    = await getVerifiedPayload(authHeader, request.cookies)

  if (!payload) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !Array.isArray((body as Record<string, unknown>).adresses)
  ) {
    return NextResponse.json(
      { error: 'Le champ "adresses" (tableau) est requis.' },
      { status: 400 }
    )
  }

  const adresses = (body as { adresses: unknown[] }).adresses

  if (adresses.length > 3) {
    return NextResponse.json(
      { error: 'Maximum 3 adresses autorisées.' },
      { status: 400 }
    )
  }

  // Validation légère de chaque adresse
  for (const addr of adresses) {
    if (
      typeof addr !== 'object' || addr === null ||
      typeof (addr as Record<string, unknown>).label !== 'string' ||
      typeof (addr as Record<string, unknown>).quartier !== 'string' ||
      typeof (addr as Record<string, unknown>).adresse_complete !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Format d\'adresse invalide. Requis : label, quartier, adresse_complete.' },
        { status: 400 }
      )
    }
  }

  const updated = await updateUser(payload.sub, {
    adresses_sauvegardees: adresses as AdresseSauvegardee[],
  })

  if (!updated) {
    return NextResponse.json({ error: 'Mise à jour échouée' }, { status: 500 })
  }

  return NextResponse.json({ adresses: updated.adresses_sauvegardees })
}
