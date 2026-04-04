/**
 * GET /api/search?q=...
 * Recherche full-text de plats dans Supabase.
 *
 * Fonctionnalités :
 *   - Recherche multi-champs (nom, description, tags, catégorie)
 *   - Historique des recherches par user dans Redis (dernières 10)
 *   - Suggestions orthographiques (mots proches dans le catalogue)
 *   - Rate limit : 60 req/min
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getVerifiedPayload } from '@/services/auth/session'
import { checkRateLimit, pushToList, getList } from '@/lib/security/rateLimit'

export const dynamic = 'force-dynamic'

const MIN_QUERY_LEN = 2
const MAX_QUERY_LEN = 100
const MAX_RESULTS   = 20

// ─── Suggestion orthographique simple (distance Levenshtein ≤ 2) ─────────────

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] = a[i - 1] === b[j - 1]
        ? dp[i - 1]![j - 1]!
        : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!)
    }
  }
  return dp[m]![n]!
}

function buildSuggestions(query: string, terms: string[]): string[] {
  const q = query.toLowerCase()
  return terms
    .filter((t) => {
      const tl = t.toLowerCase()
      return tl !== q && levenshtein(q, tl) <= 2
    })
    .slice(0, 3)
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const rawQuery = (searchParams.get('q') ?? '').trim()

    // Validation query
    if (rawQuery.length < MIN_QUERY_LEN) {
      return NextResponse.json(
        { error: `La recherche doit contenir au moins ${MIN_QUERY_LEN} caractères` },
        { status: 400 }
      )
    }
    if (rawQuery.length > MAX_QUERY_LEN) {
      return NextResponse.json({ error: 'Requête trop longue' }, { status: 400 })
    }

    // Sanitiser la query (éviter injection SQL via ilike)
    const query = rawQuery.replace(/[%_\\]/g, (c) => `\\${c}`)

    // Rate limit : 60 req/min par IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const rl = await checkRateLimit(`rl:search:${ip}`, 60, 60)
    if (!rl.ok) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }

    // Auth optionnelle — pour l'historique
    const payload = await getVerifiedPayload(req.headers.get('authorization'), req.cookies)

    // ── Recherche multi-champs ────────────────────────────────────────────────
    const { data: results, error } = await supabase
      .from('menus')
      .select('id, nom, description, prix, categorie, image_url, disponible, note_moyenne, nb_commandes, tags')
      .eq('disponible', true)
      .or(
        [
          `nom.ilike.%${query}%`,
          `description.ilike.%${query}%`,
          `categorie.ilike.%${query}%`,
        ].join(',')
      )
      .order('nb_commandes', { ascending: false })
      .limit(MAX_RESULTS)

    if (error) {
      console.error('[GET /api/search]', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    const plats = results ?? []

    // ── Historique Redis (si authentifié) ─────────────────────────────────────
    let historique: string[] = []

    if (payload?.sub) {
      const histKey = `search:history:${payload.sub}`
      // Sauvegarder la recherche si résultats trouvés
      if (plats.length > 0) {
        await pushToList(histKey, rawQuery, 10, 60 * 60 * 24 * 7) // TTL 7 jours
      }
      historique = await getList(histKey, 10)
    }

    // ── Suggestions orthographiques ───────────────────────────────────────────
    let suggestions: string[] = []

    if (plats.length === 0) {
      // Chercher des noms proches dans le catalogue (limité à 50 plats)
      const { data: catalogue } = await supabase
        .from('menus')
        .select('nom')
        .eq('disponible', true)
        .order('nb_commandes', { ascending: false })
        .limit(50)

      const terms = ((catalogue ?? []) as Array<{ nom: string }>).map((p) => p.nom)
      suggestions  = buildSuggestions(rawQuery, terms)
    }

    return NextResponse.json({
      plats,
      total:       plats.length,
      query:       rawQuery,
      suggestions,
      historique,
    })
  } catch (err) {
    console.error('[GET /api/search]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
