'use client'

import * as React from 'react'
import { cn } from '../utils'
import { ChevronLeftIcon, ChevronRightIcon, XIcon, CheckIcon } from '../icons'
import { RecipeStepCard } from '../molecules/RecipeStepCard'
import { ProgressBar } from '../atoms/ProgressBar'
import { Button } from '../atoms/Button'

export interface RecipeStep {
  position:      number
  title?:        string
  instruction:   string
  image?:        string
  videoUrl?:     string
  timerSeconds?: number
  chefTip?:      string
  isPremium?:    boolean
}

export interface StepByStepModeProps {
  steps:       RecipeStep[]
  currentStep?: number
  onNext?:     () => void
  onPrev?:     () => void
  onComplete?: () => void
  onClose?:    () => void
  title?:      string
  className?:  string
}

export function StepByStepMode({
  steps,
  currentStep: controlledStep,
  onNext,
  onPrev,
  onComplete,
  onClose,
  title,
  className,
}: StepByStepModeProps) {
  const isControlled       = controlledStep !== undefined
  const [internalStep, setInternalStep] = React.useState(0)
  const step = isControlled ? controlledStep : internalStep

  const isFirst   = step === 0
  const isLast    = step === steps.length - 1
  const progress  = steps.length > 0 ? ((step + 1) / steps.length) * 100 : 0
  const current   = steps[step]

  // Wake Lock — keep screen on while cooking
  React.useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null
    async function acquire() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as Navigator & { wakeLock: { request(type: string): Promise<WakeLockSentinel> } }).wakeLock.request('screen')
        }
      } catch {
        // WakeLock not available — silently ignore
      }
    }
    acquire()
    return () => { wakeLock?.release() }
  }, [])

  // Keyboard navigation
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') handleNext()
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   handlePrev()
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  function handleNext() {
    if (isLast) { onComplete?.(); return }
    if (!isControlled) setInternalStep((v) => Math.min(v + 1, steps.length - 1))
    onNext?.()
  }

  function handlePrev() {
    if (isFirst) return
    if (!isControlled) setInternalStep((v) => Math.max(v - 1, 0))
    onPrev?.()
  }

  if (!current) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-[400] flex flex-col',
        'bg-[var(--bg-base)]',
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-label={`Mode cuisson ${title ? `— ${title}` : ''}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe py-3 border-b border-[var(--border)] shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Quitter le mode cuisson"
          className={cn(
            'w-9 h-9 flex items-center justify-center rounded-xl',
            'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
            'transition-colors duration-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]'
          )}
        >
          <XIcon size={18} />
        </button>

        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-xs text-[var(--text-muted)] truncate">{title}</p>
          )}
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Étape {step + 1} / {steps.length}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex gap-1" aria-hidden>
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all duration-200',
                i === step     && 'bg-[var(--brand)] w-4',
                i < step       && 'bg-[var(--success)]',
                i > step       && 'bg-[var(--border-strong)]'
              )}
            />
          ))}
        </div>
      </div>

      {/* Progress */}
      <ProgressBar value={progress} max={100} color="brand" className="px-4 py-2 shrink-0" />

      {/* Step content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <RecipeStepCard
          key={current.position}
          {...current}
          isCurrent
          isDone={false}
          className="animate-scale-in"
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 px-4 pb-safe py-4 border-t border-[var(--border)] shrink-0">
        <Button
          variant="secondary"
          size="lg"
          onClick={handlePrev}
          disabled={isFirst}
          leftIcon={<ChevronLeftIcon size={18} />}
          aria-label="Étape précédente"
          className="flex-1"
        >
          Précédent
        </Button>

        {isLast ? (
          <Button
            size="lg"
            onClick={handleNext}
            leftIcon={<CheckIcon size={18} />}
            className="flex-1 bg-[var(--success)] hover:bg-green-500"
            aria-label="Terminer la recette"
          >
            Terminé !
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={handleNext}
            rightIcon={<ChevronRightIcon size={18} />}
            aria-label="Étape suivante"
            className="flex-1"
          >
            Suivant
          </Button>
        )}
      </div>
    </div>
  )
}
