'use client'

import * as React from 'react'
import { cn } from '../utils'

export interface Category {
  id:      string
  name:    string
  icon?:   string
  count?:  number
}

export interface CategoryTabsBarProps {
  categories:  Category[]
  activeId?:   string
  onChange?:   (id: string) => void
  sticky?:     boolean
  className?:  string
}

export function CategoryTabsBar({
  categories,
  activeId,
  onChange,
  sticky = true,
  className,
}: CategoryTabsBarProps) {
  const scrollRef    = React.useRef<HTMLDivElement>(null)
  const activeRef    = React.useRef<HTMLButtonElement>(null)

  // Scroll active tab into view
  React.useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current
      const btn = activeRef.current
      const offset = btn.offsetLeft - container.offsetWidth / 2 + btn.offsetWidth / 2
      container.scrollTo({ left: offset, behavior: 'smooth' })
    }
  }, [activeId])

  return (
    <div
      className={cn(
        sticky && 'sticky top-14 z-[100]',
        'bg-[var(--bg-base)] border-b border-[var(--border)]',
        className
      )}
    >
      <div
        ref={scrollRef}
        role="tablist"
        aria-label="Catégories"
        className="flex gap-1 px-4 py-2 overflow-x-auto no-scrollbar"
      >
        {categories.map((cat) => {
          const isActive = cat.id === activeId
          return (
            <button
              key={cat.id}
              ref={isActive ? activeRef : undefined}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`category-panel-${cat.id}`}
              id={`category-tab-${cat.id}`}
              onClick={() => onChange?.(cat.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm whitespace-nowrap shrink-0',
                'transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]',
                isActive
                  ? 'bg-[var(--brand)] text-white font-semibold shadow-[var(--shadow-brand)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              )}
            >
              {cat.icon && <span aria-hidden>{cat.icon}</span>}
              {cat.name}
              {cat.count !== undefined && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-semibold leading-none',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[var(--bg-overlay)] text-[var(--text-muted)]'
                  )}
                >
                  {cat.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
