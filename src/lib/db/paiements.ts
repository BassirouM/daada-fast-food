import { db, createAdminClient } from '@/lib/supabase'
import type { Paiement, CreatePaiementInput, StatutPaiement, MethodePaiement } from '@/types'

// ─── Création ────────────────────────────────────────────────────────────────

export async function createPaiement(input: CreatePaiementInput): Promise<Paiement | null> {
  const insertData: {
    commande_id: string
    idempotency_key: string
    methode: string
    montant: number
    transaction_id?: string
  } = {
    commande_id: input.commande_id,
    idempotency_key: input.idempotency_key,
    methode: input.methode,
    montant: input.montant,
  }

  if (input.transaction_id !== undefined) insertData.transaction_id = input.transaction_id

  const { data, error } = await db
    .from('paiements')
    .insert(insertData)
    .select()
    .single()

  if (error || !data) return null
  return mapPaiement(data)
}

// ─── Lecture ────────────────────────────────────────────────────────────────

export async function getPaiement(id: string): Promise<Paiement | null> {
  const { data, error } = await db
    .from('paiements')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return mapPaiement(data)
}

export async function getPaiementByCommandeId(commandeId: string): Promise<Paiement | null> {
  const { data, error } = await db
    .from('paiements')
    .select('*')
    .eq('commande_id', commandeId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return mapPaiement(data)
}

export async function getPaiementByIdempotencyKey(key: string): Promise<Paiement | null> {
  const { data, error } = await db
    .from('paiements')
    .select('*')
    .eq('idempotency_key', key)
    .single()

  if (error || !data) return null
  return mapPaiement(data)
}

// ─── Mise à jour (admin / webhook) ───────────────────────────────────────────

export type UpdatePaiementInput = {
  statut?: StatutPaiement
  transaction_id?: string
  cinetpay_data?: Record<string, unknown>
}

export async function updatePaiement(
  id: string,
  input: UpdatePaiementInput
): Promise<Paiement | null> {
  // Webhook uses admin client (service role bypasses RLS)
  const admin = createAdminClient()

  const updateData: {
    statut?: string
    transaction_id?: string
    cinetpay_data?: Record<string, unknown>
  } = {}

  if (input.statut !== undefined) updateData.statut = input.statut
  if (input.transaction_id !== undefined) updateData.transaction_id = input.transaction_id
  if (input.cinetpay_data !== undefined) updateData.cinetpay_data = input.cinetpay_data

  const { data, error } = await admin
    .from('paiements')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) return null
  return mapPaiement(data)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type RawPaiement = {
  id: string
  commande_id: string
  transaction_id: string | null
  idempotency_key: string
  methode: string
  montant: number
  statut: string
  cinetpay_data: Record<string, unknown> | null
  created_at: string
}

function mapPaiement(raw: RawPaiement): Paiement {
  return {
    id: raw.id,
    commande_id: raw.commande_id,
    transaction_id: raw.transaction_id,
    idempotency_key: raw.idempotency_key,
    methode: raw.methode as MethodePaiement,
    montant: raw.montant,
    statut: raw.statut as StatutPaiement,
    cinetpay_data: raw.cinetpay_data,
    created_at: raw.created_at,
  }
}
