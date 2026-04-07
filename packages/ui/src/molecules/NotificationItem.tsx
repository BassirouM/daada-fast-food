'use client'

import * as React from 'react'
import { cn } from '../utils'
import { BellIcon, TruckIcon, CheckCircleIcon, AlertCircleIcon, InfoIcon } from '../icons'

export interface NotificationItemProps {
  title:     string
  body?:     string
  time:      string
  read?:     boolean
  type?:     string
  onRead?:   () => void
  className?: string
}

function NotifIcon({ type }: { type?: string }) {
  const cls = 'shrink-0'
  if (type === 'order')    return <TruckIcon size={18} className={cn(cls, 'text-[var(--brand)]')} />
  if (type === 'payment')  return <CheckCircleIcon size={18} className={cn(cls, 'text-[var(--success)]')} />
  if (type === 'warning')  return <AlertCircleIcon size={18} className={cn(cls, 'text-[var(--warning)]')} />
  return <BellIcon size={18} className={cn(cls, 'text-[var(--info)]')} />
}

function notifBg(type?: string): string {
  if (type === 'order')   return 'bg-[var(--brand-subtle)]'
  if (type === 'payment') return 'bg-[var(--success-subtle)]'
  if (type === 'warning') return 'bg-[var(--warning-subtle)]'
  return 'bg-[var(--info-subtle)]'
}

export function NotificationItem({
  title,
  body,
  time,
  read = false,
  type,
  onRead,
  className,
}: NotificationItemProps) {
  return (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-2xl transition-colors duration-150',
        !read ? 'bg-[var(--bg-surface)] border border-[var(--border-strong)]' : 'bg-transparent',
        onRead && 'cursor-pointer hover:bg-[var(--bg-surface)]',
        className
      )}
      role="listitem"
      onClick={!read ? onRead : undefined}
      tabIndex={!read && onRead ? 0 : undefined}
      onKeyDown={!read && onRead ? (e) => { if (e.key === 'Enter') onRead?.() } : undefined}
      aria-label={read ? undefined : 'Notification non lue — cliquer pour marquer comme lu'}
    >
      {/* Icon */}
      <div className={cn('shrink-0 w-9 h-9 rounded-xl flex items-center justify-center', notifBg(type))}>
        <NotifIcon type={type} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm leading-snug', !read ? 'font-semibold text-[var(--text-primary)]' : 'font-normal text-[var(--text-secondary)]')}>
          {title}
        </p>
        {body && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed line-clamp-2">
            {body}
          </p>
        )}
        <p className="text-xs text-[var(--text-muted)] mt-1">{time}</p>
      </div>

      {/* Unread dot */}
      {!read && (
        <span
          aria-label="Non lu"
          className="shrink-0 w-2 h-2 rounded-full bg-[var(--brand)] mt-1.5"
        />
      )}
    </div>
  )
}
