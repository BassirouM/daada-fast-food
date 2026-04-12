'use client'

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from 'react'
import { useSearchParams } from 'next/navigation'
import useSWRInfinite from 'swr/infinite'
import type { Fetcher } from 'swr'
import { SkeletonMenuCard } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/utils'
import type { Database } from '@/lib/supabase'
import type { MenuApiResponse } from '@/app/api/menu/route'
import PlatDetailSheet from '@/components/features/menu/PlatDetailSheet'

// ─── Types ───────────────────────────────────────────────────────────────────

type Plat = Database['public']['Tables']['menus']['Row']

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: 'Tout', slug: '' },
  { label: '🍔 Burgers', slug: 'burger' },
  { label: '🍗 Poulet', slug: 'poulet' },
  { label: '🍕 Pizza', slug: 'pizza' },
  { label: '🥤 Boissons', slug: 'boisson' },
  { label: '🍰 Desserts', slug: 'dessert' },
  { label: '🥪 Sandwichs', slug: 'sandwich' },
  { label: '🍟 Frites', slug: 'frites' },
  { label: '🥗 Salades', slug: 'salade' },
]

const SORTS = [
  { label: '🔥 Populaire', value: 'populaire' },
  { label: '💰 Prix ↑',    value: 'prix_asc'   },
  { label: '💰 Prix ↓',    value: 'prix_desc'  },
  { label: '🆕 Nouveau',   value: 'nouveau'    },
  { label: '🥗 Végétarien', value: 'vegetarien' },
]

const HISTORY_KEY = 'daada-search-history'
const VIEW_KEY    = 'daada-view-mode'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') }
  catch { return [] }
}
function saveToHistory(term: string) {
  const h = getHistory().filter(t => t !== term)
  localStorage.setItem(HISTORY_KEY, JSON.stringify([term, ...h].slice(0, 5)))
}

const CATEGORY_EMOJIS: Record<string, string> = {
  burger: '🍔', poulet: '🍗', pizza: '🍕',
  boisson: '🥤', dessert: '🍰', sandwich: '🥪',
  frites: '🍟', salade: '🥗',
}
function catEmoji(c: string) {
  const k = c.toLowerCase()
  return Object.entries(CATEGORY_EMOJIS).find(([key]) => k.includes(key))?.[1] ?? '🍽️'
}

const fetcher: Fetcher<MenuApiResponse, string> = (url) =>
  fetch(url).then(r => r.json())

// ─── Sub-components ───────────────────────────────────────────────────────────

function GridCard({ plat, index, onOpen }: { plat: Plat; index: number; onOpen: (p: Plat) => void }) {
  return (
    <div
      className="animate-fade-in glass-card"
      style={{
        background: 'var(--bg-surface)',
        overflow: 'hidden',
        cursor: 'pointer',
        animationDelay: `${(index % 12) * 0.04}s`,
      }}
      onClick={() => onOpen(plat)}
    >
      <div style={{ position: 'relative', overflow: 'hidden', paddingBottom: '66%' }}>
        {plat.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={plat.image_url}
            alt={plat.nom}
            loading="lazy"
            decoding="async"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.75rem',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
            }}
          >
            {catEmoji(plat.categorie)}
          </div>
        )}
        {/* Bottom gradient overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '55%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Name + price overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.5rem 0.625rem' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {plat.nom}
          </p>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FB923C' }}>
            {formatPrice(plat.prix)}
          </p>
        </div>
        {/* Rating badge */}
        {plat.note_moyenne > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
              fontSize: '0.625rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 999,
              background: 'rgba(0,0,0,0.65)',
              color: '#FFD700',
              backdropFilter: 'blur(6px)',
            }}
          >
            ⭐ {plat.note_moyenne.toFixed(1)}
          </span>
        )}
        {/* + button */}
        <button
          onClick={e => { e.stopPropagation(); onOpen(plat) }}
          style={{
            position: 'absolute',
            bottom: 6,
            right: 6,
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'var(--brand)',
            color: 'white',
            fontSize: '1.125rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            boxShadow: '0 2px 8px rgba(249,115,22,0.5)',
          }}
          aria-label={`Commander ${plat.nom}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

function ListCard({ plat, index, onOpen }: { plat: Plat; index: number; onOpen: (p: Plat) => void }) {
  const [qty, setQty] = useState(0)

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        gap: '0.75rem',
        padding: '0.75rem',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        animationDelay: `${(index % 12) * 0.04}s`,
      }}
      onClick={() => onOpen(plat)}
    >
      <div
        style={{
          width: 80,
          height: 80,
          flexShrink: 0,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #F97316, #EA580C)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
        }}
      >
        {plat.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={plat.image_url} alt={plat.nom} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : catEmoji(plat.categorie)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {plat.nom}
        </p>
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          marginTop: 2,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {plat.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand)' }}>
            {formatPrice(plat.prix)}
          </span>
          {/* Inline quantity */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
            onClick={e => e.stopPropagation()}
          >
            {qty > 0 && (
              <>
                <button
                  onClick={() => setQty(q => Math.max(0, q - 1))}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: 'var(--bg-overlay)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border)',
                  }}
                >
                  −
                </button>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', minWidth: 16, textAlign: 'center' }}>
                  {qty}
                </span>
              </>
            )}
            <button
              onClick={() => { setQty(q => q + 1); onOpen(plat) }}
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'var(--brand)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
              }}
              aria-label={`Commander ${plat.nom}`}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ search }: { search: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
      <h3 className="font-display" style={{ fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        Aucun résultat
      </h3>
      {search ? (
        <>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Aucun plat trouvé pour &ldquo;<strong>{search}</strong>&rdquo;
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Essayez : soya, poulet grillé, jus de fruit…
          </p>
        </>
      ) : (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Aucun plat disponible dans cette catégorie pour l&apos;instant.
        </p>
      )}
    </div>
  )
}

// ─── Main inner component (needs Suspense for useSearchParams) ────────────────

function MenuPageInner() {
  const searchParams = useSearchParams()

  const [activeCategory, setActiveCategory] = useState(searchParams.get('categorie') ?? '')
  const [activeSort, setActiveSort]         = useState('populaire')
  const [searchInput, setSearchInput]       = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [viewMode, setViewMode]             = useState<'grid' | 'list'>('grid')
  const [searchFocused, setSearchFocused]   = useState(false)
  const [history, setHistory]               = useState<string[]>([])
  const [selectedPlat, setSelectedPlat]     = useState<Plat | null>(null)

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const searchRef   = useRef<HTMLInputElement>(null)

  // Init localStorage preferences
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY) as 'grid' | 'list' | null
    if (saved) setViewMode(saved)
    setHistory(getHistory())
  }, [])

  // Debounce search 300ms
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(id)
  }, [searchInput])

  // SWR key builder
  const getKey = useCallback(
    (pageIndex: number, prev: MenuApiResponse | null) => {
      if (prev && prev.plats.length === 0) return null
      const p = new URLSearchParams()
      if (activeCategory)  p.set('categorie', activeCategory)
      if (debouncedSearch) p.set('search', debouncedSearch)
      if (activeSort !== 'populaire') p.set('sort', activeSort)
      p.set('page', String(pageIndex + 1))
      return `/api/menu?${p.toString()}`
    },
    [activeCategory, debouncedSearch, activeSort]
  )

  const { data, size: _size, setSize, isLoading } = useSWRInfinite<MenuApiResponse>(
    getKey,
    fetcher,
    { revalidateFirstPage: false }
  )

  // Reset to page 1 on filter change
  useEffect(() => { setSize(1) }, [activeCategory, debouncedSearch, activeSort, setSize])

  const allPlats: Plat[] = data ? data.flatMap(d => d.plats) : []
  const total    = data?.[0]?.total ?? 0
  const isEmpty  = !isLoading && allPlats.length === 0
  const hasMore  = allPlats.length < total

  // IntersectionObserver — infinite scroll trigger
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoading && hasMore) {
          setSize(s => s + 1)
        }
      },
      { threshold: 0.1, rootMargin: '120px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isLoading, hasMore, setSize])

  const handleViewToggle = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem(VIEW_KEY, mode)
  }

  const handleSearchSubmit = (term: string) => {
    if (!term.trim()) return
    saveToHistory(term.trim())
    setHistory(getHistory())
    setSearchInput(term.trim())
    setSearchFocused(false)
  }

  const handleOpenPlat = useCallback((plat: Plat) => setSelectedPlat(plat), [])

  const suggestions = selectedPlat
    ? allPlats.filter(p => p.categorie === selectedPlat.categorie && p.id !== selectedPlat.id).slice(0, 4)
    : []

  return (
    <>
      {/* ─── STICKY SUB-HEADER ────────────────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: '3.5rem',
          zIndex: 30,
          background: 'var(--bg-base)',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.5rem',
        }}
      >
        {/* Category tabs */}
        <div
          className="no-scrollbar"
          style={{
            display: 'flex',
            gap: '0.375rem',
            overflowX: 'auto',
            padding: '0.625rem 1rem 0',
            scrollSnapType: 'x mandatory',
          }}
        >
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.slug
            return (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                style={{
                  flexShrink: 0,
                  scrollSnapAlign: 'start',
                  padding: '0.375rem 0.875rem',
                  borderRadius: 999,
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? 'var(--brand)' : 'var(--bg-elevated)',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  border: isActive ? 'none' : '1px solid var(--border)',
                  transition: 'all var(--t-base)',
                  boxShadow: isActive ? 'var(--shadow-brand)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Search + view toggle row */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 1rem 0' }}>
          {/* Search */}
          <div style={{ flex: 1, position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            >
              🔍
            </span>
            <input
              ref={searchRef}
              type="search"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              onKeyDown={e => e.key === 'Enter' && handleSearchSubmit(searchInput)}
              placeholder="Rechercher un plat…"
              style={{
                width: '100%',
                paddingLeft: '2rem',
                paddingRight: searchInput ? '2rem' : '0.75rem',
                paddingBlock: '0.5rem',
                borderRadius: 999,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); searchRef.current?.focus() }}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontSize: '1rem',
                  background: 'none',
                  border: 'none',
                  lineHeight: 1,
                }}
                aria-label="Effacer"
              >
                ×
              </button>
            )}
          </div>

          {/* Grid / List toggle */}
          <div
            style={{
              display: 'flex',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {(['grid', 'list'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => handleViewToggle(mode)}
                style={{
                  width: 34,
                  height: 34,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  background: viewMode === mode ? 'var(--brand)' : 'transparent',
                  color: viewMode === mode ? 'white' : 'var(--text-muted)',
                  border: 'none',
                  transition: 'all var(--t-base)',
                }}
                aria-label={mode === 'grid' ? 'Vue grille' : 'Vue liste'}
              >
                {mode === 'grid' ? '⊞' : '☰'}
              </button>
            ))}
          </div>
        </div>

        {/* Sort filters */}
        <div
          className="no-scrollbar"
          style={{
            display: 'flex',
            gap: '0.375rem',
            overflowX: 'auto',
            padding: '0.5rem 1rem 0',
          }}
        >
          {SORTS.map(s => {
            const isActive = activeSort === s.value
            return (
              <button
                key={s.value}
                onClick={() => setActiveSort(s.value)}
                style={{
                  flexShrink: 0,
                  padding: '0.25rem 0.75rem',
                  borderRadius: 999,
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? 'rgba(249,115,22,0.15)' : 'var(--bg-elevated)',
                  color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid rgba(249,115,22,0.4)' : '1px solid var(--border)',
                  transition: 'all var(--t-base)',
                  whiteSpace: 'nowrap',
                }}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── SEARCH HISTORY DROPDOWN ────────────────────────────────────────── */}
      {searchFocused && !debouncedSearch && history.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(3.5rem + 6.75rem)',
            left: '1rem',
            right: '1rem',
            zIndex: 40,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
            maxWidth: 480,
            marginInline: 'auto',
          }}
        >
          <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0.5rem 1rem 0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recherches récentes
          </p>
          {history.map(term => (
            <button
              key={term}
              onClick={() => { setSearchInput(term); setSearchFocused(false) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                width: '100%',
                padding: '0.625rem 1rem',
                background: 'none',
                border: 'none',
                borderTop: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                textAlign: 'left',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>🕐</span>
              {term}
            </button>
          ))}
        </div>
      )}

      {/* ─── ITEMS ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: '1rem' }}>
        {/* Result count */}
        {total > 0 && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>
            {total} plat{total > 1 ? 's' : ''}
            {debouncedSearch ? ` pour "${debouncedSearch}"` : activeCategory ? ` en ${activeCategory}` : ' disponibles'}
          </p>
        )}

        {/* Loading skeleton */}
        {isLoading && allPlats.length === 0 && (
          viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonMenuCard key={i} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-shimmer" style={{ height: 96, borderRadius: 'var(--radius-xl)' }} />
              ))}
            </div>
          )
        )}

        {/* Empty state */}
        {isEmpty && <EmptyState search={debouncedSearch} />}

        {/* Grid */}
        {!isEmpty && viewMode === 'grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {allPlats.map((plat, i) => (
              <GridCard key={plat.id} plat={plat} index={i} onOpen={handleOpenPlat} />
            ))}
          </div>
        )}

        {/* List */}
        {!isEmpty && viewMode === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {allPlats.map((plat, i) => (
              <ListCard key={plat.id} plat={plat} index={i} onOpen={handleOpenPlat} />
            ))}
          </div>
        )}

        {/* Loading more spinner */}
        {isLoading && allPlats.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}>
            <div
              className="animate-spin"
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: '2px solid var(--border)',
                borderTopColor: 'var(--brand)',
              }}
            />
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={loadMoreRef} style={{ height: 1 }} aria-hidden="true" />
      </div>

      {/* ─── DETAIL SHEET ───────────────────────────────────────────────────── */}
      <PlatDetailSheet
        plat={selectedPlat}
        suggestions={suggestions}
        onClose={() => setSelectedPlat(null)}
        onSelectPlat={p => setSelectedPlat(p)}
      />
    </>
  )
}

// ─── Page export with Suspense boundary ──────────────────────────────────────

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonMenuCard key={i} />)}
          </div>
        </div>
      }
    >
      <MenuPageInner />
    </Suspense>
  )
}
