'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useCartStore, FRAIS_LIVRAISON } from '@/stores/cart.store'
import { useUIStore } from '@/stores/ui.store'
import { useToast } from '@/components/ui/toast'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { formatPrice } from '@/lib/utils'
import type { CartItem } from '@/stores/cart.store'

// ─── Cart item row with swipe-to-delete ──────────────────────────────────────
function CartItemRow({
  item,
  onRemove,
  onUpdateQty,
}: {
  item: CartItem
  onRemove: (id: string) => void
  onUpdateQty: (id: string, qty: number) => void
}) {
  const touchStartX = useRef(0)
  const [swipeX, setSwipeX] = useState(0)
  const [leaving, setLeaving] = useState(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? 0
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = (e.touches[0]?.clientX ?? 0) - touchStartX.current
    if (dx < 0) setSwipeX(Math.min(Math.abs(dx), 120))
  }
  const handleTouchEnd = () => {
    if (swipeX > 80) {
      setLeaving(true)
      setTimeout(() => onRemove(item.id), 280)
    } else {
      setSwipeX(0)
    }
  }

  const inc = () => {
    if ('vibrate' in navigator) navigator.vibrate(8)
    onUpdateQty(item.id, item.quantity + 1)
  }
  const dec = () => {
    if ('vibrate' in navigator) navigator.vibrate(8)
    onUpdateQty(item.id, item.quantity - 1)
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-xl)' }}>
      {/* Delete reveal background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: '1rem',
          background: 'var(--danger)',
          borderRadius: 'var(--radius-xl)',
        }}
        aria-hidden="true"
      >
        <span style={{ fontSize: '1.25rem' }}>🗑️</span>
      </div>

      {/* Item content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-xl)',
          transform: leaving
            ? 'translateX(-100%)'
            : swipeX > 0
            ? `translateX(-${swipeX}px)`
            : 'translateX(0)',
          opacity: leaving ? 0 : 1,
          transition:
            swipeX === 0 || leaving ? 'transform 0.28s ease, opacity 0.28s ease' : 'none',
          touchAction: 'pan-y',
          willChange: 'transform',
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #FF6B00, #CC5500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
          }}
        >
          {item.menuItem.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.menuItem.image_url}
              alt={item.menuItem.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            '🍽️'
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.menuItem.name}
          </p>
          {item.selectedOptions.length > 0 && (
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: 1 }}>
              {item.selectedOptions.map((o) => o.optionName).join(', ')}
            </p>
          )}
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand)', marginTop: 2 }}>
            {formatPrice(item.unitPrice)}
          </p>
        </div>

        {/* Qty controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
          <button
            onClick={dec}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: item.quantity <= 1 ? 'var(--danger-subtle)' : 'var(--bg-overlay)',
              color: item.quantity <= 1 ? 'var(--danger)' : 'var(--text-primary)',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              transition: 'all var(--t-base)',
            }}
            aria-label="Diminuer"
          >
            {item.quantity <= 1 ? '🗑' : '−'}
          </button>
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              minWidth: 20,
              textAlign: 'center',
            }}
          >
            {item.quantity}
          </span>
          <button
            onClick={inc}
            style={{
              width: 28,
              height: 28,
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
            aria-label="Augmenter"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem 1.5rem',
        flex: 1,
      }}
    >
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
        <circle cx="60" cy="60" r="56" fill="rgba(255,107,0,0.08)" stroke="rgba(255,107,0,0.2)" strokeWidth="1.5" />
        <path d="M38 44h44l-6 28H44L38 44Z" fill="none" stroke="rgba(255,107,0,0.6)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M34 38h8l4 6" stroke="rgba(255,107,0,0.6)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="50" cy="80" r="3" fill="rgba(255,107,0,0.6)" />
        <circle cx="70" cy="80" r="3" fill="rgba(255,107,0,0.6)" />
        <path d="M52 57 l6 6 l10-10" stroke="rgba(255,107,0,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <h3
        className="font-display"
        style={{ fontSize: '1.125rem', color: 'var(--text-primary)', marginTop: '1rem', marginBottom: '0.5rem' }}
      >
        Votre panier est vide 😔
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Ajoutez des plats délicieux depuis notre menu
      </p>
      <Link
        href="/menu"
        onClick={onClose}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          borderRadius: 999,
          background: 'linear-gradient(135deg, #FF6B00, #CC5500)',
          color: 'white',
          fontWeight: 700,
          fontSize: '0.9375rem',
          textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(255,107,0,0.4)',
        }}
      >
        🍽️ Voir le menu
      </Link>
    </div>
  )
}

// ─── Cart content (shared between mobile/desktop) ─────────────────────────────
function CartContent({ onClose }: { onClose: () => void }) {
  const items       = useCartStore((s) => s.items)
  const lastAdded   = useCartStore((s) => s.lastAdded)
  const removeItem  = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const getSubtotal = useCartStore((s) => s.getSubtotal)
  const getTotal    = useCartStore((s) => s.getTotal)
  const clearLastAdded = useCartStore((s) => s.clearLastAdded)
  const { toast }   = useToast()

  // Show toast on duplicate add
  useEffect(() => {
    if (!lastAdded?.wasUpdate) return
    toast({ title: 'Quantité mise à jour', variant: 'info' })
    clearLastAdded()
  }, [lastAdded, toast, clearLastAdded])

  const handleRemove = useCallback((id: string) => {
    removeItem(id)
    if ('vibrate' in navigator) navigator.vibrate([15, 10, 15])
  }, [removeItem])

  const subTotal = getSubtotal()
  const total    = getTotal()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem 0.75rem',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <h2 className="font-display" style={{ fontSize: '1.0625rem', color: 'var(--text-primary)' }}>
          Mon Panier
          {items.length > 0 && (
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
              ({items.reduce((s, i) => s + i.quantity, 0)} article{items.reduce((s, i) => s + i.quantity, 0) > 1 ? 's' : ''})
            </span>
          )}
        </h2>
        <button
          onClick={onClose}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--bg-overlay)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.125rem',
            border: 'none',
          }}
          aria-label="Fermer le panier"
        >
          ×
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyCart onClose={onClose} />
      ) : (
        <>
          {/* Items list */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0.75rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
            className="overscroll-contain"
          >
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onRemove={handleRemove}
                onUpdateQty={updateQuantity}
              />
            ))}
          </div>

          {/* Totals + CTA */}
          <div
            style={{
              flexShrink: 0,
              padding: '1rem 1.25rem',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
            }}
          >
            {/* Sous-total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Sous-total</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {formatPrice(subTotal)}
              </span>
            </div>
            {/* Frais livraison */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                🛵 Frais de livraison
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {formatPrice(FRAIS_LIVRAISON)}
              </span>
            </div>
            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Total</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand)' }}>
                {formatPrice(total)}
              </span>
            </div>
            {/* Commander button */}
            <Link
              href="/cart"
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.875rem',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, #FF6B00, #CC5500)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
                textDecoration: 'none',
                boxShadow: 'var(--shadow-brand)',
              }}
            >
              Commander — {formatPrice(total)} →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Desktop drawer ───────────────────────────────────────────────────────────
function DesktopDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Body scroll lock
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panier"
      style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', justifyContent: 'flex-end' }}
    >
      {/* Backdrop */}
      <div
        className="animate-fade-in"
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer panel */}
      <div
        className="animate-slide-right"
        style={{
          position: 'relative',
          width: 400,
          maxWidth: '100vw',
          height: '100%',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'hidden',
        }}
      >
        <CartContent onClose={onClose} />
      </div>
    </div>
  )
}

// ─── Main CartDrawer — responsive ─────────────────────────────────────────────
export function CartDrawer() {
  const open    = useUIStore((s) => s.isCartDrawerOpen)
  const onClose = useUIStore((s) => s.closeCartDrawer)
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check, { passive: true })
    return () => window.removeEventListener('resize', check)
  }, [])

  if (isMobile) {
    return (
      <BottomSheet open={open} onClose={onClose} height="auto">
        <CartContent onClose={onClose} />
      </BottomSheet>
    )
  }

  return <DesktopDrawer open={open} onClose={onClose} />
}
