'use client'

import * as React from 'react'
import { cn } from '../utils'
import { Button } from '../atoms/Button'

export type EmptyStateVariant =
  | 'cart'
  | 'orders'
  | 'recipes'
  | 'notifications'
  | 'search'
  | 'custom'

const VARIANT_CONFIG: Record<EmptyStateVariant, { emoji: string; title: string; description: string }> = {
  cart: {
    emoji:       '🛒',
    title:       'Votre panier est vide',
    description: 'Ajoutez des articles depuis le menu pour commencer votre commande.',
  },
  orders: {
    emoji:       '📦',
    title:       'Aucune commande',
    description: 'Vous n\'avez pas encore passé de commande. Explorez notre menu !',
  },
  recipes: {
    emoji:       '📖',
    title:       'Aucune recette',
    description: 'Aucune recette ne correspond à votre recherche. Essayez d\'autres mots-clés.',
  },
  notifications: {
    emoji:       '🔔',
    title:       'Aucune notification',
    description: 'Vous êtes à jour ! Vos notifications apparaîtront ici.',
  },
  search: {
    emoji:       '🔍',
    title:       'Aucun résultat',
    description: 'Aucun résultat pour votre recherche. Vérifiez l\'orthographe ou essayez un autre terme.',
  },
  custom: {
    emoji:       '📭',
    title:       'Rien ici',
    description: 'Cette section est vide pour l\'instant.',
  },
}

export interface EmptyStateProps {
  variant?:     EmptyStateVariant
  emoji?:       string
  title?:       string
  description?: string
  action?:      {
    label:   string
    onClick: () => void
  }
  secondaryAction?: {
    label:   string
    onClick: () => void
  }
  size?:     'sm' | 'md' | 'lg'
  className?: string
}

export function EmptyState({
  variant = 'custom',
  emoji,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className,
}: EmptyStateProps) {
  const cfg = VARIANT_CONFIG[variant]

  const resolvedEmoji       = emoji       ?? cfg.emoji
  const resolvedTitle       = title       ?? cfg.title
  const resolvedDescription = description ?? cfg.description

  const emojiSize  = size === 'sm' ? 'text-4xl' : size === 'lg' ? 'text-7xl' : 'text-5xl'
  const titleSize  = size === 'sm' ? 'text-sm'  : size === 'lg' ? 'text-xl'  : 'text-base'
  const descSize   = size === 'sm' ? 'text-xs'  : 'text-sm'
  const padding    = size === 'sm' ? 'py-8'     : size === 'lg' ? 'py-16'    : 'py-12'

  return (
    <div
      role="status"
      aria-label={resolvedTitle}
      className={cn(
        'flex flex-col items-center gap-4 text-center',
        padding,
        className
      )}
    >
      {/* Emoji illustration */}
      <span
        className={cn(emojiSize, 'select-none leading-none')}
        aria-hidden
      >
        {resolvedEmoji}
      </span>

      {/* Text */}
      <div className="flex flex-col gap-1.5 max-w-xs">
        <h3 className={cn('font-semibold text-[var(--text-primary)]', titleSize)}>
          {resolvedTitle}
        </h3>
        <p className={cn('text-[var(--text-muted)] leading-relaxed', descSize)}>
          {resolvedDescription}
        </p>
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-2 mt-1">
          {action && (
            <Button
              size={size === 'sm' ? 'sm' : 'md'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              size={size === 'sm' ? 'sm' : 'md'}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
