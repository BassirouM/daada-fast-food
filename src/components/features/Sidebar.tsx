'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Utensils, ShoppingBag, MapPin, User, Star, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth'

const NAV_LINKS = [
  { href: '/', label: 'Accueil', Icon: Home },
  { href: '/menu', label: 'Menu', Icon: Utensils },
  { href: '/orders', label: 'Commandes', Icon: ShoppingBag },
  { href: '/map', label: 'Carte', Icon: MapPin },
  { href: '/profile', label: 'Profil', Icon: User },
  { href: '/profile/settings', label: 'Paramètres', Icon: Settings },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const { user, reset } = useAuthStore()

  const handleLogout = async () => {
    await authService.signOut()
    reset()
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-[var(--border)] bg-[var(--bg-base)]">
      {/* Logo */}
      <div className="flex items-center h-16 px-5 border-b border-[var(--border)]">
        <Logo variant="full" size="sm" />
      </div>

      {/* User card */}
      <div className="flex items-center gap-3 p-4 mx-3 mt-3 rounded-2xl bg-[var(--bg-elevated)]">
        {user?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar_url}
            alt={user.name}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-[var(--brand)]/30"
          />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)] font-bold text-sm">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'D'}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {user?.name ?? 'Invité'}
          </p>
          <p className="text-xs text-[var(--text-muted)] truncate">{user?.phone ?? ''}</p>
        </div>
        {/* Loyalty points */}
        <div className="flex items-center gap-1 shrink-0 text-[var(--brand)]">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span className="text-xs font-bold">0</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {NAV_LINKS.map(({ href, label, Icon }) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : pathname === href || pathname.startsWith(`${href}/`)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--brand)]/10 text-[var(--brand)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 1.75} />
              {label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-[var(--border)]">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--danger-subtle)] hover:text-[var(--danger)] transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
