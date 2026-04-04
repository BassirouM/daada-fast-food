/**
 * GET /api/ai/recommendations
 *
 * Retourne 4 plats recommandés personnalisés.
 *   - Connecté → basé sur l'historique + Claude AI
 *   - Non connecté → top populaires (fallback scoring)
 *
 * Sécurité :
 *   - Auth JWT optionnel (sans auth = recommandations anonymes)
 *   - Rate limit : 20 req/heure/user (ou IP si anonyme)
 *
 * Cache : réponse mise en cache Redis 30 min (géré par le service)
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getVerifiedPayload } from '@/services/auth/session'
import { checkRateLimit } from '@/lib/security/rateLimit'
import { getRecommendations } from '@/services/ai/recommendations'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Auth optionnelle
    let userId: string | null = null
    try {
      const payload = await getVerifiedPayload(req.headers.get('authorization'), req.cookies)
      if (payload?.sub) userId = payload.sub
    } catch {
      // Non connecté — OK
    }

    // Rate limit : par userId ou par IP
    const rlKey = userId
      ? `rl:ai:reco:${userId}`
      : `rl:ai:reco:ip:${req.headers.get('x-forwarded-for') ?? 'unknown'}`

    const rl = await checkRateLimit(rlKey, 20, 3600) // 20 req/heure
    if (!rl.ok) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }

    const { searchParams } = new URL(req.url)
    const quartier = searchParams.get('quartier') ?? undefined

    const context = quartier !== undefined ? { quartier } : {}
    const recommendations = await getRecommendations(userId, context)

    return NextResponse.json(
      { recommendations },
      {
        headers: {
          // SWR : revalidate toutes les 30 min
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
      }
    )
  } catch (err) {
    console.error('[GET /api/ai/recommendations]', err)
    return NextResponse.json({ recommendations: [] }, { status: 200 })
  }
}
