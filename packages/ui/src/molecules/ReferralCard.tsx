'use client'

import * as React from 'react'
import { cn } from '../utils'
import { CopyIcon, ShareIcon, UsersIcon } from '../icons'

export interface ReferralCardProps {
  code:             string
  shareUrl:         string
  referralsCount?:  number
  totalEarned?:     number
  className?:       string
}

export function ReferralCard({
  code,
  shareUrl,
  referralsCount = 0,
  totalEarned = 0,
  className,
}: ReferralCardProps) {
  const [copied, setCopied] = React.useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for unsupported environments
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Daada Fast Food — Parrainage',
          text: `Utilise mon code ${code} pour avoir 500 FCFA de réduction sur ta première commande Daada !`,
          url: shareUrl,
        })
      } catch {
        // User cancelled or share not supported
      }
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 p-4 rounded-2xl',
        'bg-gradient-to-br from-[var(--brand-subtle)] to-transparent',
        'border border-[var(--border-brand)]',
        className
      )}
    >
      {/* Title */}
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Parrainage 🎁</h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Invitez vos amis et gagnez 500 FCFA à chaque commande passée
        </p>
      </div>

      {/* Code display */}
      <div
        className={cn(
          'flex items-center justify-between gap-2 px-4 py-3 rounded-xl',
          'bg-[var(--bg-input)] border border-[var(--border)]'
        )}
      >
        <span className="text-lg font-mono font-bold tracking-[0.25em] text-[var(--brand)]">
          {code}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Code copié' : 'Copier le code'}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium',
            'transition-all duration-200',
            copied
              ? 'bg-[var(--success-subtle)] text-[var(--success)]'
              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          )}
        >
          <CopyIcon size={13} />
          {copied ? 'Copié !' : 'Copier'}
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div className="flex-1 flex flex-col items-center p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
          <UsersIcon size={18} className="text-[var(--brand)] mb-1" />
          <p className="text-lg font-bold text-[var(--text-primary)]">{referralsCount}</p>
          <p className="text-xs text-[var(--text-muted)]">Filleuls</p>
        </div>
        <div className="flex-1 flex flex-col items-center p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
          <span className="text-lg mb-1" aria-hidden>💰</span>
          <p className="text-lg font-bold text-[var(--success)]">
            {totalEarned.toLocaleString('fr-FR')}
          </p>
          <p className="text-xs text-[var(--text-muted)]">FCFA gagnés</p>
        </div>
      </div>

      {/* Share button */}
      {navigator?.share && (
        <button
          type="button"
          onClick={handleShare}
          className={cn(
            'flex items-center justify-center gap-2 w-full h-11 rounded-xl',
            'bg-[var(--brand)] text-white text-sm font-semibold',
            'hover:bg-[var(--brand-light)]',
            'transition-colors duration-[120ms]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]'
          )}
        >
          <ShareIcon size={16} /> Partager le lien
        </button>
      )}
    </div>
  )
}
