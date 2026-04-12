'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCartStore, FRAIS_LIVRAISON } from '@/stores/cart.store'
import { formatPrice } from '@/lib/utils'
import UpsellSuggestions from '@/components/features/ai/UpsellSuggestions'
import type { CartItem } from '@/stores/cart.store'

// ─── Cart item row with swipe-to-delete ───────────────────────────────────────

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
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, marginBottom: '0.5rem' }}>
      {/* Swipe delete background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: '1rem',
          background: '#EF4444',
          borderRadius: 16,
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
          padding: '0.875rem',
          background: 'var(--bg-elevated)',
          borderRadius: 16,
          transform: leaving
            ? 'translateX(-100%)'
            : swipeX > 0
            ? `translateX(-${swipeX}px)`
            : 'translateX(0)',
          opacity: leaving ? 0 : 1,
          transition: swipeX === 0 || leaving ? 'transform 0.28s ease, opacity 0.28s ease' : 'none',
          touchAction: 'pan-y',
          willChange: 'transform',
        }}
      >
        {/* Image */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 12,
            overflow: 'hidden',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
          }}
        >
          {item.menuItem.image_url ? (
            <Image
              src={item.menuItem.image_url}
              alt={item.menuItem.name}
              fill
              sizes="64px"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            '🍽️'
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: '0.9375rem',
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
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              {item.selectedOptions.map((o) => o.optionName).join(', ')}
            </p>
          )}
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand)', marginTop: 2 }}>
            {formatPrice(item.unitPrice)}
          </p>
        </div>

        {/* Qty controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button
            onClick={dec}
            aria-label="Diminuer la quantité"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: item.quantity <= 1 ? 'rgba(239,68,68,0.12)' : 'var(--bg-overlay)',
              color: item.quantity <= 1 ? '#EF4444' : 'var(--text-primary)',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {item.quantity <= 1 ? '🗑' : '−'}
          </button>
          <span
            style={{
              minWidth: 24,
              textAlign: 'center',
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {item.quantity}
          </span>
          <button
            onClick={inc}
            aria-label="Augmenter la quantité"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--brand)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            +
          </button>
        </div>

        {/* Item total */}
        <p
          style={{
            flexShrink: 0,
            minWidth: 72,
            textAlign: 'right',
            fontWeight: 700,
            fontSize: '0.9375rem',
            color: 'var(--text-primary)',
          }}
        >
          {formatPrice(item.totalPrice)}
        </p>
      </div>
    </div>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyCart() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '5rem 2rem',
        minHeight: '60vh',
      }}
    >
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
        <circle cx="60" cy="60" r="56" fill="rgba(249,115,22,0.08)" stroke="rgba(249,115,22,0.2)" strokeWidth="1.5" />
        <path d="M38 44h44l-6 28H44L38 44Z" fill="none" stroke="rgba(249,115,22,0.6)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M34 38h8l4 6" stroke="rgba(249,115,22,0.6)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="50" cy="80" r="3" fill="rgba(249,115,22,0.6)" />
        <circle cx="70" cy="80" r="3" fill="rgba(249,115,22,0.6)" />
      </svg>
      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginTop: '1.25rem',
          marginBottom: '0.5rem',
        }}
      >
        Votre panier est vide
      </h2>
      <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Ajoutez des plats délicieux depuis le menu
      </p>
      <Link
        href="/menu"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.875rem 2rem',
          borderRadius: 999,
          background: 'linear-gradient(135deg, #F97316, #EA580C)',
          color: 'white',
          fontWeight: 700,
          fontSize: '0.9375rem',
          textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(249,115,22,0.35)',
        }}
      >
        🍽️ Voir le menu
      </Link>
    </div>
  )
}

// ─── Promo code input ──────────────────────────────────────────────────────────

function PromoCodeInput() {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const applyPromoCode = useCartStore((s) => s.applyPromoCode)
  const promoCode = useCartStore((s) => s.promoCode)
  const discount = useCartStore((s) => s.discount)

  useEffect(() => {
    if (promoCode) {
      setCode(promoCode)
      setStatus('success')
      setMessage(`Réduction de ${formatPrice(discount)} appliquée`)
    }
  }, [promoCode, discount])

  const handleApply = async () => {
    if (!code.trim()) return
    setStatus('loading')
    await new Promise((r) => setTimeout(r, 600))
    if (code.toUpperCase() === 'DAADA10') {
      applyPromoCode(code.toUpperCase(), 500)
      setStatus('success')
      setMessage('Réduction de 500 FCFA appliquée !')
    } else {
      setStatus('error')
      setMessage('Code promo invalide ou expiré')
    }
  }

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        borderRadius: 16,
        padding: '1rem',
        border: '1px solid var(--border)',
      }}
    >
      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.625rem' }}>
        🎁 Code promo
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            if (status !== 'idle') setStatus('idle')
          }}
          placeholder="Ex: DAADA10"
          disabled={status === 'success'}
          style={{
            flex: 1,
            padding: '0.625rem 0.875rem',
            borderRadius: 10,
            border: `1.5px solid ${
              status === 'success' ? '#22C55E' : status === 'error' ? '#EF4444' : 'var(--border)'
            }`,
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            outline: 'none',
            opacity: status === 'success' ? 0.7 : 1,
          }}
        />
        <button
          onClick={() => void handleApply()}
          disabled={status === 'loading' || status === 'success' || !code.trim()}
          style={{
            padding: '0.625rem 1rem',
            borderRadius: 10,
            background: status === 'success' ? '#22C55E' : 'var(--brand)',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.875rem',
            border: 'none',
            cursor: status === 'loading' || status === 'success' ? 'not-allowed' : 'pointer',
            opacity: !code.trim() ? 0.5 : 1,
            transition: 'all 0.15s',
            minWidth: 72,
          }}
        >
          {status === 'loading' ? '…' : status === 'success' ? '✓' : 'Appliquer'}
        </button>
      </div>
      {message && (
        <p
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: status === 'success' ? '#22C55E' : '#EF4444',
            marginTop: '0.375rem',
          }}
        >
          {message}
        </p>
      )}
    </div>
  )
}

// ─── Main cart page ────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter()
  const items          = useCartStore((s) => s.items)
  const removeItem     = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const getSubtotal    = useCartStore((s) => s.getSubtotal)
  const discount       = useCartStore((s) => s.discount)
  const _hasHydrated   = useCartStore((s) => s._hasHydrated)

  const handleRemove = useCallback(
    (id: string) => {
      if ('vibrate' in navigator) navigator.vibrate([15, 10, 15])
      removeItem(id)
    },
    [removeItem],
  )

  const subTotal  = getSubtotal()
  const frais     = items.length > 0 ? FRAIS_LIVRAISON : 0
  const total     = Math.max(0, subTotal + frais - discount)
  const itemCount = items.reduce((s, i) => s + i.quantity, 0)

  // Skeleton while Zustand hydrates from localStorage
  if (!_hasHydrated) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border)',
            padding: '0.875rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)' }} />
          <div style={{ width: 120, height: 20, borderRadius: 8, background: 'var(--bg-elevated)' }} />
        </header>
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                height: 88,
                borderRadius: 16,
                background: 'var(--bg-elevated)',
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${n * 0.1}s`,
              }}
            />
          ))}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      </main>
    )
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        paddingBottom: items.length > 0 ? '7rem' : '2rem',
      }}
    >
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          padding: '0.875rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <button
          onClick={() => router.back()}
          aria-label="Retour"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--bg-elevated)',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '1.125rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ←
        </button>
        <h1 style={{ flex: 1, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Mon panier
          {itemCount > 0 && (
            <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              ({itemCount} article{itemCount > 1 ? 's' : ''})
            </span>
          )}
        </h1>
      </header>

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '1rem' }}>
          {/* Items list */}
          <section aria-label="Articles du panier">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onRemove={handleRemove}
                onUpdateQty={updateQuantity}
              />
            ))}
          </section>

          {/* Promo code */}
          <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
            <PromoCodeInput />
          </div>

          {/* AI upsell suggestions */}
          <div style={{ marginBottom: '0.75rem' }}>
            <UpsellSuggestions />
          </div>

          {/* Order summary */}
          <div
            style={{
              background: 'var(--bg-elevated)',
              borderRadius: 16,
              padding: '1rem',
              border: '1px solid var(--border)',
            }}
          >
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Récapitulatif
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Sous-total</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{formatPrice(subTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>🛵 Frais de livraison</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{formatPrice(frais)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: '#22C55E' }}>🎁 Réduction promo</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#22C55E' }}>−{formatPrice(discount)}</span>
                </div>
              )}
              <div style={{ height: 1, background: 'var(--border)', margin: '0.25rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Total</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand)' }}>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.75rem' }}>
            🕐 Délai estimé : 25–40 min · Livraison à Maroua
          </p>
        </div>
      )}

      {/* ── Sticky checkout CTA ───────────────────────────────────────────────── */}
      {items.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0px))',
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border)',
            backdropFilter: 'blur(12px)',
            zIndex: 30,
          }}
        >
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <Link
              href="/checkout"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.9375rem 1.25rem',
                borderRadius: 16,
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
                textDecoration: 'none',
                boxShadow: '0 4px 24px rgba(249,115,22,0.4)',
              }}
            >
              <span>Commander maintenant</span>
              <span
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.9375rem',
                }}
              >
                {formatPrice(total)}
              </span>
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
