'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { formatPrice } from '@/lib/utils'
import { useCartStore } from '@/stores/cart.store'
import { useFlyToCart } from '@/components/features/FlyToCartProvider'
import type { Database } from '@/lib/supabase'
import type { MenuItem } from '@/types/menu'

type Plat = Database['public']['Tables']['menus']['Row']

interface PlatDetailSheetProps {
  plat: Plat | null
  suggestions: Plat[]
  onClose: () => void
  onSelectPlat: (plat: Plat) => void
}

function platToMenuItem(plat: Plat): MenuItem {
  return {
    id: plat.id,
    category_id: plat.categorie,
    name: plat.nom,
    slug: plat.id,
    description: plat.description,
    price: plat.prix,
    image_url: plat.image_url ?? '',
    option_groups: [],
    is_available: plat.disponible,
    is_featured: plat.nb_commandes > 10,
    preparation_time_minutes: plat.temps_preparation,
    tags: plat.tags,
    created_at: plat.created_at,
  }
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

function Stars({ note }: { note: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < Math.round(note) ? '#FFD700' : 'var(--border-strong)', fontSize: '0.875rem' }}>
          ★
        </span>
      ))}
    </span>
  )
}

export default function PlatDetailSheet({ plat, suggestions, onClose, onSelectPlat }: PlatDetailSheetProps) {
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const addItem  = useCartStore((s) => s.addItem)
  const { fly }  = useFlyToCart()
  const addBtnRef = useRef<HTMLButtonElement>(null)

  const handleAdd = useCallback(() => {
    if (!plat) return
    const mi = platToMenuItem(plat)
    addItem({
      id: `${plat.id}-default`,
      menuItem: mi,
      quantity: qty,
      selectedOptions: [],
      unitPrice: plat.prix,
      totalPrice: plat.prix * qty,
    })
    // Fly-to-cart animation from button position
    if (addBtnRef.current) {
      fly(addBtnRef.current.getBoundingClientRect(), plat.image_url ?? undefined, catEmoji(plat.categorie))
    }
    setAdded(true)
    setTimeout(() => {
      setAdded(false)
      onClose()
    }, 900)
  }, [plat, qty, addItem, fly, onClose])

  const incQty = () => setQty(q => Math.min(q + 1, 20))
  const decQty = () => setQty(q => Math.max(q - 1, 1))

  if (!plat) return null

  const totalPrice = plat.prix * qty

  return (
    <BottomSheet open={!!plat} onClose={onClose} height="auto">
      {/* Image hero — touch-action: pinch-zoom for native mobile zoom */}
      <div
        style={{
          position: 'relative',
          height: 220,
          flexShrink: 0,
          touchAction: 'pinch-zoom',
          overflow: 'hidden',
        }}
      >
        {plat.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={plat.image_url}
            alt={plat.nom}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '5rem',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
            }}
          >
            {catEmoji(plat.categorie)}
          </div>
        )}
        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)',
          }}
        />
        {/* Close btn */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.125rem',
            border: 'none',
            backdropFilter: 'blur(8px)',
          }}
          aria-label="Fermer"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '1rem 1.25rem 0' }}>
        {/* Badges row */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.625rem' }}>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 999,
              background: 'rgba(249,115,22,0.15)',
              color: 'var(--brand)',
              border: '1px solid rgba(249,115,22,0.3)',
            }}
          >
            {catEmoji(plat.categorie)} {plat.categorie}
          </span>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 999,
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
            }}
          >
            ⏱ {plat.temps_preparation} min
          </span>
          {plat.tags.includes('vegetarien') && (
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
              🥗 Végétarien
            </span>
          )}
        </div>

        {/* Title + rating */}
        <h2
          className="font-display"
          style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.375rem' }}
        >
          {plat.nom}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Stars note={plat.note_moyenne} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {plat.note_moyenne.toFixed(1)} · {plat.nb_commandes} commandes
          </span>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          {plat.description}
        </p>

        {/* Quantity selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Quantité</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={decQty}
              disabled={qty <= 1}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: qty <= 1 ? 'var(--bg-elevated)' : 'var(--bg-overlay)',
                color: qty <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                fontSize: '1.25rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border)',
                transition: 'all var(--t-base)',
              }}
              aria-label="Diminuer quantité"
            >
              −
            </button>
            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', minWidth: 24, textAlign: 'center' }}>
              {qty}
            </span>
            <button
              onClick={incQty}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--brand)',
                color: 'white',
                fontSize: '1.25rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                transition: 'all var(--t-base)',
              }}
              aria-label="Augmenter quantité"
            >
              +
            </button>
          </div>
        </div>

        {/* Add to cart button */}
        <button
          ref={addBtnRef}
          onClick={handleAdd}
          disabled={added}
          style={{
            width: '100%',
            padding: '0.875rem',
            borderRadius: 'var(--radius-xl)',
            background: added
              ? 'linear-gradient(135deg, #22C55E, #16A34A)'
              : 'linear-gradient(135deg, #F97316, #EA580C)',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 700,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: added ? '0 4px 16px rgba(34,197,94,0.4)' : '0 4px 20px rgba(249,115,22,0.4)',
            transition: 'all 0.3s ease',
            marginBottom: '1rem',
          }}
        >
          {added ? (
            <>
              <span style={{ fontSize: '1.125rem' }}>✓</span>
              Ajouté au panier !
            </>
          ) : (
            <>
              🛒 Ajouter — {formatPrice(totalPrice)}
            </>
          )}
        </button>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Vous aimerez aussi
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }} className="no-scrollbar">
              {suggestions.map(s => (
                <button
                  key={s.id}
                  onClick={() => onSelectPlat(s)}
                  style={{
                    flexShrink: 0,
                    width: 120,
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      height: 70,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      background: s.image_url ? 'none' : 'linear-gradient(135deg, #F97316, #EA580C)',
                    }}
                  >
                    {s.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.image_url} alt={s.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    ) : catEmoji(s.categorie)}
                  </div>
                  <div style={{ padding: '0.375rem 0.5rem' }}>
                    <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.nom}
                    </p>
                    <p style={{ fontSize: '0.625rem', color: 'var(--brand)', fontWeight: 700 }}>{formatPrice(s.prix)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* View full cart CTA */}
        <div style={{ paddingBottom: '1rem' }}>
          <Link
            href="/cart"
            style={{
              display: 'block',
              textAlign: 'center',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              padding: '0.5rem',
            }}
          >
            Voir mon panier →
          </Link>
        </div>
      </div>
    </BottomSheet>
  )
}
