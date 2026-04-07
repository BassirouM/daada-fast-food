'use client'

import * as React from 'react'
import { cn } from '../utils'
import { LockIcon, VideoIcon, ClockIcon } from '../icons'

export interface RecipeStepCardProps {
  position:    number
  title?:      string
  instruction: string
  image?:      string
  videoUrl?:   string
  timerSeconds?: number
  chefTip?:    string
  isPremium?:  boolean
  isCurrent?:  boolean
  isDone?:     boolean
  className?:  string
}

export function RecipeStepCard({
  position,
  title,
  instruction,
  image,
  videoUrl,
  timerSeconds,
  chefTip,
  isPremium = false,
  isCurrent = false,
  isDone = false,
  className,
}: RecipeStepCardProps) {
  const [timerLeft, setTimerLeft] = React.useState<number | null>(null)
  const [timerRunning, setTimerRunning] = React.useState(false)

  React.useEffect(() => {
    if (!timerRunning || timerLeft === null) return
    if (timerLeft <= 0) { setTimerRunning(false); return }
    const id = setTimeout(() => setTimerLeft((v) => (v ?? 0) - 1), 1000)
    return () => clearTimeout(id)
  }, [timerRunning, timerLeft])

  function startTimer() {
    setTimerLeft(timerSeconds ?? 0)
    setTimerRunning(true)
  }

  function formatTimer(s: number): string {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden',
        'bg-[var(--bg-surface)] border',
        'transition-all duration-200',
        isCurrent && 'border-[var(--brand)] shadow-[0_0_0_1px_var(--border-brand)]',
        !isCurrent && isDone && 'border-[var(--success)] opacity-70',
        !isCurrent && !isDone && 'border-[var(--border)]',
        isPremium && !isCurrent && 'opacity-60',
        className
      )}
    >
      {/* Image */}
      {image && !isPremium && (
        <div className="relative w-full aspect-video overflow-hidden bg-[var(--bg-elevated)]">
          <img src={image} alt={title ?? `Étape ${position}`} className="w-full h-full object-cover" loading="lazy" />
          {videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Voir la vidéo"
              className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors"
            >
              <span className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <VideoIcon size={24} className="text-white ml-1" />
              </span>
            </a>
          )}
        </div>
      )}

      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold',
              isDone  && 'bg-[var(--success)] text-white',
              isCurrent && 'bg-[var(--brand)] text-white',
              !isCurrent && !isDone && 'bg-[var(--bg-overlay)] text-[var(--text-muted)]'
            )}
            aria-label={`Étape ${position}`}
          >
            {isDone ? '✓' : position}
          </span>
          {title && (
            <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-snug flex-1">
              {title}
            </h3>
          )}
          {isPremium && (
            <LockIcon size={14} className="text-amber-400 shrink-0 mt-0.5" aria-label="Étape premium" />
          )}
        </div>

        {/* Instruction */}
        {isPremium ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <LockIcon size={24} className="text-amber-400" />
            <p className="text-sm text-[var(--text-muted)] text-center">
              Contenu premium. Abonnez-vous pour accéder à cette étape.
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {instruction}
          </p>
        )}

        {/* Timer */}
        {timerSeconds && !isPremium && (
          <div className="flex items-center gap-2">
            <ClockIcon size={14} className="text-[var(--brand)]" />
            {timerLeft !== null ? (
              <span
                className={cn(
                  'text-sm font-mono font-semibold',
                  timerLeft <= 10 ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'
                )}
                aria-live="polite"
                aria-label={`Minuteur : ${formatTimer(timerLeft)}`}
              >
                {formatTimer(timerLeft)}
              </span>
            ) : (
              <span className="text-sm text-[var(--text-muted)]">
                {Math.floor(timerSeconds / 60)} min
              </span>
            )}
            <button
              type="button"
              onClick={startTimer}
              className={cn(
                'ml-auto text-xs font-medium px-2.5 py-1 rounded-lg',
                'bg-[var(--brand-subtle)] text-[var(--brand)]',
                'hover:bg-[var(--brand)] hover:text-white',
                'transition-colors duration-100'
              )}
            >
              {timerLeft !== null ? 'Relancer' : 'Démarrer'}
            </button>
          </div>
        )}

        {/* Chef tip */}
        {chefTip && !isPremium && (
          <div className="flex gap-2 px-3 py-2 rounded-xl bg-[var(--brand-subtle)] border border-[var(--border-brand)]">
            <span className="text-base shrink-0" aria-hidden>👨‍🍳</span>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              <span className="font-semibold text-[var(--brand)]">Astuce du chef : </span>
              {chefTip}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
