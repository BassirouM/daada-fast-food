/**
 * GET /api/users/points
 * Retourne les points de fidélité, le niveau calculé automatiquement,
 * l'avantage actuel et la progression vers le prochain niveau.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getVerifiedPayload } from '@/services/auth/session'
import { getUser } from '@/lib/db/users'

// ─── Niveaux fidélité (spec Daada Points) ─────────────────────────────────────

type NiveauFideliteUI = 'bronze' | 'argent' | 'or' | 'diamant'

type NiveauInfo = {
  niveau: NiveauFideliteUI
  label: string
  emoji: string
  seuil: number
  prochainSeuil: number | null
  avantage: string
}

const NIVEAUX_CONFIG: NiveauInfo[] = [
  {
    niveau:        'bronze',
    label:         'Bronze',
    emoji:         '🥉',
    seuil:         0,
    prochainSeuil: 1000,
    avantage:      'Bienvenue chez Daada !',
  },
  {
    niveau:        'argent',
    label:         'Argent',
    emoji:         '🥈',
    seuil:         1000,
    prochainSeuil: 5000,
    avantage:      'Livraison -50%',
  },
  {
    niveau:        'or',
    label:         'Or',
    emoji:         '🥇',
    seuil:         5000,
    prochainSeuil: 10000,
    avantage:      'Livraison gratuite',
  },
  {
    niveau:        'diamant',
    label:         'Diamant',
    emoji:         '💎',
    seuil:         10000,
    prochainSeuil: null,
    avantage:      '-10% sur tout',
  },
]

function calculerNiveauUI(points: number): NiveauInfo {
  // Parcours du plus haut au plus bas pour retourner le premier niveau atteint
  for (let i = NIVEAUX_CONFIG.length - 1; i >= 0; i--) {
    const cfg = NIVEAUX_CONFIG[i]!
    if (points >= cfg.seuil) return cfg
  }
  return NIVEAUX_CONFIG[0]!
}

function calculerProgression(points: number, niveauInfo: NiveauInfo) {
  if (!niveauInfo.prochainSeuil) {
    return { pct: 100, restant: 0, prochainSeuil: null }
  }
  const range = niveauInfo.prochainSeuil - niveauInfo.seuil
  const done  = points - niveauInfo.seuil
  const pct   = Math.min(100, Math.round((done / range) * 100))
  return {
    pct,
    restant:      niveauInfo.prochainSeuil - points,
    prochainSeuil: niveauInfo.prochainSeuil,
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const payload    = await getVerifiedPayload(authHeader, request.cookies)

  if (!payload) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const user = await getUser(payload.sub)
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  const points     = user.points_fidelite
  const niveauInfo = calculerNiveauUI(points)
  const progression = calculerProgression(points, niveauInfo)

  const prochainIndex = NIVEAUX_CONFIG.findIndex((n) => n.niveau === niveauInfo.niveau) + 1
  const prochainNiveau = NIVEAUX_CONFIG[prochainIndex] ?? null

  return NextResponse.json({
    points,
    niveau:        niveauInfo.niveau,
    label:         niveauInfo.label,
    emoji:         niveauInfo.emoji,
    avantage:      niveauInfo.avantage,
    progression: {
      pct:              progression.pct,
      restant:          progression.restant,
      prochainSeuil:    progression.prochainSeuil,
      prochainNiveau:   prochainNiveau
        ? { niveau: prochainNiveau.niveau, label: prochainNiveau.label, emoji: prochainNiveau.emoji }
        : null,
    },
    regleGain: '1 point par 100 FCFA dépensés',
  })
}
