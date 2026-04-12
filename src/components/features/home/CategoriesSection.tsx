'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const CATEGORIES = [
  { emoji: '🍔', label: 'Burgers', slug: 'burger' },
  { emoji: '🍗', label: 'Poulet', slug: 'poulet' },
  { emoji: '🍕', label: 'Pizza', slug: 'pizza' },
  { emoji: '🥤', label: 'Boissons', slug: 'boisson' },
  { emoji: '🍰', label: 'Desserts', slug: 'dessert' },
  { emoji: '🥪', label: 'Sandwichs', slug: 'sandwich' },
  { emoji: '🍟', label: 'Frites', slug: 'frites' },
  { emoji: '🥗', label: 'Salades', slug: 'salade' },
]

export default function CategoriesSection() {
  const [active, setActive] = useState<string | null>(null)
  const router = useRouter()

  const handleSelect = (slug: string) => {
    setActive(slug)
    router.push(`/menu?categorie=${slug}`)
  }

  return (
    <section style={{ padding: '1.5rem 0 0.5rem' }}>
      <div style={{ paddingLeft: '1rem', marginBottom: '0.75rem' }}>
        <h2
          className="font-display"
          style={{ fontSize: '1.125rem', color: 'var(--text-primary)' }}
        >
          Nos catégories
        </h2>
      </div>

      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          gap: '0.625rem',
          overflowX: 'auto',
          paddingInline: '1rem',
          paddingBottom: '0.5rem',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {CATEGORIES.map(cat => {
          const isActive = active === cat.slug
          return (
            <button
              key={cat.slug}
              onClick={() => handleSelect(cat.slug)}
              style={{
                flexShrink: 0,
                scrollSnapAlign: 'start',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-xl)',
                border: isActive ? '2px solid var(--brand)' : '1px solid var(--border)',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(204,85,0,0.1))'
                  : 'var(--bg-surface)',
                transition: 'all var(--t-base)',
                boxShadow: isActive ? 'var(--shadow-brand)' : 'none',
                minWidth: 72,
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{cat.emoji}</span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.label}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
