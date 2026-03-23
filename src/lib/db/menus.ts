import { db } from '@/lib/supabase'
import type { Menu, CreateMenuInput } from '@/types'

// ─── Lecture ────────────────────────────────────────────────────────────────

export async function getMenus(categorieFiltre?: string): Promise<Menu[]> {
  let query = db
    .from('menus')
    .select('*')
    .eq('disponible', true)
    .order('categorie')
    .order('nom')

  if (categorieFiltre !== undefined) {
    query = query.eq('categorie', categorieFiltre)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Menu[]
}

export async function getMenuById(id: string): Promise<Menu | null> {
  const { data, error } = await db
    .from('menus')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Menu
}

export async function getMenusPopulaires(limite = 10): Promise<Menu[]> {
  const { data, error } = await db
    .from('menus')
    .select('*')
    .eq('disponible', true)
    .order('nb_commandes', { ascending: false })
    .limit(limite)

  if (error) throw new Error(error.message)
  return (data ?? []) as Menu[]
}

export async function searchMenus(query: string): Promise<Menu[]> {
  const { data, error } = await db
    .from('menus')
    .select('*')
    .eq('disponible', true)
    .or(`nom.ilike.%${query}%,description.ilike.%${query}%,categorie.ilike.%${query}%`)
    .order('nb_commandes', { ascending: false })
    .limit(30)

  if (error) throw new Error(error.message)
  return (data ?? []) as Menu[]
}

export async function getCategories(): Promise<string[]> {
  const { data, error } = await db
    .from('menus')
    .select('categorie')
    .eq('disponible', true)

  if (error) throw new Error(error.message)

  const categories = [...new Set((data ?? []).map((r) => r.categorie))]
  return categories.sort()
}

// ─── Création (admin) ────────────────────────────────────────────────────────

export async function createMenu(input: CreateMenuInput): Promise<Menu | null> {
  const insertData: {
    nom: string
    prix: number
    categorie: string
    description?: string
    image_url?: string
    disponible?: boolean
    temps_preparation?: number
    tags?: string[]
  } = {
    nom: input.nom,
    prix: input.prix,
    categorie: input.categorie,
  }

  if (input.description !== undefined) insertData.description = input.description
  if (input.image_url !== undefined) insertData.image_url = input.image_url
  if (input.disponible !== undefined) insertData.disponible = input.disponible
  if (input.temps_preparation !== undefined) insertData.temps_preparation = input.temps_preparation
  if (input.tags !== undefined) insertData.tags = input.tags

  const { data, error } = await db
    .from('menus')
    .insert(insertData)
    .select()
    .single()

  if (error || !data) return null
  return data as Menu
}

// ─── Mise à jour (admin) ──────────────────────────────────────────────────────

export type UpdateMenuInput = {
  nom?: string
  description?: string
  prix?: number
  categorie?: string
  image_url?: string
  disponible?: boolean
  temps_preparation?: number
  tags?: string[]
}

export async function updateMenu(id: string, input: UpdateMenuInput): Promise<Menu | null> {
  const updateData: {
    nom?: string
    description?: string
    prix?: number
    categorie?: string
    image_url?: string
    disponible?: boolean
    temps_preparation?: number
    tags?: string[]
  } = {}

  if (input.nom !== undefined) updateData.nom = input.nom
  if (input.description !== undefined) updateData.description = input.description
  if (input.prix !== undefined) updateData.prix = input.prix
  if (input.categorie !== undefined) updateData.categorie = input.categorie
  if (input.image_url !== undefined) updateData.image_url = input.image_url
  if (input.disponible !== undefined) updateData.disponible = input.disponible
  if (input.temps_preparation !== undefined) updateData.temps_preparation = input.temps_preparation
  if (input.tags !== undefined) updateData.tags = input.tags

  const { data, error } = await db
    .from('menus')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) return null
  return data as Menu
}

// ─── Suppression (admin) ──────────────────────────────────────────────────────

export async function deleteMenu(id: string): Promise<boolean> {
  const { error } = await db
    .from('menus')
    .update({ disponible: false })  // soft delete
    .eq('id', id)

  return !error
}

// ─── Incrémenter le compteur de commandes ────────────────────────────────────

export async function incrementNbCommandes(menuId: string): Promise<void> {
  const current = await getMenuById(menuId)
  if (!current) return
  await db
    .from('menus')
    .update({ nb_commandes: current.nb_commandes + 1 })
    .eq('id', menuId)
}
