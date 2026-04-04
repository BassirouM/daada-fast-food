import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase, createAdminClient } from '@/lib/supabase'
import { getVerifiedPayload } from '@/services/auth/session'
import { checkRateLimit } from '@/lib/security/rateLimit'
import type { Database } from '@/lib/supabase'

type Plat = Database['public']['Tables']['menus']['Row']

export interface MenuApiResponse {
  plats: Plat[]
  total: number
}

// SWR cache: 5 minutes on CDN/edge
export const revalidate = 300

// ─── Schéma création plat ─────────────────────────────────────────────────────

const createPlatSchema = z.object({
  nom:               z.string().trim().min(2).max(200),
  description:       z.string().trim().max(1000).default(''),
  prix:              z.number().int().min(100, 'Prix minimum 100 FCFA'),
  categorie:         z.string().trim().min(2).max(100),
  image_url:         z.string().url().optional().nullable(),
  disponible:        z.boolean().default(true),
  temps_preparation: z.number().int().min(1).max(120).default(15),
  tags:              z.array(z.string().trim().max(50)).max(10).default([]),
})

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categorie = searchParams.get('categorie') ?? ''
    const search    = searchParams.get('search')    ?? ''
    const sort      = searchParams.get('sort')      ?? 'populaire'
    const page      = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit     = 12
    const offset    = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from('menus')
      .select('*', { count: 'exact' })
      .eq('disponible', true)

    if (categorie) {
      query = query.ilike('categorie', `%${categorie}%`)
    }

    if (search) {
      query = query.or(`nom.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`)
    }

    if (sort === 'vegetarien') {
      query = query.contains('tags', ['vegetarien'])
    }

    switch (sort) {
      case 'prix_asc':
        query = query.order('prix', { ascending: true })
        break
      case 'prix_desc':
        query = query.order('prix', { ascending: false })
        break
      case 'nouveau':
        query = query.order('created_at', { ascending: false })
        break
      default:
        query = query.order('nb_commandes', { ascending: false })
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { plats: (data ?? []) as Plat[], total: count ?? 0 } satisfies MenuApiResponse,
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    )
  } catch (err) {
    console.error('[GET /api/menu]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ─── POST — créer un plat (admin uniquement) ──────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Auth
    const payload = await getVerifiedPayload(req.headers.get('authorization'), req.cookies)
    if (!payload) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    if (payload.role !== 'admin' && payload.role !== 'super_admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Rate limit : 30 créations / 10 min par admin
    const ip  = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const rl  = await checkRateLimit(`rl:menu:create:${ip}`, 30, 600)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
        { status: 429, headers: { 'Retry-After': String(rl.reset) } }
      )
    }

    // Validation
    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
    }

    const result = createPlatSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 422 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('menus')
      .insert({
        ...result.data,
        nb_commandes: 0,
        note_moyenne: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/menu]', error)
      return NextResponse.json({ error: 'Création échouée' }, { status: 500 })
    }

    return NextResponse.json({ plat: data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/menu]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

