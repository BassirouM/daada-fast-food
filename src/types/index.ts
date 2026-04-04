// =============================================================================
// DAADA FAST FOOD — Types TypeScript centralisés
// =============================================================================

// ─── Re-exports des types existants (rétrocompatibilité) ────────────────────
export type { User, UserRole, AuthSession, AuthError, OtpRequest, OtpVerify, RegisterPayload } from './auth'
export type { MenuItem, MenuCategory, MenuItemOption, MenuItemOptionGroup } from './menu'
export type { Order, OrderItem, OrderStatus, OrderTimeline } from './orders'
export type { Payment, PaymentMethod, PaymentStatus } from './payment'
export type { DeliveryAddress, DeliveryZone, DeliveryAgent, DeliveryAgentStatus } from './delivery'
export type { Notification, NotificationType } from './notifications'

// ─── Enums ──────────────────────────────────────────────────────────────────

/** Statut d'une commande */
export type StatutCommande =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled'

/** Rôle d'un utilisateur */
export type RoleUser = 'customer' | 'admin' | 'delivery_agent' | 'kitchen'

/** Méthode de paiement acceptée */
export type MethodePaiement = 'mtn_momo' | 'orange_money' | 'cinetpay' | 'cash'

/** Statut d'un paiement */
export type StatutPaiement = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'

/** Niveau de fidélité */
export type NiveauFidelite = 'bronze' | 'argent' | 'or'

// ─── Adresse sauvegardée (JSONB dans users) ──────────────────────────────────

export type AdresseSauvegardee = {
  label: string
  quartier: string
  adresse_complete: string
  latitude: number | null
  longitude: number | null
}

// ─── Entités principales (nouveau schéma français) ───────────────────────────

export type UserDB = {
  id: string
  telephone: string
  nom: string
  quartier: string | null
  role: RoleUser
  avatar_url: string | null
  fcm_token: string | null
  points_fidelite: number
  niveau_fidelite: NiveauFidelite
  adresses_sauvegardees: AdresseSauvegardee[]
  created_at: string
  updated_at: string
}

export type Menu = {
  id: string
  nom: string
  description: string
  prix: number
  categorie: string
  image_url: string | null
  disponible: boolean
  temps_preparation: number
  note_moyenne: number
  nb_commandes: number
  tags: string[]
  created_at: string
}

export type CommandeArticle = {
  id: string
  commande_id: string
  menu_id: string
  nom: string
  quantite: number
  prix_unitaire: number
}

export type Commande = {
  id: string
  client_id: string
  livreur_id: string | null
  statut: StatutCommande
  adresse_livraison: string
  frais_livraison: number
  sous_total: number
  total: number
  note_cuisinier: string | null
  temps_estime: number | null
  created_at: string
  updated_at: string
  articles?: CommandeArticle[]
}

export type Paiement = {
  id: string
  commande_id: string
  transaction_id: string | null
  idempotency_key: string
  methode: MethodePaiement
  montant: number
  statut: StatutPaiement
  cinetpay_data: Record<string, unknown> | null
  created_at: string
}

export type Livreur = {
  livreur_id: string
  latitude: number
  longitude: number
  disponible: boolean
  updated_at: string
  user?: UserDB
}

export type AuditLog = {
  id: string
  user_id: string | null
  action: string
  table_name: string
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export type NotificationDB = {
  id: string
  user_id: string
  titre: string
  corps: string
  type: string
  lu: boolean
  data: Record<string, unknown> | null
  created_at: string
}

// ─── Inputs de création ──────────────────────────────────────────────────────

export type CreateMenuInput = {
  nom: string
  description?: string
  prix: number
  categorie: string
  image_url?: string
  disponible?: boolean
  temps_preparation?: number
  tags?: string[]
}

export type CreateCommandeInput = {
  client_id: string
  adresse_livraison: string
  sous_total: number
  total: number
  frais_livraison?: number
  note_cuisinier?: string
  temps_estime?: number
}

export type CreateCommandeArticleInput = {
  commande_id: string
  menu_id: string
  nom: string
  quantite: number
  prix_unitaire: number
}

export type CreatePaiementInput = {
  commande_id: string
  idempotency_key: string
  methode: MethodePaiement
  montant: number
  transaction_id?: string
}

// ─── Types utilitaires globaux ───────────────────────────────────────────────

export type ApiResponse<T> = {
  data: T | null
  error: string | null
  status: number
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export type Coordinates = {
  lat: number
  lng: number
}
