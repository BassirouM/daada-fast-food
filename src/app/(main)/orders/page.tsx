'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useCartStore } from '@/stores/cart.store'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import type { CartItem } from '@/stores/cart.store'
import type { MenuItem } from '@/types/menu'

// ─── Types ────────────────────────────────────────────────────────────────────

type StatutCommande = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled'

type ArticleRow = {
  id: string
  menu_id: string
  nom: string
  quantite: number
  prix_unitaire: number
  menus?: { image_url: string | null } | null
}

type CommandeRow = {
  id: string
  statut: StatutCommande
  adresse_livraison: string
  total: number
  created_at: string
  commande_articles: ArticleRow[]
  paiements: Array<{ methode: string; transaction_id: string | null }> | null
}

type FilterTab = 'all' | 'en_cours' | 'livrees' | 'annulees'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUT_LABEL: Record<StatutCommande, string> = {
  pending:   'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready:     'Prête',
  picked_up: 'En livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

const STATUT_COLOR: Record<StatutCommande, string> = {
  pending:   '#F59E0B',
  confirmed: '#3B82F6',
  preparing: '#F97316',
  ready:     '#8B5CF6',
  picked_up: '#06B6D4',
  delivered: '#10B981',
  cancelled: '#EF4444',
}

const EN_COURS: StatutCommande[] = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up']

function matchesFilter(statut: StatutCommande, filter: FilterTab): boolean {
  if (filter === 'all')       return true
  if (filter === 'en_cours')  return EN_COURS.includes(statut)
  if (filter === 'livrees')   return statut === 'delivered'
  if (filter === 'annulees')  return statut === 'cancelled'
  return true
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-CM', {
    day:    '2-digit',
    month:  'short',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const router         = useRouter()
  const { user: userDB, isLoading: authLoading } = useAuth()
  const { addItem }    = useCartStore()

  const [commandes, setCommandes]   = useState<CommandeRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState<FilterTab>('all')
  const [reordering, setReordering] = useState<string | null>(null)

  // ── Fetch commandes ─────────────────────────────────────────────────────────

  const fetchCommandes = useCallback(async () => {
    if (!userDB?.id) return
    setLoading(true)

    const { data } = await supabase
      .from('commandes')
      .select(`
        id, statut, adresse_livraison, total, created_at,
        commande_articles ( id, menu_id, nom, quantite, prix_unitaire,
          menus ( image_url )
        ),
        paiements ( methode, transaction_id )
      `)
      .eq('client_id', userDB.id)
      .order('created_at', { ascending: false })

    setCommandes((data as unknown as CommandeRow[]) ?? [])
    setLoading(false)
  }, [userDB?.id])

  useEffect(() => {
    if (!authLoading && userDB?.id) void fetchCommandes()
    else if (!authLoading && !userDB?.id) router.replace('/login')
  }, [authLoading, userDB?.id, fetchCommandes, router])

  // ── Recommander ─────────────────────────────────────────────────────────────

  const handleReorder = useCallback(async (commande: CommandeRow) => {
    setReordering(commande.id)
    try {
      const menuIds = commande.commande_articles.map((a) => a.menu_id)
      const { data: menus } = await supabase
        .from('menus')
        .select('id, nom, prix, image_url, categorie, disponible, temps_preparation, note_moyenne, nb_commandes, description, tags')
        .in('id', menuIds)

      const menuMap = new Map(
        ((menus ?? []) as Array<Record<string, unknown>>).map((m) => [m.id as string, m])
      )

      for (const article of commande.commande_articles) {
        const menuRow = menuMap.get(article.menu_id)
        if (!menuRow) continue

        const imgUrl = menuRow.image_url as string | null | undefined
        const menuItem: MenuItem = {
          id:                      menuRow.id as string,
          category_id:             menuRow.categorie as string,
          name:                    menuRow.nom as string,
          slug:                    (menuRow.id as string).slice(0, 8),
          description:             (menuRow.description as string) ?? '',
          price:                   menuRow.prix as number,
          ...(imgUrl ? { image_url: imgUrl } : {}),
          option_groups:           [],
          is_available:            menuRow.disponible as boolean,
          is_featured:             false,
          preparation_time_minutes: menuRow.temps_preparation as number,
          tags:                    (menuRow.tags as string[]) ?? [],
          created_at:              '',
        }

        const cartItem: CartItem = {
          id:               `reorder-${article.menu_id}-${Date.now()}`,
          menuItem,
          quantity:         article.quantite,
          selectedOptions:  [],
          unitPrice:        article.prix_unitaire,
          totalPrice:       article.prix_unitaire * article.quantite,
        }
        addItem(cartItem)
      }
      router.push('/checkout')
    } finally {
      setReordering(null)
    }
  }, [addItem, router])

  // ── Filtered list ───────────────────────────────────────────────────────────

  const filtered = commandes.filter((c) => matchesFilter(c.statut as StatutCommande, filter))

  // ── Render ──────────────────────────────────────────────────────────────────

  const TABS: { v: FilterTab; label: string }[] = [
    { v: 'all',       label: 'Toutes' },
    { v: 'en_cours',  label: 'En cours' },
    { v: 'livrees',   label: 'Livrées' },
    { v: 'annulees',  label: 'Annulées' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '0.75rem 1rem' }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>
          Mes commandes
        </h1>
      </header>

      {/* Filter tabs */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '0 1rem 0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', scrollbarWidth: 'none', paddingTop: '0.75rem' }}>
          {TABS.map(({ v, label }) => {
            const count = commandes.filter((c) => matchesFilter(c.statut as StatutCommande, v)).length
            return (
              <button
                key={v}
                onClick={() => setFilter(v)}
                style={{
                  flexShrink:   0,
                  padding:      '0.5rem 0.875rem',
                  borderRadius: 20,
                  border:       `1.5px solid ${filter === v ? 'var(--brand)' : 'var(--border)'}`,
                  background:   filter === v ? 'rgba(249,115,22,0.1)' : 'transparent',
                  color:        filter === v ? 'var(--brand)' : 'var(--text-secondary)',
                  fontWeight:   filter === v ? 700 : 500,
                  fontSize:     '0.8125rem',
                  cursor:       'pointer',
                  whiteSpace:   'nowrap',
                  transition:   'all 0.2s',
                }}
              >
                {label} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: 480, margin: '0 auto', padding: '0.75rem 1rem 5rem' }}>
        {loading || authLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 16, height: 120, animation: 'pulse 1.5s ease infinite', border: '1px solid var(--border)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍔</div>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
              {filter === 'all' ? 'Aucune commande' : 'Aucune commande dans cette catégorie'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {filter === 'all' ? 'Votre historique de commandes apparaîtra ici.' : ''}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => router.push('/menu')}
                style={{ padding: '0.75rem 1.5rem', borderRadius: 12, background: 'linear-gradient(135deg, #F97316, #EA580C)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >
                Explorer le menu
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
            {filtered.map((commande) => {
              const statut = commande.statut as StatutCommande
              const color  = STATUT_COLOR[statut] ?? '#888'
              const firstImg = commande.commande_articles[0]?.menus?.image_url ?? null
              const totalItems = commande.commande_articles.reduce((acc, a) => acc + a.quantite, 0)
              const preview = commande.commande_articles.slice(0, 3).map((a) => `${a.nom} ×${a.quantite}`).join(', ')
              const reste = commande.commande_articles.length > 3 ? ` +${commande.commande_articles.length - 3}` : ''
              const isEnCours = EN_COURS.includes(statut)

              return (
                <div
                  key={commande.id}
                  style={{ background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s' }}
                  onClick={() => router.push(`/orders/${commande.id}`)}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.875rem 0.875rem 0.625rem' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        #{commande.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                        {formatDate(commande.created_at)} · {totalItems} article{totalItems > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      {isEnCours && <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, animation: 'pulse 1.5s ease infinite', display: 'inline-block' }} />}
                      <span style={{ padding: '0.25rem 0.625rem', borderRadius: 20, background: `${color}20`, color, fontSize: '0.75rem', fontWeight: 700 }}>
                        {STATUT_LABEL[statut]}
                      </span>
                    </div>
                  </div>

                  {/* Articles preview */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0 0.875rem 0.75rem' }}>
                    {firstImg && (
                      <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, position: 'relative', background: 'var(--bg-elevated)' }}>
                        <Image src={firstImg} alt="" fill style={{ objectFit: 'cover' }} sizes="44px" />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {preview}{reste}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                        📍 {commande.adresse_livraison.split('—')[0]?.trim() ?? commande.adresse_livraison}
                      </p>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--brand)', flexShrink: 0 }}>
                      {formatPrice(commande.total)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ borderTop: '1px solid var(--border)', padding: '0.625rem 0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleReorder(commande)
                      }}
                      disabled={reordering === commande.id}
                      style={{
                        padding:    '0.4rem 0.875rem',
                        borderRadius: 10,
                        border:     '1.5px solid var(--brand)',
                        background: 'transparent',
                        color:      reordering === commande.id ? 'var(--text-muted)' : 'var(--brand)',
                        fontWeight: 600,
                        fontSize:   '0.8125rem',
                        cursor:     reordering === commande.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {reordering === commande.id ? '…' : '🔄 Recommander'}
                    </button>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      Voir détails →
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  )
}
