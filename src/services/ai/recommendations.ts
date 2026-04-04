/**
 * Service IA — Recommandations personnalisées
 *
 * Utilise Claude claude-sonnet-4-20250514 pour analyser l'historique de commandes
 * et recommander 4 plats avec une raison courte.
 *
 * Fallback scoring si l'API est indisponible :
 *   score = nb_commandes × 0.4 + note_moyenne × 0.3 + récence × 0.3
 *   + boost catégories préférées
 */

import Anthropic from '@anthropic-ai/sdk'
import { Redis } from '@upstash/redis'
import { createAdminClient } from '@/lib/supabase'

// ─── Config ───────────────────────────────────────────────────────────────────

const CACHE_TTL_SEC = 30 * 60 // 30 min

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

export interface Recommendation {
  menuId:   string
  nom:      string
  prix:     number
  imageUrl: string | null
  reason:   string
}

export interface RecommendationContext {
  quartier?: string
}

interface PlatRow {
  id:          string
  nom:         string
  prix:        number
  image_url:   string | null
  categorie:   string
  nb_commandes: number
  note_moyenne: number
  created_at:  string
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────

async function fetchHistorique(userId: string): Promise<Array<{
  articles: Array<{ nom: string; categorie: string }>
  created_at: string
}>> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('commandes')
    .select(`
      created_at,
      commande_articles(
        menus(nom, categorie)
      )
    `)
    .eq('client_id', userId)
    .in('statut', ['delivered', 'picked_up'])
    .order('created_at', { ascending: false })
    .limit(10)

  if (!data) return []

  return (data as unknown as Array<{
    created_at: string
    commande_articles: Array<{ menus: { nom: string; categorie: string } | null }>
  }>).map((c) => ({
    created_at: c.created_at,
    articles: c.commande_articles
      .filter((a) => a.menus != null)
      .map((a) => ({ nom: a.menus!.nom, categorie: a.menus!.categorie })),
  }))
}

async function fetchPlatsDisponibles(): Promise<PlatRow[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('menus')
    .select('id, nom, prix, image_url, categorie, nb_commandes, note_moyenne, created_at')
    .eq('disponible', true)
    .order('nb_commandes', { ascending: false })
    .limit(40)

  return (data ?? []) as PlatRow[]
}

// ─── Fallback scoring ─────────────────────────────────────────────────────────

function fallbackRecommendations(
  plats: PlatRow[],
  historique: Array<{ articles: Array<{ nom: string; categorie: string }>; created_at: string }>,
): Recommendation[] {
  // Identifier les catégories préférées
  const catCount: Record<string, number> = {}
  for (const commande of historique) {
    for (const article of commande.articles) {
      catCount[article.categorie] = (catCount[article.categorie] ?? 0) + 1
    }
  }
  const topCats = Object.entries(catCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([cat]) => cat)

  // Scoring
  const now     = Date.now()
  const maxComm = Math.max(...plats.map((p) => p.nb_commandes), 1)
  const maxNote = 5

  const scored = plats.map((p) => {
    const ageDays = (now - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)
    const recence = Math.max(0, 1 - ageDays / 90) // 0→1 (plus récent = plus haut)

    let score =
      (p.nb_commandes / maxComm) * 0.4 +
      (p.note_moyenne / maxNote) * 0.3 +
      recence * 0.3

    // Boost catégorie préférée
    if (topCats.includes(p.categorie)) score += 0.25

    return { plat: p, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ plat }) => ({
      menuId:   plat.id,
      nom:      plat.nom,
      prix:     plat.prix,
      imageUrl: plat.image_url,
      reason:   topCats.includes(plat.categorie) ? 'Votre catégorie préférée 🔥' : 'Populaire ce soir 📈',
    }))
}

// ─── Claude recommendation ────────────────────────────────────────────────────

async function claudeRecommendations(
  plats: PlatRow[],
  historique: Array<{ articles: Array<{ nom: string; categorie: string }>; created_at: string }>,
): Promise<Array<{ menuId: string; reason: string }>> {
  const heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Douala' })

  const platsJson = plats.slice(0, 20).map((p) => ({
    id:   p.id,
    nom:  p.nom,
    cat:  p.categorie,
    comm: p.nb_commandes,
    note: p.note_moyenne,
  }))

  const historiqueJson = historique.slice(0, 5).map((c) => ({
    date:     c.created_at.slice(0, 10),
    articles: c.articles.map((a) => a.nom),
  }))

  const message = await getAnthropic().messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: `Tu es le système de recommandation de Daada Fast Food à Maroua, Cameroun. Analyse les habitudes de commande et recommande 4 plats. Réponds UNIQUEMENT en JSON valide : { "recommendations": [{"menuId": "string", "reason": "string"}] } Les raisons doivent être courtes (max 6 mots) et en français.`,
    messages: [
      {
        role:    'user',
        content: `Historique commandes: ${JSON.stringify(historiqueJson)}\nHeure actuelle: ${heure}\nPlats disponibles: ${JSON.stringify(platsJson)}\nRecommande 4 plats avec raison courte.`,
      },
    ],
  })

  const raw = message.content[0]?.type === 'text' ? message.content[0].text : ''

  // Parser JSON — extraire le premier bloc JSON valide
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Réponse Claude non JSON')

  const parsed = JSON.parse(match[0]) as {
    recommendations?: Array<{ menuId?: string; reason?: string }>
  }

  return (parsed.recommendations ?? [])
    .filter((r) => r.menuId && r.reason)
    .slice(0, 4)
    .map((r) => ({ menuId: r.menuId!, reason: r.reason! }))
}

// ─── getRecommendations ───────────────────────────────────────────────────────

export async function getRecommendations(
  userId: string | null,
  _context?: RecommendationContext,
): Promise<Recommendation[]> {
  const cacheKey = userId ? `ai:reco:${userId}` : 'ai:reco:anonymous'

  // Cache hit
  if (redis) {
    const cached = await redis.get<string>(cacheKey)
    if (cached) return JSON.parse(cached) as Recommendation[]
  }

  const [plats, historique] = await Promise.all([
    fetchPlatsDisponibles(),
    userId ? fetchHistorique(userId) : Promise.resolve([]),
  ])

  if (!plats.length) return []

  let result: Recommendation[]

  try {
    const aiRecs = await claudeRecommendations(plats, historique)

    // Hydrater avec les données réelles des plats
    const platMap = new Map(plats.map((p) => [p.id, p]))
    result = aiRecs
      .map((r) => {
        const plat = platMap.get(r.menuId)
        if (!plat) return null
        return {
          menuId:   plat.id,
          nom:      plat.nom,
          prix:     plat.prix,
          imageUrl: plat.image_url,
          reason:   r.reason,
        }
      })
      .filter((r): r is Recommendation => r !== null)

    // Si Claude n'a pas retourné 4 plats valides, compléter avec le fallback
    if (result.length < 4) {
      const existingIds = new Set(result.map((r) => r.menuId))
      const extra = fallbackRecommendations(
        plats.filter((p) => !existingIds.has(p.id)),
        historique,
      ).slice(0, 4 - result.length)
      result = [...result, ...extra]
    }
  } catch (err) {
    console.warn('[AI:reco] Claude indisponible, fallback scoring:', err instanceof Error ? err.message : err)
    result = fallbackRecommendations(plats, historique)
  }

  // Cacher le résultat
  if (redis && result.length) {
    await redis.set(cacheKey, JSON.stringify(result), { ex: CACHE_TTL_SEC })
  }

  return result
}
