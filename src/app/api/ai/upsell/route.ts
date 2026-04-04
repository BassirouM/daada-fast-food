/**
 * POST /api/ai/upsell
 *
 * Retourne 2 suggestions de plats complémentaires pour un panier donné.
 *
 * Body : { cartItems: CartItem[] }
 *
 * Sécurité :
 *   - Auth JWT optionnel
 *   - Rate limit : 30 req/heure/user
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getVerifiedPayload } from '@/services/auth/session'
import { checkRateLimit } from '@/lib/security/rateLimit'
import { getUpsellSuggestions } from '@/services/ai/upsell'
import type { CartItem } from '@/stores/cart.store'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Auth optionnelle
    let userId: string | null = null
    try {
      const payload = await getVerifiedPayload(req.headers.get('authorization'), req.cookies)
      if (payload?.sub) userId = payload.sub
    } catch {
      // Non connecté
    }

    const rlKey = userId
      ? `rl:ai:upsell:${userId}`
      : `rl:ai:upsell:ip:${req.headers.get('x-forwarded-for') ?? 'unknown'}`

    const rl = await checkRateLimit(rlKey, 30, 3600) // 30 req/heure
    if (!rl.ok) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }

    const body = await req.json() as { cartItems?: CartItem[] }

    if (!Array.isArray(body.cartItems) || body.cartItems.length === 0) {
      return NextResponse.json({ suggestions: [] })
    }

    // Limiter à 20 articles max (sécurité)
    const cartItems = body.cartItems.slice(0, 20)

    const suggestions = await getUpsellSuggestions(cartItems)

    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('[POST /api/ai/upsell]', err)
    return NextResponse.json({ suggestions: [] }, { status: 200 })
  }
}
