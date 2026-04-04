import { db } from '@/lib/supabase'
import type { UserDB, AdresseSauvegardee, NiveauFidelite, RoleUser } from '@/types'

// ─── Lecture ────────────────────────────────────────────────────────────────

export async function getUser(id: string): Promise<UserDB | null> {
  const { data, error } = await db
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as UserDB
}

export async function getUserByTelephone(telephone: string): Promise<UserDB | null> {
  // Supabase peut stocker le numéro avec ou sans "+"
  // (ex: "+237697580863" ou "237697580863") selon le provider.
  // On tente les deux formats avec maybeSingle() pour éviter les erreurs PGRST116.
  const avecPlus = telephone.startsWith('+') ? telephone : `+${telephone}`
  const sansPlus = telephone.startsWith('+') ? telephone.slice(1) : telephone

  const { data: d1 } = await db
    .from('users')
    .select('*')
    .eq('telephone', avecPlus)
    .maybeSingle()

  if (d1) return d1 as UserDB

  const { data: d2 } = await db
    .from('users')
    .select('*')
    .eq('telephone', sansPlus)
    .maybeSingle()

  return d2 ? (d2 as UserDB) : null
}

// ─── Création ────────────────────────────────────────────────────────────────

export type CreateUserInput = {
  id: string
  telephone: string
  nom: string
  quartier?: string
  role?: RoleUser
}

export async function createUser(input: CreateUserInput): Promise<UserDB | null> {
  const insertData: {
    id: string
    telephone: string
    nom: string
    quartier?: string
    role?: RoleUser
  } = {
    id: input.id,
    telephone: input.telephone,
    nom: input.nom,
  }

  if (input.quartier !== undefined) insertData.quartier = input.quartier
  if (input.role !== undefined) insertData.role = input.role

  const { data, error } = await db
    .from('users')
    .insert(insertData)
    .select()
    .single()

  if (error || !data) return null
  return data as UserDB
}

// ─── Mise à jour ─────────────────────────────────────────────────────────────

export type UpdateUserInput = {
  nom?: string
  quartier?: string
  avatar_url?: string
  fcm_token?: string
  adresses_sauvegardees?: AdresseSauvegardee[]
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<UserDB | null> {
  const updateData: {
    nom?: string
    quartier?: string
    avatar_url?: string
    fcm_token?: string
    adresses_sauvegardees?: AdresseSauvegardee[]
  } = {}

  if (input.nom !== undefined) updateData.nom = input.nom
  if (input.quartier !== undefined) updateData.quartier = input.quartier
  if (input.avatar_url !== undefined) updateData.avatar_url = input.avatar_url
  if (input.fcm_token !== undefined) updateData.fcm_token = input.fcm_token
  if (input.adresses_sauvegardees !== undefined) updateData.adresses_sauvegardees = input.adresses_sauvegardees

  const { data, error } = await db
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) return null
  return data as UserDB
}

// ─── Points de fidélité ──────────────────────────────────────────────────────

const SEUILS_NIVEAU: Record<NiveauFidelite, number> = {
  bronze: 0,
  argent: 500,
  or: 2000,
}

function calculerNiveau(points: number): NiveauFidelite {
  if (points >= SEUILS_NIVEAU.or) return 'or'
  if (points >= SEUILS_NIVEAU.argent) return 'argent'
  return 'bronze'
}

/**
 * Ajoute des points de fidélité à un utilisateur.
 * Recalcule automatiquement le niveau (bronze → argent → or).
 */
export async function updatePoints(
  userId: string,
  deltaPoints: number
): Promise<{ points: number; niveau: NiveauFidelite } | null> {
  // Récupérer les points actuels
  const user = await getUser(userId)
  if (!user) return null

  const newPoints = Math.max(0, user.points_fidelite + deltaPoints)
  const newNiveau = calculerNiveau(newPoints)

  const { data, error } = await db
    .from('users')
    .update({ points_fidelite: newPoints, niveau_fidelite: newNiveau })
    .eq('id', userId)
    .select('points_fidelite, niveau_fidelite')
    .single()

  if (error || !data) return null
  return { points: data.points_fidelite, niveau: data.niveau_fidelite as NiveauFidelite }
}
