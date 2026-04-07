import * as React from 'react'
import { cn } from '../utils'
import { XIcon } from '../icons'

const colors = [
  'bg-orange-500/15 text-orange-400 border-orange-500/25',
  'bg-blue-500/15 text-blue-400 border-blue-500/25',
  'bg-green-500/15 text-green-400 border-green-500/25',
  'bg-purple-500/15 text-purple-400 border-purple-500/25',
  'bg-pink-500/15 text-pink-400 border-pink-500/25',
  'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  'bg-teal-500/15 text-teal-400 border-teal-500/25',
] as const

type TagColor = typeof colors[number]

export interface TagProps {
  label:      string
  onRemove?:  (() => void) | null
  color?:     TagColor | string
  className?: string
}

export function Tag({ label, onRemove, color, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1',
        'rounded-full text-xs font-medium border',
        'transition-colors duration-100',
        color ?? colors[0],
        className
      )}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Retirer ${label}`}
          className={cn(
            'flex items-center justify-center w-3.5 h-3.5 rounded-full',
            'opacity-60 hover:opacity-100',
            'transition-opacity duration-100',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current'
          )}
        >
          <XIcon size={8} strokeWidth={2.5} />
        </button>
      )}
    </span>
  )
}

/** Auto-assign colors by index */
export function getTagColor(index: number): TagColor {
  return colors[index % colors.length]
}
