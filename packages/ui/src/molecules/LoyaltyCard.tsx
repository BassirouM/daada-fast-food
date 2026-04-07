import * as React from 'react'
import { cn } from '../utils'
import { CrownIcon, ZapIcon } from '../icons'
import { ProgressBar } from '../atoms/ProgressBar'

export type LoyaltyLevel = 'Bronze' | 'Argent' | 'Or'

export interface LoyaltyCardProps {
  points:           number
  level?:           LoyaltyLevel
  nextLevelPoints?: number
  className?:       string
}

const levelConfig: Record<LoyaltyLevel, { color: string; bg: string; icon: React.ReactNode; emoji: string }> = {
  Bronze: { color: 'text-amber-700', bg: 'from-amber-900/30 to-amber-800/20', icon: <ZapIcon size={16} />,   emoji: '🥉' },
  Argent: { color: 'text-slate-400',  bg: 'from-slate-700/30 to-slate-600/20', icon: <ZapIcon size={16} />,   emoji: '🥈' },
  Or:     { color: 'text-amber-400',  bg: 'from-amber-600/30 to-yellow-500/20',icon: <CrownIcon size={16} />, emoji: '🥇' },
}

export function LoyaltyCard({
  points,
  level = 'Bronze',
  nextLevelPoints,
  className,
}: LoyaltyCardProps) {
  const cfg = levelConfig[level]
  const progress = nextLevelPoints ? Math.min(100, (points / nextLevelPoints) * 100) : 100

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-4',
        'bg-gradient-to-br border border-[var(--border)]',
        cfg.bg,
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/5" aria-hidden />
      <div className="absolute -bottom-6 -left-2 w-20 h-20 rounded-full bg-white/3" aria-hidden />

      {/* Content */}
      <div className="relative flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>{cfg.emoji}</span>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Niveau</p>
              <p className={cn('text-base font-bold', cfg.color)}>{level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)]">Solde</p>
            <p
              className="text-xl font-bold text-[var(--text-primary)]"
              aria-label={`${points} points de fidélité`}
            >
              {points.toLocaleString('fr-FR')}
              <span className="text-xs font-normal text-[var(--text-muted)] ml-1">pts</span>
            </p>
          </div>
        </div>

        {/* Progress to next level */}
        {nextLevelPoints && level !== 'Or' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
              <span>Progression</span>
              <span>{points.toLocaleString('fr-FR')} / {nextLevelPoints.toLocaleString('fr-FR')} pts</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-700"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={points}
                aria-valuemin={0}
                aria-valuemax={nextLevelPoints}
                aria-label={`Progression vers le niveau suivant : ${Math.round(progress)}%`}
              />
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Encore {(nextLevelPoints - points).toLocaleString('fr-FR')} pts pour le niveau suivant
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
