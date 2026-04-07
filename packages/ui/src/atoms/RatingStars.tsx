'use client'

import * as React from 'react'
import { cn } from '../utils'
import { StarIcon } from '../icons'

export type RatingSize = 'sm' | 'md' | 'lg'

export interface RatingStarsProps {
  value:        number
  max?:         number
  interactive?: boolean
  onChange?:    (value: number) => void
  size?:        RatingSize
  className?:   string
  label?:       string
}

const starSizeMap: Record<RatingSize, number> = { sm: 12, md: 16, lg: 20 }

export function RatingStars({
  value,
  max = 5,
  interactive = false,
  onChange,
  size = 'md',
  className,
  label,
}: RatingStarsProps) {
  const [hovered, setHovered] = React.useState<number | null>(null)
  const starSize = starSizeMap[size]
  const displayed = hovered ?? value

  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={label ?? `Note : ${value} sur ${max}`}
    >
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1
        const filled    = displayed >= starValue
        const partial   = !filled && displayed > i && displayed < starValue

        return (
          <React.Fragment key={i}>
            {interactive ? (
              <button
                type="button"
                role="radio"
                aria-checked={value === starValue}
                aria-label={`${starValue} étoile${starValue > 1 ? 's' : ''}`}
                onClick={() => onChange?.(starValue)}
                onMouseEnter={() => setHovered(starValue)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  'transition-transform duration-100',
                  'hover:scale-110 active:scale-95',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-[var(--brand)] rounded-sm'
                )}
              >
                <StarIcon
                  size={starSize}
                  className={cn(
                    'transition-colors duration-100',
                    filled || partial
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-[var(--border-strong)]'
                  )}
                  style={partial ? { clipPath: `inset(0 ${(1 - (displayed - i)) * 100}% 0 0)` } : undefined}
                />
              </button>
            ) : (
              <StarIcon
                size={starSize}
                className={cn(
                  filled
                    ? 'text-amber-400 fill-amber-400'
                    : partial
                    ? 'text-amber-400 fill-amber-400 opacity-50'
                    : 'text-[var(--border-strong)]'
                )}
                aria-hidden
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
