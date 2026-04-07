'use client'

import * as React from 'react'
import { cn } from '../utils'

export interface BottomTab {
  icon:    React.ReactNode
  label:   string
  href:    string
  badge?:  number | null
  active?: boolean
}

export interface BottomTabBarProps {
  tabs:       BottomTab[]
  onNavigate?: (href: string) => void
  className?: string
}

export function BottomTabBar({ tabs, onNavigate, className }: BottomTabBarProps) {
  return (
    <nav
      aria-label="Navigation principale"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[200]',
        'flex items-center',
        'bg-[var(--bg-base)] border-t border-[var(--border)]',
        'pb-safe',
        className
      )}
    >
      {tabs.map((tab) => (
        <a
          key={tab.href}
          href={tab.href}
          onClick={onNavigate ? (e) => { e.preventDefault(); onNavigate(tab.href) } : undefined}
          aria-label={tab.badge ? `${tab.label} — ${tab.badge} notification${tab.badge > 1 ? 's' : ''}` : tab.label}
          aria-current={tab.active ? 'page' : undefined}
          className={cn(
            'relative flex-1 flex flex-col items-center gap-0.5 py-2.5 min-h-[56px]',
            'transition-colors duration-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--brand)]',
            tab.active
              ? 'text-[var(--brand)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          )}
        >
          {/* Icon wrapper */}
          <div className="relative">
            <span
              aria-hidden
              className={cn(
                'flex items-center justify-center w-6 h-6 transition-transform duration-150',
                tab.active && 'scale-110'
              )}
            >
              {tab.icon}
            </span>

            {/* Badge */}
            {tab.badge != null && tab.badge > 0 && (
              <span
                aria-hidden
                className={cn(
                  'absolute -top-1.5 -right-1.5',
                  'min-w-[16px] h-[16px] px-1 rounded-full',
                  'bg-[var(--brand)] text-white text-[9px] font-bold',
                  'flex items-center justify-center leading-none'
                )}
              >
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </div>

          {/* Label */}
          <span className={cn('text-[10px] font-medium leading-none', tab.active && 'font-semibold')}>
            {tab.label}
          </span>

          {/* Active indicator */}
          {tab.active && (
            <span
              aria-hidden
              className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[var(--brand)]"
            />
          )}
        </a>
      ))}
    </nav>
  )
}
