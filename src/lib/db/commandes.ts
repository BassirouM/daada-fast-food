import { db, createAdminClient } from '@/lib/supabase'
import type {
  Commande,
  CommandeArticle,
  StatutCommande,
  CreateCommandeInput,
  CreateCommandeArticleInput,
} from '@/types'

// ─── Création ────────────────────────────────────────────────────────────────

export async function createCommande(
  input: CreateCommandeInput
): Promise<Commande | null> {
  const insertData: {
    client_id: string
    adresse_livraison: string
    sous_total: number
    total: number
    frais_livraison?: number
    note_cuisinier?: string
    temps_estime?: number
  } = {
    client_id: input.client_id,
    adresse_livraison: input.adresse_livraison,
    sous_total: input.sous_total,
    total: input.total,
  }

  if (input.frais_livraison !== undefined) insertData.frais_livraison = input.frais_livraison
  if (input.note_cuisinier !== undefined) insertData.note_cuisinier = input.note_cuisinier
  if (input.temps_estime !== undefined) insertData.temps_estime = input.temps_estime

  const { data, error } = await db
    .from('commandes')
    .insert(insertData)
    .select()
    .single()

  if (error || !data) return null
  return { ...(data as Commande), statut: data.statut as StatutCommande }
}

export async function createCommandeArticles(
  articles: CreateCommandeArticleInput[]
): Promise<CommandeArticle[]> {
  const { data, error } = await db
    .from('commande_articles')
    .insert(articles)
    .select()

  if (error) throw new Error(error.message)
  return (data ?? []) as CommandeArticle[]
}

// ─── Lecture ────────────────────────────────────────────────────────────────

export async function getCommande(id: string): Promise<Commande | null> {
  const { data, error } = await db
    .from('commandes')
    .select('*, commande_articles(*)')
    .eq('id', id)
    .single()

  if (error || !data) return null

  const commande = data as Commande & { commande_articles: CommandeArticle[] }
  return {
    ...commande,
    statut: commande.statut as StatutCommande,
    articles: commande.commande_articles,
  }
}

export async function getCommandesByClient(
  clientId: string,
  options?: { limite?: number; page?: number }
): Promise<Commande[]> {
  const limite = options?.limite ?? 20
  const page   = options?.page   ?? 1
  const offset = (page - 1) * limite

  const { data, error } = await db
    .from('commandes')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limite - 1)

  if (error) throw new Error(error.message)
  return ((data ?? []) as Commande[]).map((c) => ({
    ...c,
    statut: c.statut as StatutCommande,
  }))
}

// ─── Toutes les commandes (admin / cuisine) ──────────────────────────────────

export async function getAllCommandes(options?: {
  statut?: StatutCommande
  limite?: number
  page?: number
}): Promise<Commande[]> {
  const admin  = createAdminClient()
  const limite = options?.limite ?? 50
  const page   = options?.page   ?? 1
  const offset = (page - 1) * limite

  let query = admin
    .from('commandes')
    .select('*, commande_articles(*)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limite - 1)

  if (options?.statut !== undefined) {
    query = query.eq('statut', options.statut)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return ((data ?? []) as Array<Commande & { commande_articles: CommandeArticle[] }>).map(
    (c) => ({
      ...c,
      statut: c.statut as StatutCommande,
      articles: c.commande_articles,
    })
  )
}

// ─── Mise à jour du statut ───────────────────────────────────────────────────

export async function updateStatut(
  commandeId: string,
  statut: StatutCommande,
  livreurId?: string
): Promise<Commande | null> {
  const updateData: {
    statut: string
    livreur_id?: string
    temps_estime?: number
    updated_at?: string
  } = { statut }

  if (livreurId !== undefined) updateData.livreur_id = livreurId

  const { data, error } = await db
    .from('commandes')
    .update(updateData)
    .eq('id', commandeId)
    .select()
    .single()

  if (error || !data) return null
  return { ...(data as Commande), statut: data.statut as StatutCommande }
}
