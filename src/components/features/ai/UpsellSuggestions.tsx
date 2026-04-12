'use client'

/**
 * Suggestions upsell dans le panier
 *
 * - Reçoit les cartItems depuis le store
 * - Appelle POST /api/ai/upsell
 * - Affiche 2 cartes compactes avec "Ajouter"
 * - Skeleton pendant le chargement
 */

import { useEffect, useState } from 'react'
import { useCartStore } from '@/stores/cart.store'
import { formatPrice } from '@/lib/utils'
import type { UpsellSuggestion } from '@/services/ai/upsell'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function UpsellSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="animate-shimmer"
          style={{ height: 68, borderRadius: 12, background: 'var(--bg-elevated)' }}
        />
      ))}
    </div>
  )
}

// ─── Upsell card ─────────────────────────────────────────────────────────────

function UpsellCard({ suggestion, onAdd }: {
  suggestion: UpsellSuggestion
  onAdd: (s: UpsellSuggestion) => void
}) {
  return (
    <div style={{
      display:       'flex',
      alignItems:    'center',
      gap:           '0.625rem',
      padding:       '0.625rem',
      borderRadius:  12,
      background:    'var(--bg-elevated)',
      border:        '1px solid var(--border)',
    }}>
      {/* Thumbnail */}
      <div style={{
        width:        52,
        height:       52,
        borderRadius: 10,
        overflow:     'hidden',
        flexShrink:   0,
        background:   'linear-gradient(135deg, #F97316, #EA580C)',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        fontSize:     '1.5rem',
      }}>
        {suggestion.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={suggestion.imageUrl}
            alt={suggestion.nom}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : '🍔'}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize:     '0.8125rem',
          fontWeight:   600,
          color:        'var(--text-primary)',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
        }}>
          {suggestion.nom}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: 2 }}>
          <span style={{
            fontSize:   '0.625rem',
            fontWeight: 600,
            padding:    '1px 6px',
            borderRadius: 999,
            background: 'rgba(249,115,22,0.15)',
            color:      '#F97316',
          }}>
            {suggestion.reason}
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand)' }}>
            {formatPrice(suggestion.prix)}
          </span>
        </div>
      </div>

      {/* Add button */}
      <button
        onClick={() => onAdd(suggestion)}
        style={{
          flexShrink:      0,
          width:           32,
          height:          32,
          borderRadius:    '50%',
          background:      'var(--brand)',
          color:           'white',
          border:          'none',
          fontSize:        '1.25rem',
          fontWeight:      700,
          cursor:          'pointer',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          transition:      'transform 0.15s, background 0.15s',
        }}
        onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)' }}
        onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
        aria-label={`Ajouter ${suggestion.nom}`}
      >
        +
      </button>
    </div>
  )
}

// ─── UpsellSuggestions ────────────────────────────────────────────────────────

export default function UpsellSuggestions() {
  const items = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)

  const [suggestions, setSuggestions] = useState<UpsellSuggestion[]>([])
  const [loading,     setLoading]     = useState(false)
  const [dismissed,   setDismissed]   = useState(false)

  useEffect(() => {
    if (!items.length || dismissed) return

    setLoading(true)

    const controller = new AbortController()

    fetch('/api/ai/upsell', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ cartItems: items }),
      signal:  controller.signal,
    })
      .then((r) => r.json())
      .then((data: { suggestions?: UpsellSuggestion[] }) => {
        setSuggestions(data.suggestions ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [items, dismissed])

  function handleAdd(suggestion: UpsellSuggestion) {
    addItem({
      id:        suggestion.menuId,
      menuItem: {
        id:                       suggestion.menuId,
        name:                     suggestion.nom,
        price:                    suggestion.prix,
        ...(suggestion.imageUrl != null && { image_url: suggestion.imageUrl }),
        category_id:              '',
        slug:                     suggestion.menuId,
        description:              '',
        option_groups:            [],
        is_available:             true,
        is_featured:              false,
        preparation_time_minutes: 15,
        tags:                     [],
        created_at:               new Date().toISOString(),
      },
      quantity:        1,
      selectedOptions: [],
      unitPrice:       suggestion.prix,
      totalPrice:      suggestion.prix,
    })
    // Supprimer la suggestion ajoutée
    setSuggestions((prev) => prev.filter((s) => s.menuId !== suggestion.menuId))
  }

  if (!items.length || (!loading && !suggestions.length)) return null
  if (dismissed) return null

  return (
    <div style={{ marginTop: '1.25rem' }}>
      {/* En-tête */}
      <div style={{
        display:       'flex',
        alignItems:    'center',
        justifyContent:'space-between',
        marginBottom:  '0.625rem',
      }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          🎯 Ajouter à la commande ?
        </p>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            border:     'none',
            color:      'var(--text-muted)',
            fontSize:   '1rem',
            cursor:     'pointer',
            padding:    '0 4px',
          }}
          aria-label="Fermer les suggestions"
        >
          ✕
        </button>
      </div>

      {loading ? <UpsellSkeleton /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {suggestions.map((s) => (
            <UpsellCard key={s.menuId} suggestion={s} onAdd={handleAdd} />
          ))}
        </div>
      )}
    </div>
  )
}
