'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CartIcon } from '@/components/features/cart/CartIcon'

const NAV_ITEMS = [
  { href: '/menu', label: 'Menu', Icon: Home },
  { href: '/orders', label: 'Commandes', Icon: ShoppingBag },
  { href: '/profile', label: 'Profil', Icon: User },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around px-4 py-2 pb-safe">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)

          if (href === '/menu') {
            return (
              <div key={href} className="flex flex-col items-center gap-0.5">
                <Link
                  href={href}
                  className={cn(
                    'flex flex-col items-center gap-0.5 text-xs transition-colors',
                    isActive ? 'text-brand-orange' : 'text-muted-foreground'
                  )}
                >
                  <Icon className={cn('h-5 w-5', isActive && 'fill-brand-orange')} />
                  <span>{label}</span>
                </Link>
              </div>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 text-xs transition-colors',
                isActive ? 'text-brand-orange' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'fill-brand-orange')} />
              <span>{label}</span>
            </Link>
          )
        })}
        {/* Cart with badge */}
        <div className="flex flex-col items-center gap-0.5">
          <CartIcon />
          <span className={cn('text-xs', pathname === '/cart' ? 'text-brand-orange' : 'text-muted-foreground')}>
            Panier
          </span>
        </div>
      </div>
    </nav>
  )
}
