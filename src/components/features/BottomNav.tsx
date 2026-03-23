'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Utensils, ShoppingBag, MapPin, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Accueil', Icon: Home },
  { href: '/menu', label: 'Menu', Icon: Utensils },
  { href: '/orders', label: 'Commandes', Icon: ShoppingBag },
  { href: '/map', label: 'Carte', Icon: MapPin },
  { href: '/profile', label: 'Profil', Icon: User },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="bg-[var(--bg-base)]/95 backdrop-blur-xl border-t border-[var(--border)] flex items-stretch h-16">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : pathname === href || pathname.startsWith(`${href}/`)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 relative',
                'text-xs font-medium transition-colors duration-150',
                isActive
                  ? 'text-[var(--brand)]'
                  : 'text-[var(--text-muted)] active:text-[var(--text-primary)]'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-[var(--brand)]" />
              )}
              <Icon
                className={cn('h-5 w-5 transition-transform duration-150', isActive && 'scale-110')}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
