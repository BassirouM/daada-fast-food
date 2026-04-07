'use client'

import * as React from 'react'
import { cn } from '../utils'
import { PlusIcon, MinusIcon, XIcon } from '../icons'
import { PriceDisplay } from '../atoms/PriceDisplay'

export interface CartItemOptions {
  [groupName: string]: string | string[]
}

export interface CartItemData {
  id:        string
  itemId:    string
  name:      string
  image?:    string
  quantity:  number
  unitPrice: number
  subtotal:  number
  options?:  CartItemOptions
  note?:     string
}

export interface CartItemProps {
  item:          CartItemData
  onIncrease?:   (id: string) => void
  onDecrease?:   (id: string) => void
  onRemove?:     (id: string) => void
  onNoteChange?: (id: string, note: string) => void
  className?:    string
}

export function CartItem({
  item,
  onIncrease,
  onDecrease,
  onRemove,
  onNoteChange,
  className,
}: CartItemProps) {
  const [showNote, setShowNote] = React.useState(Boolean(item.note))

  // Flatten options for display
  const optionLines = item.options
    ? Object.entries(item.options).map(([group, vals]) =>
        `${group}: ${Array.isArray(vals) ? vals.join(', ') : vals}`
      )
    : []

  return (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-2xl',
        'bg-[var(--bg-surface)] border border-[var(--border)]',
        className
      )}
      role="listitem"
    >
      {/* Image */}
      <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-[var(--bg-elevated)]">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">
            {item.name}
          </p>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label={`Retirer ${item.name} du panier`}
              className={cn(
                'shrink-0 w-5 h-5 rounded-full flex items-center justify-center',
                'text-[var(--text-muted)] hover:text-[var(--danger)]',
                'hover:bg-[var(--danger-subtle)]',
                'transition-colors duration-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)]'
              )}
            >
              <XIcon size={10} />
            </button>
          )}
        </div>

        {/* Options */}
        {optionLines.length > 0 && (
          <p className="text-xs text-[var(--text-muted)]">{optionLines.join(' · ')}</p>
        )}

        {/* Note */}
        {showNote ? (
          <input
            type="text"
            value={item.note ?? ''}
            onChange={(e) => onNoteChange?.(item.id, e.target.value)}
            placeholder="Note pour le cuisinier…"
            aria-label="Note pour cet article"
            maxLength={120}
            className={cn(
              'w-full h-7 px-2 rounded-lg text-xs',
              'bg-[var(--bg-input)] text-[var(--text-primary)]',
              'border border-[var(--border)]',
              'placeholder:text-[var(--text-muted)]',
              'focus:outline-none focus:border-[var(--brand)]',
              'transition-colors duration-100'
            )}
          />
        ) : (
          onNoteChange && (
            <button
              type="button"
              onClick={() => setShowNote(true)}
              className="self-start text-xs text-[var(--brand)] underline underline-offset-2"
            >
              + Ajouter une note
            </button>
          )
        )}

        {/* Footer: quantity + price */}
        <div className="flex items-center justify-between mt-1">
          {/* Quantity stepper */}
          <div className="flex items-center rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-input)]">
            <button
              type="button"
              onClick={() => item.quantity > 1 ? onDecrease?.(item.id) : onRemove?.(item.id)}
              aria-label="Diminuer la quantité"
              className={cn(
                'w-7 h-7 flex items-center justify-center',
                'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                'hover:bg-[var(--bg-overlay)]',
                'transition-colors duration-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand)]'
              )}
            >
              <MinusIcon size={12} />
            </button>
            <span
              className="w-7 text-center text-sm font-semibold text-[var(--text-primary)]"
              aria-live="polite"
              aria-label={`Quantité : ${item.quantity}`}
            >
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onIncrease?.(item.id)}
              aria-label="Augmenter la quantité"
              className={cn(
                'w-7 h-7 flex items-center justify-center',
                'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                'hover:bg-[var(--bg-overlay)]',
                'transition-colors duration-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand)]'
              )}
            >
              <PlusIcon size={12} />
            </button>
          </div>

          <PriceDisplay amount={item.subtotal} size="sm" />
        </div>
      </div>
    </div>
  )
}
