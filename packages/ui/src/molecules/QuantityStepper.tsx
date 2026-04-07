'use client'

import * as React from 'react'
import { cn } from '../utils'
import { PlusIcon, MinusIcon } from '../icons'

export interface QuantityStepperProps {
  value:      number
  min?:       number
  max?:       number
  onChange?:  (value: number) => void
  disabled?:  boolean
  size?:      'sm' | 'md' | 'lg'
  className?: string
  label?:     string
}

const sizeMap = {
  sm: { btn: 'w-7 h-7', text: 'w-6 text-sm', icon: 12 },
  md: { btn: 'w-9 h-9', text: 'w-8 text-base', icon: 14 },
  lg: { btn: 'w-11 h-11', text: 'w-10 text-lg', icon: 16 },
}

export function QuantityStepper({
  value,
  min = 0,
  max = 99,
  onChange,
  disabled = false,
  size = 'md',
  className,
  label,
}: QuantityStepperProps) {
  const s = sizeMap[size]

  function decrement() {
    if (value > min) onChange?.(value - 1)
  }

  function increment() {
    if (value < max) onChange?.(value + 1)
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-xl overflow-hidden',
        'border border-[var(--border)] bg-[var(--bg-input)]',
        disabled && 'opacity-40 pointer-events-none',
        className
      )}
      role="group"
      aria-label={label ?? 'Quantité'}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || value <= min}
        aria-label="Diminuer"
        className={cn(
          s.btn,
          'flex items-center justify-center shrink-0',
          'text-[var(--text-secondary)]',
          'hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]',
          'disabled:opacity-30',
          'transition-colors duration-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand)]'
        )}
      >
        <MinusIcon size={s.icon} />
      </button>

      <span
        className={cn(
          s.text,
          'text-center font-semibold text-[var(--text-primary)] select-none'
        )}
        aria-live="polite"
        aria-atomic="true"
        aria-label={`${value}`}
      >
        {value}
      </span>

      <button
        type="button"
        onClick={increment}
        disabled={disabled || value >= max}
        aria-label="Augmenter"
        className={cn(
          s.btn,
          'flex items-center justify-center shrink-0',
          'text-[var(--text-secondary)]',
          'hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]',
          'disabled:opacity-30',
          'transition-colors duration-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand)]'
        )}
      >
        <PlusIcon size={s.icon} />
      </button>
    </div>
  )
}
