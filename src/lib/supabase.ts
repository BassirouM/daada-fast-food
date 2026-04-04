import { createClient } from '@supabase/supabase-js'

// ─── Database type (generated from new schema) ──────────────────────────────

export type AdresseSauvegardee = {
  label: string
  quartier: string
  adresse_complete: string
  latitude: number | null
  longitude: number | null
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          telephone: string
          nom: string
          quartier: string | null
          role: 'customer' | 'admin' | 'delivery_agent' | 'kitchen'
          avatar_url: string | null
          fcm_token: string | null
          points_fidelite: number
          niveau_fidelite: 'bronze' | 'argent' | 'or'
          adresses_sauvegardees: AdresseSauvegardee[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          telephone: string
          nom: string
          quartier?: string | null
          role?: 'customer' | 'admin' | 'delivery_agent' | 'kitchen'
          avatar_url?: string | null
          fcm_token?: string | null
          points_fidelite?: number
          niveau_fidelite?: 'bronze' | 'argent' | 'or'
          adresses_sauvegardees?: AdresseSauvegardee[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          telephone?: string
          nom?: string
          quartier?: string | null
          role?: 'customer' | 'admin' | 'delivery_agent' | 'kitchen'
          avatar_url?: string | null
          fcm_token?: string | null
          points_fidelite?: number
          niveau_fidelite?: 'bronze' | 'argent' | 'or'
          adresses_sauvegardees?: AdresseSauvegardee[]
          updated_at?: string
        }
      }
      menus: {
        Row: {
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
        Insert: {
          id?: string
          nom: string
          description?: string
          prix: number
          categorie: string
          image_url?: string | null
          disponible?: boolean
          temps_preparation?: number
          note_moyenne?: number
          nb_commandes?: number
          tags?: string[]
          created_at?: string
        }
        Update: {
          nom?: string
          description?: string
          prix?: number
          categorie?: string
          image_url?: string | null
          disponible?: boolean
          temps_preparation?: number
          note_moyenne?: number
          nb_commandes?: number
          tags?: string[]
        }
      }
      commandes: {
        Row: {
          id: string
          client_id: string
          livreur_id: string | null
          statut: string
          adresse_livraison: string
          frais_livraison: number
          sous_total: number
          total: number
          note_cuisinier: string | null
          temps_estime: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          livreur_id?: string | null
          statut?: string
          adresse_livraison: string
          frais_livraison?: number
          sous_total: number
          total: number
          note_cuisinier?: string | null
          temps_estime?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          livreur_id?: string | null
          statut?: string
          adresse_livraison?: string
          frais_livraison?: number
          sous_total?: number
          total?: number
          note_cuisinier?: string | null
          temps_estime?: number | null
          updated_at?: string
        }
      }
      commande_articles: {
        Row: {
          id: string
          commande_id: string
          menu_id: string
          nom: string
          quantite: number
          prix_unitaire: number
        }
        Insert: {
          id?: string
          commande_id: string
          menu_id: string
          nom: string
          quantite: number
          prix_unitaire: number
        }
        Update: {
          quantite?: number
          prix_unitaire?: number
        }
      }
      paiements: {
        Row: {
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
        Insert: {
          id?: string
          commande_id: string
          transaction_id?: string | null
          idempotency_key: string
          methode: string
          montant: number
          statut?: string
          cinetpay_data?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          transaction_id?: string | null
          statut?: string
          cinetpay_data?: Record<string, unknown> | null
        }
      }
      positions_livreurs: {
        Row: {
          livreur_id: string
          latitude: number
          longitude: number
          disponible: boolean
          updated_at: string
        }
        Insert: {
          livreur_id: string
          latitude: number
          longitude: number
          disponible?: boolean
          updated_at?: string
        }
        Update: {
          latitude?: number
          longitude?: number
          disponible?: boolean
          updated_at?: string
        }
      }
      audit_log: {
        Row: {
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
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_data?: Record<string, unknown> | null
          new_data?: Record<string, unknown> | null
          ip_address?: string | null
          created_at?: string
        }
        Update: Record<string, never>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          titre: string
          corps: string
          type: string
          lu: boolean
          data: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          titre: string
          corps: string
          type: string
          lu?: boolean
          data?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          lu?: boolean
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ─── Environment validation ──────────────────────────────────────────────────

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (typeof window !== 'undefined') {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Variables NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY manquantes')
  }
}

// ─── Browser client — used by existing services ──────────────────────────────

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// ─── Typed alias — for src/lib/db/* CRUD functions
// Results are cast to typed entities in each db/ function.
// Use `createClient<Database>(...)` once the Database type is auto-generated
// via `npx supabase gen types typescript --linked > src/types/database.types.ts`
export const db = supabase

// ─── Server-side admin client (only use in API routes / server components) ───

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('[Supabase] SUPABASE_SERVICE_ROLE_KEY manquant (serveur uniquement)')
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
