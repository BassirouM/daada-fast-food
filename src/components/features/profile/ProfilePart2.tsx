'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell, BellOff, Moon, Sun, LogOut, Plus, Trash2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useCartStore } from '@/stores/cart.store'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { cn, formatPrice } from '@/lib/utils'
import type { CartItem } from '@/stores/cart.store'
import type { MenuItem } from '@/types/menu'
import type { AdresseSauvegardee } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type StatutCommande =
  | 'pending' | 'confirmed' | 'preparing'
  | 'ready' | 'picked_up' | 'delivered' | 'cancelled'

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
}

type FilterTab = 'all' | 'en_cours' | 'livrees' | 'annulees'

// ─── Constantes ───────────────────────────────────────────────────────────────

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
  preparing: '#FF6B00',
  ready:     '#8B5CF6',
  picked_up: '#06B6D4',
  delivered: '#10B981',
  cancelled: '#EF4444',
}

const EN_COURS: StatutCommande[] = [
  'pending', 'confirmed', 'preparing', 'ready', 'picked_up',
]

const TABS: Array<{ v: FilterTab; label: string }> = [
  { v: 'all',       label: 'Toutes' },
  { v: 'en_cours',  label: 'En cours' },
  { v: 'livrees',   label: 'Livrées' },
  { v: 'annulees',  label: 'Annulées' },
]

const PAGE_SIZE = 10

const ADRESSE_ICONS: Record<string, string> = {
  Maison:  '🏠',
  Travail: '💼',
}

const QUARTIERS_MAROUA = [
  'Centre-ville', 'Domayo', 'Kakataré', 'Djarengol', 'Founangué',
  'Pont-Vert', 'Hardé', 'Lopéré', 'Makabaye', 'Pitoaré',
  'Ngassa', 'Kongola', 'Doualaré', 'Bamaré', 'Papata', 'Dougoy',
]

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function adresseIcon(label: string): string {
  return ADRESSE_ICONS[label] ?? '📍'
}

function matchesFilter(statut: StatutCommande, filter: FilterTab): boolean {
  if (filter === 'all')      return true
  if (filter === 'en_cours') return EN_COURS.includes(statut)
  if (filter === 'livrees')  return statut === 'delivered'
  if (filter === 'annulees') return statut === 'cancelled'
  return true
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-CM', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-4 text-base font-bold text-[var(--text-primary)] mb-3">
      {children}
    </h2>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. HISTORIQUE COMMANDES
// ═══════════════════════════════════════════════════════════════════════════════

export function OrderHistory() {
  const { user }    = useAuth()
  const router      = useRouter()
  const addItem     = useCartStore((s) => s.addItem)
  const clearCart   = useCartStore((s) => s.clearCart)

  const [commandes,    setCommandes]    = useState<CommandeRow[]>([])
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState<FilterTab>('all')
  const [page,         setPage]         = useState(0)
  const [hasMore,      setHasMore]      = useState(true)
  const [loadingMore,  setLoadingMore]  = useState(false)
  const [reordering,   setReordering]   = useState<string | null>(null)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const isFetching  = useRef(false)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchPage = useCallback(async (pageNum: number) => {
    if (!user?.id || isFetching.current) return
    isFetching.current = true
    pageNum === 0 ? setLoading(true) : setLoadingMore(true)

    const from = pageNum * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    const { data } = await supabase
      .from('commandes')
      .select(`
        id, statut, adresse_livraison, total, created_at,
        commande_articles ( id, menu_id, nom, quantite, prix_unitaire,
          menus ( image_url )
        )
      `)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    const rows = (data as unknown as CommandeRow[]) ?? []

    if (pageNum === 0) {
      setCommandes(rows)
    } else {
      setCommandes((prev) => [...prev, ...rows])
    }

    setHasMore(rows.length === PAGE_SIZE)
    pageNum === 0 ? setLoading(false) : setLoadingMore(false)
    isFetching.current = false
  }, [user?.id])

  useEffect(() => {
    if (user?.id) void fetchPage(0)
  }, [user?.id, fetchPage])

  // ── Infinite scroll ────────────────────────────────────────────────────────

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isFetching.current) {
          setPage((p) => {
            const next = p + 1
            void fetchPage(next)
            return next
          })
        }
      },
      { rootMargin: '200px' }
    )
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [hasMore, fetchPage])

  // ── Recommander ────────────────────────────────────────────────────────────

  const handleReorder = useCallback(async (commande: CommandeRow) => {
    setReordering(commande.id)
    try {
      const menuIds = [...new Set(commande.commande_articles.map((a) => a.menu_id))]

      const { data: menus } = await supabase
        .from('menus')
        .select('id, nom, prix, image_url, categorie, disponible, temps_preparation, description, tags')
        .in('id', menuIds)

      const menuMap = new Map(
        ((menus ?? []) as Array<Record<string, unknown>>).map((m) => [m.id as string, m])
      )

      clearCart()

      for (const article of commande.commande_articles) {
        const menuRow = menuMap.get(article.menu_id)
        if (!menuRow) continue

        const imgUrl = menuRow.image_url as string | null | undefined
        const menuItem: MenuItem = {
          id:                       menuRow.id as string,
          category_id:              menuRow.categorie as string,
          name:                     menuRow.nom as string,
          slug:                     (menuRow.id as string).slice(0, 8),
          description:              (menuRow.description as string) ?? '',
          price:                    menuRow.prix as number,
          ...(imgUrl ? { image_url: imgUrl } : {}),
          option_groups:            [],
          is_available:             menuRow.disponible as boolean,
          is_featured:              false,
          preparation_time_minutes: (menuRow.temps_preparation as number) ?? 15,
          tags:                     (menuRow.tags as string[]) ?? [],
          created_at:               (menuRow.created_at as string) ?? new Date().toISOString(),
        }

        const cartItem: CartItem = {
          id:               article.menu_id,
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
  }, [addItem, clearCart, router])

  // ── Render ─────────────────────────────────────────────────────────────────

  const filtered = commandes.filter((c) => matchesFilter(c.statut, filter))
  const tabCounts: Record<FilterTab, number> = {
    all:      commandes.length,
    en_cours: commandes.filter((c) => matchesFilter(c.statut, 'en_cours')).length,
    livrees:  commandes.filter((c) => matchesFilter(c.statut, 'livrees')).length,
    annulees: commandes.filter((c) => matchesFilter(c.statut, 'annulees')).length,
  }

  return (
    <section>
      <SectionTitle>Mes commandes</SectionTitle>

      {/* Onglets filtre */}
      <div
        className="flex gap-2 px-4 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {TABS.map(({ v, label }) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={cn(
              'flex-shrink-0 px-3.5 py-1.5 rounded-full text-[0.8125rem] font-semibold border transition-all',
              filter === v
                ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]'
                : 'border-[var(--border)] text-[var(--text-secondary)]'
            )}
          >
            {label}
            {tabCounts[v] > 0 && (
              <span className="ml-1 opacity-60">({tabCounts[v]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="px-4 mt-3 space-y-2.5">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-[var(--border)] h-28"
                style={{ background: 'var(--bg-surface)', animation: 'pulse 1.5s ease infinite' }}
              />
            ))}
          </>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🍔</div>
            <p className="font-bold text-[var(--text-primary)] mb-1">
              {filter === 'all' ? 'Aucune commande' : 'Aucune commande ici'}
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              {filter === 'all' ? 'Votre historique apparaîtra ici.' : ''}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => router.push('/menu')}
                className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #FF6B00, #CC5500)' }}
              >
                Explorer le menu
              </button>
            )}
          </div>
        ) : (
          filtered.map((commande) => {
            const statut     = commande.statut
            const color      = STATUT_COLOR[statut] ?? '#888'
            const isEnCours  = EN_COURS.includes(statut)
            const totalItems = commande.commande_articles.reduce((acc, a) => acc + a.quantite, 0)
            const preview    = commande.commande_articles
              .slice(0, 3)
              .map((a) => `${a.nom} ×${a.quantite}`)
              .join(', ')
            const reste = commande.commande_articles.length > 3
              ? ` +${commande.commande_articles.length - 3}`
              : ''

            return (
              <div
                key={commande.id}
                className="rounded-2xl border border-[var(--border)] overflow-hidden cursor-pointer transition-transform active:scale-[0.99]"
                style={{ background: 'var(--bg-surface)' }}
                onClick={() => router.push(`/orders/${commande.id}`)}
              >
                {/* Header */}
                <div className="flex justify-between items-start px-3.5 pt-3.5 pb-2">
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">
                      #{commande.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {formatDate(commande.created_at)} · {totalItems} article{totalItems > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isEnCours && (
                      <span
                        className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ background: color, animation: 'pulse 1.5s ease infinite' }}
                      />
                    )}
                    <span
                      className="px-2.5 py-1 rounded-full text-[0.6875rem] font-bold"
                      style={{ background: `${color}20`, color }}
                    >
                      {STATUT_LABEL[statut]}
                    </span>
                  </div>
                </div>

                {/* Aperçu articles + total */}
                <div className="flex items-center gap-2.5 px-3.5 pb-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.8125rem] text-[var(--text-secondary)] truncate">
                      {preview}{reste}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                      📍 {commande.adresse_livraison.split('—')[0]?.trim() ?? commande.adresse_livraison}
                    </p>
                  </div>
                  <p className="text-[0.9375rem] font-bold text-[var(--brand)] flex-shrink-0">
                    {formatPrice(commande.total)}
                  </p>
                </div>

                {/* Actions */}
                <div
                  className="flex justify-between items-center px-3.5 py-2.5 border-t border-[var(--border)]"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleReorder(commande)
                    }}
                    disabled={reordering === commande.id}
                    className={cn(
                      'px-3.5 py-1.5 rounded-xl border text-[0.8125rem] font-semibold transition-colors',
                      'border-[var(--brand)] text-[var(--brand)]',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                  >
                    {reordering === commande.id ? '…' : '🔄 Recommander'}
                  </button>
                  <span className="text-[0.8125rem] text-[var(--text-muted)]">
                    Voir détails →
                  </span>
                </div>
              </div>
            )
          })
        )}

        {/* Sentinel infinite scroll */}
        <div ref={sentinelRef} className="h-1" aria-hidden />

        {loadingMore && (
          <div className="text-center py-3 text-sm text-[var(--text-muted)]">
            Chargement…
          </div>
        )}

        {!hasMore && !loading && commandes.length > 0 && (
          <p className="text-center text-xs text-[var(--text-muted)] py-2">
            Fin de l&apos;historique
          </p>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ADRESSES SAUVEGARDÉES
// ═══════════════════════════════════════════════════════════════════════════════

function AddressCard({
  adresse,
  isDefault,
  onDelete,
}: {
  adresse: AdresseSauvegardee
  isDefault: boolean
  onDelete: () => void
}) {
  const [offsetX,    setOffsetX]    = useState(0)
  const startX      = useRef(0)
  const isSwiping   = useRef(false)
  const THRESHOLD   = 50
  const MAX_OFFSET  = 72

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current    = e.touches[0]!.clientX
    isSwiping.current = true
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current) return
    const dx = startX.current - e.touches[0]!.clientX
    if (dx > 0) setOffsetX(Math.min(dx, MAX_OFFSET))
    else if (offsetX > 0) setOffsetX(0)
  }

  const onTouchEnd = () => {
    isSwiping.current = false
    setOffsetX((prev) => (prev > THRESHOLD ? MAX_OFFSET : 0))
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Fond rouge — bouton supprimer */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 rounded-xl"
        style={{ width: MAX_OFFSET }}
        aria-hidden
      >
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="flex flex-col items-center gap-0.5 text-white"
          aria-label={`Supprimer l'adresse ${adresse.label}`}
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-[10px] font-bold">Suppr.</span>
        </button>
      </div>

      {/* Carte glissante */}
      <div
        className="relative bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3.5"
        style={{
          transform:  `translateX(-${offsetX}px)`,
          transition: isSwiping.current ? 'none' : 'transform 0.2s ease',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => { if (offsetX > 0) setOffsetX(0) }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none mt-0.5" aria-hidden>
            {adresseIcon(adresse.label)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {adresse.label}
              </p>
              {isDefault && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--brand)]/10 text-[var(--brand)]">
                  Par défaut
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
              {adresse.adresse_complete}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              📍 {adresse.quartier}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SavedAddresses() {
  const { user }     = useAuth()
  const [addOpen,    setAddOpen]    = useState(false)
  const [label,      setLabel]      = useState('Maison')
  const [quartier,   setQuartier]   = useState('')
  const [adresseTxt, setAdresseTxt] = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const [localAdresses, setLocalAdresses] = useState<AdresseSauvegardee[]>(
    () => user?.adresses_sauvegardees ?? []
  )

  useEffect(() => {
    setLocalAdresses(user?.adresses_sauvegardees ?? [])
  }, [user?.adresses_sauvegardees])

  // ── Persister ──────────────────────────────────────────────────────────────

  const persistAdresses = useCallback(async (adresses: AdresseSauvegardee[]) => {
    await fetch('/api/users/addresses', {
      method:      'PATCH',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:        JSON.stringify({ adresses }),
    })
  }, [])

  // ── Supprimer ──────────────────────────────────────────────────────────────

  const handleDelete = useCallback((index: number) => {
    setLocalAdresses((prev) => {
      const next = prev.filter((_, i) => i !== index)
      void persistAdresses(next)
      return next
    })
  }, [persistAdresses])

  // ── Ajouter ────────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!adresseTxt.trim() || !quartier) {
      setError('Remplissez tous les champs.')
      return
    }
    if (localAdresses.length >= 3) {
      setError('Maximum 3 adresses autorisées.')
      return
    }

    setSaving(true)
    setError(null)

    const newAdresse: AdresseSauvegardee = {
      label,
      quartier,
      adresse_complete: adresseTxt.trim(),
      latitude:  null,
      longitude: null,
    }

    const next = [...localAdresses, newAdresse]
    setLocalAdresses(next)
    await persistAdresses(next)

    setSaving(false)
    setAddOpen(false)
    setLabel('Maison')
    setQuartier('')
    setAdresseTxt('')
  }

  const inputCls = cn(
    'w-full px-3 py-2.5 rounded-xl border bg-[var(--bg-elevated)]',
    'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50',
    'border-[var(--border)] transition-colors text-sm',
  )

  return (
    <section>
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-base font-bold text-[var(--text-primary)]">
          Mes adresses
        </h2>
        {localAdresses.length < 3 && (
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--brand)] text-[var(--brand)] text-sm font-semibold transition-colors active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        )}
      </div>

      <div className="px-4 space-y-2.5">
        {localAdresses.length === 0 ? (
          <div className="text-center py-8 rounded-2xl border border-dashed border-[var(--border)]">
            <p className="text-3xl mb-2">📍</p>
            <p className="text-sm text-[var(--text-muted)]">Aucune adresse sauvegardée</p>
            <button
              onClick={() => setAddOpen(true)}
              className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #FF6B00, #CC5500)' }}
            >
              Ajouter une adresse
            </button>
          </div>
        ) : (
          localAdresses.map((addr, i) => (
            <AddressCard
              key={`${addr.label}-${i}`}
              adresse={addr}
              isDefault={i === 0}
              onDelete={() => handleDelete(i)}
            />
          ))
        )}
      </div>

      {/* Modal ajouter adresse */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nouvelle adresse">
        <div className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Type
            </label>
            <div className="flex gap-2">
              {['Maison', 'Travail', 'Autre'].map((lbl) => (
                <button
                  key={lbl}
                  onClick={() => setLabel(lbl)}
                  className={cn(
                    'flex-1 py-2 rounded-xl border text-sm font-semibold transition-all',
                    label === lbl
                      ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)]',
                  )}
                >
                  {adresseIcon(lbl)} {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Quartier */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Quartier
            </label>
            <select
              value={quartier}
              onChange={(e) => setQuartier(e.target.value)}
              className={inputCls}
            >
              <option value="">Choisir un quartier</option>
              {QUARTIERS_MAROUA.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>

          {/* Adresse complète */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Adresse complète
            </label>
            <input
              type="text"
              value={adresseTxt}
              onChange={(e) => setAdresseTxt(e.target.value)}
              placeholder="Ex: Près de la grande mosquée, maison bleue"
              className={inputCls}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <ModalFooter>
          <button
            onClick={() => { setAddOpen(false); setError(null) }}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => { void handleAdd() }}
            disabled={saving}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all',
              'bg-[var(--brand)] hover:bg-[var(--brand-dark)] active:scale-95',
              saving && 'opacity-60 cursor-not-allowed',
            )}
          >
            {saving ? 'Ajout…' : 'Sauvegarder'}
          </button>
        </ModalFooter>
      </Modal>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PARAMÈTRES
// ═══════════════════════════════════════════════════════════════════════════════

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/60',
        checked ? 'bg-[var(--brand)]' : 'bg-[var(--bg-overlay)]',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}

function SettingRow({
  icon,
  label,
  sublabel,
  right,
}: {
  icon: React.ReactNode
  label: string
  sublabel?: string
  right: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] last:border-0">
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
        {sublabel && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sublabel}</p>}
      </div>
      {right}
    </div>
  )
}

export function Settings() {
  const { user, updateProfile, logout } = useAuth()
  const router = useRouter()

  const [fcmEnabled,      setFcmEnabled]      = useState(false)
  const [fcmLoading,      setFcmLoading]      = useState(false)
  const [fcmError,        setFcmError]        = useState<string | null>(null)
  const [isDark,          setIsDark]          = useState(true)
  const [logoutOpen,      setLogoutOpen]      = useState(false)
  const [logoutLoading,   setLogoutLoading]   = useState(false)

  // ── Init états ─────────────────────────────────────────────────────────────

  useEffect(() => {
    // FCM : activé si token sauvegardé
    setFcmEnabled(Boolean(user?.fcm_token))
    // Thème : lit data-theme sur <html>
    setIsDark(document.documentElement.dataset.theme !== 'light')
  }, [user?.fcm_token])

  // ── FCM toggle ─────────────────────────────────────────────────────────────

  const handleFcmToggle = async (enable: boolean) => {
    setFcmLoading(true)
    setFcmError(null)

    try {
      if (enable) {
        const { requestFCMToken } = await import('@/lib/firebase')
        const token = await requestFCMToken()
        if (!token) {
          setFcmError('Permission refusée. Autorisez les notifications dans vos paramètres.')
          setFcmLoading(false)
          return
        }
        const ok = await updateProfile({ fcm_token: token })
        if (ok) setFcmEnabled(true)
      } else {
        const ok = await updateProfile({ fcm_token: '' })
        if (ok) setFcmEnabled(false)
      }
    } catch {
      setFcmError('Erreur lors de la configuration des notifications.')
    } finally {
      setFcmLoading(false)
    }
  }

  // ── Thème toggle ───────────────────────────────────────────────────────────

  const handleThemeToggle = (wantLight: boolean) => {
    const html = document.documentElement
    if (wantLight) {
      html.dataset.theme = 'light'
      localStorage.setItem('daada-theme', 'light')
    } else {
      delete html.dataset.theme
      localStorage.setItem('daada-theme', 'dark')
    }
    setIsDark(!wantLight)
  }

  // ── Déconnexion ────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    setLogoutLoading(true)
    await logout()
    router.replace('/login')
  }

  return (
    <section>
      <SectionTitle>Paramètres</SectionTitle>

      <div
        className="mx-4 rounded-2xl border border-[var(--border)] overflow-hidden"
        style={{ background: 'var(--bg-surface)' }}
      >
        {/* Notifications push */}
        <SettingRow
          icon={fcmEnabled
            ? <Bell className="h-4 w-4 text-[var(--brand)]" />
            : <BellOff className="h-4 w-4 text-[var(--text-muted)]" />
          }
          label="Notifications push"
          sublabel={
            fcmError
              ? fcmError
              : fcmEnabled
                ? 'Activées — vous recevez les mises à jour de commande'
                : 'Désactivées'
          }
          right={
            <Toggle
              checked={fcmEnabled}
              onChange={(v) => { void handleFcmToggle(v) }}
              disabled={fcmLoading}
            />
          }
        />

        {/* Thème */}
        <SettingRow
          icon={isDark
            ? <Moon className="h-4 w-4 text-[var(--text-primary)]" />
            : <Sun className="h-4 w-4 text-yellow-500" />
          }
          label={isDark ? 'Mode sombre' : 'Mode clair'}
          sublabel="Apparence de l'application"
          right={
            <Toggle
              checked={!isDark}
              onChange={(v) => handleThemeToggle(v)}
            />
          }
        />

        {/* Déconnexion */}
        <SettingRow
          icon={<LogOut className="h-4 w-4 text-red-500" />}
          label="Se déconnecter"
          sublabel={user?.telephone ?? ''}
          right={
            <button
              onClick={() => setLogoutOpen(true)}
              className="px-3 py-1.5 rounded-xl text-sm font-semibold text-red-500 border border-red-500/30 hover:bg-red-500/10 transition-colors active:scale-95"
            >
              Quitter
            </button>
          }
        />
      </div>

      {/* Modal confirmation déconnexion */}
      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Se déconnecter ?"
      >
        <p className="text-sm text-[var(--text-secondary)] mb-2">
          Vous serez redirigé vers la page de connexion.
          Votre panier local sera conservé.
        </p>

        <ModalFooter>
          <button
            onClick={() => setLogoutOpen(false)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => { void handleLogout() }}
            disabled={logoutLoading}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500',
              'hover:bg-red-600 active:scale-95 transition-all',
              logoutLoading && 'opacity-60 cursor-not-allowed',
            )}
          >
            {logoutLoading ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
        </ModalFooter>
      </Modal>
    </section>
  )
}
