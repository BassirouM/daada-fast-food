import * as React from 'react'
import { cn } from '../utils'
import { Badge } from '../atoms/Badge'
import { ClockIcon, CheckCircleIcon, TruckIcon, PackageIcon, XIcon } from '../icons'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivering'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

interface StatusConfig {
  label:   string
  variant: 'default' | 'info' | 'warning' | 'success' | 'danger'
  icon:    React.ReactNode
  step:    number
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pending:    { label: 'En attente',   variant: 'default', icon: <ClockIcon size={12} />,        step: 0 },
  confirmed:  { label: 'Confirmé',     variant: 'info',    icon: <CheckCircleIcon size={12} />,  step: 1 },
  preparing:  { label: 'En préparation', variant: 'warning', icon: <PackageIcon size={12} />,   step: 2 },
  ready:      { label: 'Prêt',         variant: 'warning', icon: <CheckCircleIcon size={12} />, step: 3 },
  delivering: { label: 'En livraison', variant: 'info',    icon: <TruckIcon size={12} />,       step: 4 },
  delivered:  { label: 'Livré',        variant: 'success', icon: <CheckCircleIcon size={12} />, step: 5 },
  cancelled:  { label: 'Annulé',       variant: 'danger',  icon: <XIcon size={12} />,           step: -1 },
  refunded:   { label: 'Remboursé',    variant: 'info',    icon: <CheckCircleIcon size={12} />, step: -1 },
}

export interface OrderStatusBadgeProps {
  status:    OrderStatus
  size?:     'sm' | 'md'
  className?: string
}

export function OrderStatusBadge({ status, size = 'md', className }: OrderStatusBadgeProps) {
  const config = ORDER_STATUS_CONFIG[status]
  return (
    <Badge
      variant={config.variant}
      size={size}
      className={cn('gap-1', className)}
    >
      {config.icon}
      {config.label}
    </Badge>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export interface StatusHistoryEntry {
  from_status?: string | null
  to_status:   string
  changed_by?: string | null
  note?:       string | null
  created_at:  string
}

export interface OrderStatusTimelineProps {
  history:    StatusHistoryEntry[]
  className?: string
}

const TIMELINE_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'pending',    label: 'Commande reçue' },
  { status: 'confirmed',  label: 'Confirmée' },
  { status: 'preparing',  label: 'En préparation' },
  { status: 'ready',      label: 'Prête' },
  { status: 'delivering', label: 'En livraison' },
  { status: 'delivered',  label: 'Livrée' },
]

export function OrderStatusTimeline({ history, className }: OrderStatusTimelineProps) {
  const latestStatus = history[history.length - 1]?.to_status as OrderStatus | undefined
  const currentStep = latestStatus ? ORDER_STATUS_CONFIG[latestStatus]?.step ?? 0 : 0
  const isCancelled = latestStatus === 'cancelled' || latestStatus === 'refunded'

  return (
    <ol className={cn('flex flex-col gap-0', className)} aria-label="Historique de statut">
      {TIMELINE_STEPS.map((step, i) => {
        const stepCfg  = ORDER_STATUS_CONFIG[step.status]
        const isDone   = currentStep > stepCfg.step
        const isActive = currentStep === stepCfg.step && !isCancelled
        const isLast   = i === TIMELINE_STEPS.length - 1

        return (
          <li key={step.status} className="flex gap-3">
            {/* Icon + line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                  'border-2 transition-colors duration-300',
                  isDone  && 'bg-[var(--success)] border-[var(--success)] text-white',
                  isActive && 'bg-[var(--brand)] border-[var(--brand)] text-white',
                  !isDone && !isActive && 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)]'
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {stepCfg.icon}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[20px] transition-colors duration-300',
                    isDone ? 'bg-[var(--success)]' : 'bg-[var(--border)]'
                  )}
                />
              )}
            </div>

            {/* Label */}
            <div className={cn('pb-5 pt-1 min-w-0', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-medium leading-none',
                  isActive && 'text-[var(--brand)]',
                  isDone  && 'text-[var(--text-primary)]',
                  !isDone && !isActive && 'text-[var(--text-muted)]'
                )}
              >
                {step.label}
              </p>
            </div>
          </li>
        )
      })}

      {isCancelled && (
        <li className="flex items-center gap-3 mt-1">
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--danger-subtle)] border-2 border-[var(--danger)] text-[var(--danger)] shrink-0">
            <XIcon size={12} />
          </div>
          <p className="text-sm font-medium text-[var(--danger)] pt-1">
            {latestStatus === 'refunded' ? 'Remboursée' : 'Annulée'}
          </p>
        </li>
      )}
    </ol>
  )
}
