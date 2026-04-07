import * as React from 'react'
import { cn, getInitials } from '../utils'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface AvatarProps {
  src?:       string
  fallback?:  string   // Full name or initials
  size?:      AvatarSize
  online?:    boolean
  className?: string
  alt?:       string
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
}

const onlineSizeClasses: Record<AvatarSize, string> = {
  xs: 'w-1.5 h-1.5 right-0 bottom-0',
  sm: 'w-2 h-2 right-0 bottom-0',
  md: 'w-2.5 h-2.5 right-0 bottom-0',
  lg: 'w-3 h-3 right-0.5 bottom-0.5',
  xl: 'w-4 h-4 right-0.5 bottom-0.5',
}

/** Deterministic color from initials */
function avatarBg(name: string): string {
  const hues = [14, 220, 142, 280, 320, 48, 180]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i)
  const hue = hues[hash % hues.length]
  return `hsl(${hue} 70% 40%)`
}

export function Avatar({
  src,
  fallback = '',
  size = 'md',
  online,
  className,
  alt,
}: AvatarProps) {
  const [imgError, setImgError] = React.useState(false)
  const initials = getInitials(fallback || '?')
  const showImage = src && !imgError

  return (
    <div
      className={cn('relative inline-flex shrink-0', sizeClasses[size], className)}
      aria-label={alt ?? fallback}
    >
      <span
        className={cn(
          'flex items-center justify-center w-full h-full rounded-full',
          'font-semibold select-none overflow-hidden',
          !showImage && 'text-white'
        )}
        style={{ backgroundColor: !showImage ? avatarBg(fallback || '?') : undefined }}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt ?? fallback}
            className="w-full h-full object-cover rounded-full"
            onError={() => setImgError(true)}
          />
        ) : (
          initials
        )}
      </span>

      {/* Online indicator */}
      {online !== undefined && (
        <span
          aria-hidden
          className={cn(
            'absolute rounded-full border-2 border-[var(--bg-base)]',
            onlineSizeClasses[size],
            online ? 'bg-[var(--success)]' : 'bg-[var(--text-muted)]'
          )}
          title={online ? 'En ligne' : 'Hors ligne'}
        />
      )}
    </div>
  )
}
