import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Plat = Database['public']['Tables']['menus']['Row']

export interface MenuApiResponse {
  plats: Plat[]
  total: number
}

// SWR cache: 5 minutes on CDN/edge
export const revalidate = 300

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
      default: // populaire + vegetarien fallback
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 }
    )
  }
}
