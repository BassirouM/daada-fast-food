import { db } from '@/lib/supabase'
import type { Livreur } from '@/types'

// ─── Position GPS ────────────────────────────────────────────────────────────

export async function getPosition(livreurId: string): Promise<Livreur | null> {
  const { data, error } = await db
    .from('positions_livreurs')
    .select('*')
    .eq('livreur_id', livreurId)
    .single()

  if (error || !data) return null
  return data as Livreur
}

/**
 * Met à jour (ou crée) la position GPS d'un livreur.
 * Utilise UPSERT pour garantir qu'il n'existe qu'une seule ligne par livreur.
 */
export async function updatePosition(
  livreurId: string,
  latitude: number,
  longitude: number
): Promise<Livreur | null> {
  const { data, error } = await db
    .from('positions_livreurs')
    .upsert(
      {
        livreur_id: livreurId,
        latitude,
        longitude,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'livreur_id' }
    )
    .select()
    .single()

  if (error || !data) return null
  return data as Livreur
}

export async function setDisponibilite(
  livreurId: string,
  disponible: boolean
): Promise<boolean> {
  const { error } = await db
    .from('positions_livreurs')
    .update({ disponible })
    .eq('livreur_id', livreurId)

  return !error
}

// ─── Livreurs disponibles ────────────────────────────────────────────────────

export async function getLivreursDispo(): Promise<Livreur[]> {
  const { data, error } = await db
    .from('positions_livreurs')
    .select('*')
    .eq('disponible', true)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Livreur[]
}

/**
 * Trouve le livreur disponible le plus proche d'une position donnée.
 * Distance calculée côté client (Haversine) depuis la liste des disponibles.
 */
export async function getLivreurLePlusProche(
  latitude: number,
  longitude: number
): Promise<Livreur | null> {
  const livreurs = await getLivreursDispo()
  if (livreurs.length === 0) return null

  const R = 6371 // rayon Terre en km

  let plusProche: Livreur | null = null
  let distanceMin = Infinity

  for (const livreur of livreurs) {
    const dLat = ((livreur.latitude - latitude) * Math.PI) / 180
    const dLon = ((livreur.longitude - longitude) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((latitude * Math.PI) / 180) *
        Math.cos((livreur.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    if (distance < distanceMin) {
      distanceMin = distance
      plusProche = livreur
    }
  }

  return plusProche
}
