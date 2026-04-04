/**
 * Service IA — Upsell panier
 *
 * Analyse les articles dans le panier et suggère 2 plats complémentaires
 * via Claude claude-sonnet-4-20250514.
 *
 * Cache Redis TTL 10 min (clé basée sur le hash du panier).
 */

import Anthropic from '@anthropic-ai/sdk'
import { Redis } from '@upstash/redis'
import { createAdminClient } from '@/lib/supabase'
import type { CartItem } from '@/stores/cart.store'

// ─── Config ───────────────────────────────────────────────────────────────────

const CACHE_TTL_SEC = 10 * 60 // 10 min

const redis = (() => {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
})()

let _anthropic: Anthropic | null = null
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) throw new Error('ANTHROPIC_API_KEY non configuré')
    _anthropic = new Anthropic({ apiKey: key })
  }
  return _anthropic
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UpsellSuggestion {
  menuId:   string
  nom:      string
  prix:     number
  imageUrl: string | null
  reason:   string
}

// ─── Cart hash (cache key) ────────────────────────────────────────────────────

function cartHash(items: CartItem[]): string {
  return items
    .map((i) => `${i.menuItem.id}:${i.quantity}`)
    .sort()
    .join(',')
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

async function fallbackUpsell(cartItems: CartItem[]): Promise<UpsellSuggestion[]> {
  const admin = createAdminClient()
  const cartIds = cartItems.map((i) => i.menuItem.id)

  const { data } = await admin
    .from('menus')
    .select('id, nom, prix, image_url, categorie, nb_commandes')
    .eq('disponible', true)
    .not('id', 'in', `(${cartIds.map((id) => `'${id}'`).join(',')})`)
    .order('nb_commandes', { ascending: false })
    .limit(2)

  return ((data ?? []) as Array<{
    id: string; nom: string; prix: number
    image_url: string | null; categorie: string; nb_commandes: number
  }>).map((p) => ({
    menuId:   p.id,
    nom:      p.nom,
    prix:     p.prix,
    imageUrl: p.image_url,
    reason:   'Populaire avec ce menu 📈',
  }))
}

// ─── getUpsellSuggestions ─────────────────────────────────────────────────────

export async function getUpsellSuggestions(cartItems: CartItem[]): Promise<UpsellSuggestion[]> {
  if (!cartItems.length) return []

  const hash     = cartHash(cartItems)
  const cacheKey = `ai:upsell:${hash}`

  // Cache hit
  if (redis) {
    const cached = await redis.get<string>(cacheKey)
    if (cached) return JSON.parse(cached) as UpsellSuggestion[]
  }

  const admin  = createAdminClient()
  const cartIds = cartItems.map((i) => i.menuItem.id)

  // Charger les plats disponibles (hors panier)
  const { data: platsData } = await admin
    .from('menus')
    .select('id, nom, prix, image_url, categorie, nb_commandes')
    .eq('disponible', true)
    .not('id', 'in', `(${cartIds.map((id) => `'${id}'`).join(',')})`)
    .order('nb_commandes', { ascending: false })
    .limit(20)

  const plats = (platsData ?? []) as Array<{
    id: string; nom: string; prix: number
    image_url: string | null; categorie: string; nb_commandes: number
  }>

  if (!plats.length) return []

  const panierResume = cartItems.map((i) => ({
    nom:      i.menuItem.name,
    quantite: i.quantity,
    prix:     i.menuItem.price,
  }))

  const platsJson = plats.slice(0, 15).map((p) => ({
    id:   p.id,
    nom:  p.nom,
    cat:  p.categorie,
    comm: p.nb_commandes,
  }))

  let result: UpsellSuggestion[]

  try {
    const message = await getAnthropic().messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 256,
      system:     'Tu es le système de vente additionnelle de Daada Fast Food à Maroua, Cameroun. Analyse le panier et suggère 2 plats complémentaires. Réponds UNIQUEMENT en JSON valide : {"suggestions": [{"menuId": "string", "reason": "string"}]} Les raisons doivent être courtes (max 6 mots) et en français.',
      messages: [
        {
          role:    'user',
          content: `Panier actuel: ${JSON.stringify(panierResume)}\nPlats disponibles: ${JSON.stringify(platsJson)}\nQuels 2 plats complémentaires suggérer ?`,
        },
      ],
    })

    const raw   = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Réponse non JSON')

    const parsed = JSON.parse(match[0]) as {
      suggestions?: Array<{ menuId?: string; reason?: string }>
    }

    const platMap = new Map(plats.map((p) => [p.id, p]))

    result = (parsed.suggestions ?? [])
      .filter((s) => s.menuId && s.reason)
      .slice(0, 2)
      .map((s) => {
        const plat = platMap.get(s.menuId!)
        if (!plat) return null
        return {
          menuId:   plat.id,
          nom:      plat.nom,
          prix:     plat.prix,
          imageUrl: plat.image_url,
          reason:   s.reason!,
        }
      })
      .filter((s): s is UpsellSuggestion => s !== null)

    if (result.length < 2) {
      const fallback = await fallbackUpsell(cartItems)
      result = [...result, ...fallback].slice(0, 2)
    }
  } catch (err) {
    console.warn('[AI:upsell] Claude indisponible, fallback:', err instanceof Error ? err.message : err)
    result = await fallbackUpsell(cartItems)
  }

  if (redis && result.length) {
    await redis.set(cacheKey, JSON.stringify(result), { ex: CACHE_TTL_SEC })
  }

  return result
}
