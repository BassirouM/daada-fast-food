'use client'

import { createContext, useCallback, useContext } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface FlyToCartContextValue {
  fly: (sourceRect: DOMRect, imageUrl?: string, emoji?: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────
const FlyToCartContext = createContext<FlyToCartContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────
export function FlyToCartProvider({ children }: { children: React.ReactNode }) {
  const fly = useCallback((sourceRect: DOMRect, imageUrl?: string, emoji?: string) => {
    const cartBtn = document.getElementById('cart-icon-btn')
    if (!cartBtn) return

    const target = cartBtn.getBoundingClientRect()
    const SIZE = 44

    // Starting position: center of source element
    const startX = sourceRect.left + sourceRect.width  / 2 - SIZE / 2
    const startY = sourceRect.top  + sourceRect.height / 2 - SIZE / 2
    // End position: center of cart icon
    const endX = target.left + target.width  / 2 - SIZE / 2
    const endY = target.top  + target.height / 2 - SIZE / 2

    // Create flying element
    const el = document.createElement('div')
    el.style.cssText = [
      'position: fixed',
      `left: ${startX}px`,
      `top: ${startY}px`,
      `width: ${SIZE}px`,
      `height: ${SIZE}px`,
      'border-radius: 50%',
      'overflow: hidden',
      'z-index: 9999',
      'pointer-events: none',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'font-size: 1.5rem',
      'background: linear-gradient(135deg, #F97316, #EA580C)',
      'box-shadow: 0 4px 16px rgba(249,115,22,0.5)',
      'will-change: transform, opacity',
    ].join(';')

    if (imageUrl) {
      el.innerHTML = `<img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover" alt="" />`
    } else {
      el.textContent = emoji ?? '🍽️'
    }

    document.body.appendChild(el)

    // Two rAFs ensure the element has been painted before transitioning
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'left 0.55s cubic-bezier(0.2, 1.2, 0.3, 1), top 0.55s cubic-bezier(0.2, 1.2, 0.3, 1), width 0.45s ease, height 0.45s ease, opacity 0.45s ease 0.1s, transform 0.45s ease 0.1s'
        el.style.left    = `${endX}px`
        el.style.top     = `${endY}px`
        el.style.width   = '20px'
        el.style.height  = '20px'
        el.style.opacity = '0'
        el.style.transform = 'scale(0.3)'
      })
    })

    // Cleanup + impact haptic
    setTimeout(() => {
      if (document.body.contains(el)) document.body.removeChild(el)
      if ('vibrate' in navigator) navigator.vibrate(25)
      // Briefly animate cart icon
      cartBtn.classList.add('cart-icon-impact')
      setTimeout(() => cartBtn.classList.remove('cart-icon-impact'), 400)
    }, 580)
  }, [])

  return (
    <FlyToCartContext.Provider value={{ fly }}>
      {children}
    </FlyToCartContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useFlyToCart() {
  const ctx = useContext(FlyToCartContext)
  if (!ctx) throw new Error('useFlyToCart must be inside <FlyToCartProvider>')
  return ctx
}
