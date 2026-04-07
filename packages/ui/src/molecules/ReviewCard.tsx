import * as React from 'react'
import { cn } from '../utils'
import { Avatar } from '../atoms/Avatar'
import { RatingStars } from '../atoms/RatingStars'
import { ThumbsUpIcon } from '../icons'

// Minimal ThumbsUp icon
function ThumbsUpIcon(p: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <path d="M7 10v12"/>
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/>
    </svg>
  )
}

export interface ReviewCardProps {
  author:         string
  avatar?:        string
  rating:         number
  comment?:       string
  photo?:         string
  date:           string
  helpful?:       number
  isVerifiedCook?: boolean
  className?:     string
}

export function ReviewCard({
  author,
  avatar,
  rating,
  comment,
  photo,
  date,
  helpful = 0,
  isVerifiedCook = false,
  className,
}: ReviewCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 p-4 rounded-2xl',
        'bg-[var(--bg-surface)] border border-[var(--border)]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar src={avatar} fallback={author} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{author}</p>
            {isVerifiedCook && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--success-subtle)] text-[var(--success)] font-medium">
                ✓ A cuisiné
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <RatingStars value={rating} size="sm" />
            <span className="text-xs text-[var(--text-muted)]">{date}</span>
          </div>
        </div>
      </div>

      {/* Comment */}
      {comment && (
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{comment}</p>
      )}

      {/* Photo */}
      {photo && (
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-[var(--bg-elevated)]">
          <img src={photo} alt="Photo de la recette cuisinée" className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      {/* Helpful */}
      {helpful > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <ThumbsUpIcon size={12} />
          <span>{helpful} personne{helpful > 1 ? 's' : ''} ont trouvé ceci utile</span>
        </div>
      )}
    </div>
  )
}
