'use client'

import * as React from 'react'
import { cn, formatDuration } from '../utils'
import { ClockIcon, CrownIcon, ChefHatIcon } from '../icons'
import { Badge } from '../atoms/Badge'
import { RatingStars } from '../atoms/RatingStars'

export type RecipeDifficulty = 'facile' | 'moyen' | 'difficile'

export interface RecipeCardProps {
  id:            string
  title:         string
  coverImage?:   string
  difficulty:    RecipeDifficulty
  prepTime:      number
  cookTime:      number
  servings:      number
  isPremium?:    boolean
  avgRating?:    number
  ratingsCount?: number
  cuisine?:      string
  onView?:       (id: string) => void
  className?:    string
}

const difficultyConfig: Record<RecipeDifficulty, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  facile:   { label: 'Facile',   variant: 'success' },
  moyen:    { label: 'Moyen',    variant: 'warning' },
  difficile:{ label: 'Difficile',variant: 'danger'  },
}

export function RecipeCard({
  id,
  title,
  coverImage,
  difficulty,
  prepTime,
  cookTime,
  servings,
  isPremium = false,
  avgRating = 0,
  ratingsCount = 0,
  cuisine,
  onView,
  className,
}: RecipeCardProps) {
  const totalTime = prepTime + cookTime
  const { label: diffLabel, variant: diffVariant } = difficultyConfig[difficulty]

  return (
    <article
      className={cn(
        'flex flex-col rounded-2xl overflow-hidden cursor-pointer',
        'bg-[var(--bg-surface)] border border-[var(--border)]',
        'transition-all duration-150',
        'hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]',
        'focus-within:ring-2 focus-within:ring-[var(--brand)]',
        className
      )}
      onClick={() => onView?.(id)}
    >
      {/* Cover image */}
      <div className="relative w-full aspect-[4/3] bg-[var(--bg-elevated)] overflow-hidden">
        {coverImage ? (
          <img src={coverImage} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            <ChefHatIcon size={48} className="text-[var(--text-muted)]" />
          </div>
        )}

        {/* Premium overlay */}
        {isPremium && (
          <div className="absolute top-2 right-2">
            <Badge variant="premium" size="sm">
              <CrownIcon size={10} className="mr-0.5" /> Premium
            </Badge>
          </div>
        )}

        {/* Difficulty */}
        <div className="absolute bottom-2 left-2">
          <Badge variant={diffVariant} size="sm">{diffLabel}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-snug line-clamp-2">
          {title}
        </h3>

        {/* Rating */}
        {ratingsCount > 0 && (
          <div className="flex items-center gap-1.5">
            <RatingStars value={avgRating} size="sm" />
            <span className="text-xs text-[var(--text-muted)]">({ratingsCount})</span>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <ClockIcon size={11} /> {formatDuration(totalTime)}
          </span>
          <span>{servings} pers.</span>
          {cuisine && <span className="text-[var(--text-muted)]">{cuisine}</span>}
        </div>
      </div>

      {/* Accessible click target */}
      <button
        type="button"
        className="sr-only"
        onClick={() => onView?.(id)}
        aria-label={`Voir la recette : ${title}`}
      />
    </article>
  )
}
