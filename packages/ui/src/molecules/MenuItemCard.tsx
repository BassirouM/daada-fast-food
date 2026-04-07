'use client'

import * as React from 'react'
import { cn, formatDuration } from '../utils'
import { PlusIcon, ClockIcon, FlameIcon } from '../icons'
import { PriceDisplay } from '../atoms/PriceDisplay'
import { Badge } from '../atoms/Badge'

export type MenuItemCardVariant = 'grid' | 'list'

export interface MenuItemCardProps {
  id:            string
  name:          string
  description?:  string
  price:         number
  comparePrice?: number
  image?:        string
  category?:     string
  isAvailable?:  boolean
  isFeatured?:   boolean
  prepTime?:     number
  onAdd?:        (id: string) => void
  variant?:      MenuItemCardVariant
  className?:    string
}

export function MenuItemCard({
  id,
  name,
  description,
  price,
  comparePrice,
  image,
  category,
  isAvailable = true,
  isFeatured = false,
  prepTime,
  onAdd,
  variant = 'grid',
  className,
}: MenuItemCardProps) {
  const [adding, setAdding] = React.useState(false)

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isAvailable || adding) return
    setAdding(true)
    onAdd?.(id)
    // Visual feedback
    setTimeout(() => setAdding(false), 600)
  }

  if (variant === 'list') {
    return (
      <article
        className={cn(
          'flex items-center gap-3 p-3 rounded-2xl',
          'bg-[var(--bg-surface)] border border-[var(--border)]',
          'transition-all duration-150',
          !isAvailable && 'opacity-60',
          className
        )}
        aria-label={name}
      >
        {/* Image */}
        <div className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-[var(--bg-elevated)]">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
          )}
          {isFeatured && (
            <span className="absolute top-1 left-1">
              <FlameIcon size={14} className="text-[var(--brand)]" />
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{name}</p>
          {description && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <PriceDisplay amount={price} comparePrice={comparePrice} size="sm" />
            {prepTime && (
              <span className="flex items-center gap-0.5 text-xs text-[var(--text-muted)]">
                <ClockIcon size={10} /> {formatDuration(prepTime)}
              </span>
            )}
          </div>
        </div>

        {/* Add button */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={!isAvailable}
          aria-label={`Ajouter ${name} au panier`}
          className={cn(
            'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center',
            'transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]',
            isAvailable
              ? cn(
                  'bg-[var(--brand)] text-white',
                  'hover:bg-[var(--brand-light)]',
                  adding && 'scale-125 bg-[var(--success)]'
                )
              : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed'
          )}
        >
          <PlusIcon size={16} />
        </button>
      </article>
    )
  }

  // Grid variant
  return (
    <article
      className={cn(
        'flex flex-col rounded-2xl overflow-hidden',
        'bg-[var(--bg-surface)] border border-[var(--border)]',
        'transition-all duration-150',
        'hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]',
        !isAvailable && 'opacity-60',
        className
      )}
      aria-label={name}
    >
      {/* Image */}
      <div className="relative w-full aspect-video bg-[var(--bg-elevated)] overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {isFeatured && (
            <Badge variant="warning" size="sm" dot>
              Populaire
            </Badge>
          )}
          {!isAvailable && (
            <Badge variant="default" size="sm">
              Indisponible
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">{name}</p>
        {description && (
          <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Meta */}
        {prepTime && (
          <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <ClockIcon size={11} />
            <span>{formatDuration(prepTime)}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <PriceDisplay amount={price} comparePrice={comparePrice} size="sm" />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!isAvailable}
            aria-label={`Ajouter ${name} au panier`}
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
              'transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]',
              isAvailable
                ? cn(
                    'bg-[var(--brand)] text-white',
                    'hover:bg-[var(--brand-light)]',
                    adding && 'scale-125 bg-[var(--success)]'
                  )
                : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed'
            )}
          >
            <PlusIcon size={14} />
          </button>
        </div>
      </div>
    </article>
  )
}
