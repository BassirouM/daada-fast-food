'use client'

import { useEffect, useRef, useState } from 'react'
import { useCartStore } from '@/stores/cart.store'
import { useUIStore } from '@/stores/ui.store'
import { formatPrice } from '@/lib/utils'

export function FloatingCartButton() {
  const count        = useCartStore((s) => s.getItemCount())
  const total        = useCartStore((s) => s.getTotal())
  const hasHydrated  = useCartStore((s) => s._hasHydrated)
  const openDrawer   = useUIStore((s) => s.openCartDrawer)

  const prevCount    = useRef(count)
  const [badgeBounce, setBadgeBounce] = useState(false)

  // Bounce badge when item count increases
  useEffect(() => {
    if (count > prevCount.current) {
      setBadgeBounce(true)
      const id = setTimeout(() => setBadgeBounce(false), 450)
      prevCount.current = count
      return () => clearTimeout(id)
    }
    prevCount.current = count
  }, [count])

  // Avoid SSR mismatch — only render after hydration and when cart has items
  if (!hasHydrated || count === 0) return null

  return (
    <button
      onClick={() => {
        if ('vibrate' in navigator) navigator.vibrate(12)
        openDrawer()
      }}
      aria-label={`Voir le panier — ${count} article${count > 1 ? 's' : ''}`}
      style={{
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)',
        right: '1rem',
        zIndex: 38,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.125rem 0.75rem 0.875rem',
        borderRadius: 999,
        background: 'linear-gradient(135deg, #FF6B00, #CC5500)',
        color: 'white',
        border: 'none',
        boxShadow: '0 4px 20px rgba(255,107,0,0.55)',
        fontWeight: 700,
        fontSize: '0.9375rem',
        cursor: 'pointer',
        transition: 'transform var(--t-spring), box-shadow var(--t-base)',
      }}
      className="md:hidden animate-scale-in"
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
      }}
    >
      {/* Cart icon */}
      <span style={{ fontSize: '1.125rem' }}>🛒</span>

      {/* Total */}
      <span>{formatPrice(total)}</span>

      {/* Badge count */}
      <span
        style={{
          position: 'absolute',
          top: -6,
          right: -6,
          minWidth: 22,
          height: 22,
          borderRadius: 999,
          background: '#FFFFFF',
          color: '#FF6B00',
          fontSize: '0.6875rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 4px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          animation: badgeBounce ? 'badgeBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both' : 'none',
        }}
        aria-hidden="true"
      >
        {count > 99 ? '99+' : count}
      </span>
    </button>
  )
}
