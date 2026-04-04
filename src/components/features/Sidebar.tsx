'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Utensils, ShoppingBag, MapPin, User, Settings, LogOut, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth'

const NAV_LINKS = [
  { href: '/',        label: 'Accueil',    Icon: Home },
  { href: '/menu',    label: 'Menu',       Icon: Utensils },
  { href: '/orders',  label: 'Commandes',  Icon: ShoppingBag },
  { href: '/map',     label: 'Carte',      Icon: MapPin },
  { href: '/profile', label: 'Profil',     Icon: User },
  { href: '/profile/settings', label: 'Paramètres', Icon: Settings },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const { userDB, reset } = useAuthStore()

  const handleLogout = async () => {
    await authService.signOut()
    reset()
  }

  return (
    /*
     * group  — active les variantes group-hover sur les enfants
     * w-14   — largeur réduite (icônes seules)
     * hover:w-64 — largeur pleine au survol
     */
    <aside
      className={cn(
        'group hidden lg:flex flex-col',
        'fixed left-0 top-0 z-30 h-screen',
        'w-14 hover:w-64',
        'transition-[width] duration-300 ease-in-out',
        'border-r border-[var(--border)] bg-[var(--bg-base)]',
        'overflow-hidden'
      )}
    >
      {/* ── Toggle / Logo ──────────────────────────────────────────────────── */}
      <div className="flex items-center h-16 px-3.5 border-b border-[var(--border)] shrink-0">
        {/* Icône hamburger — toujours visible */}
        <Menu className="h-5 w-5 shrink-0 text-[var(--text-secondary)]" aria-hidden="true" />

        {/* Logo — visible uniquement en mode étendu */}
        <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden">
          <Logo variant="full" size="sm" />
        </div>
      </div>

      {/* ── User card ──────────────────────────────────────────────────────── */}
      {userDB && (
        <div className="flex items-center gap-3 p-3 mx-1.5 mt-3 rounded-2xl bg-[var(--bg-elevated)] shrink-0 overflow-hidden">
          {/* Avatar */}
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)] font-bold text-sm">
            {userDB.nom?.charAt(0)?.toUpperCase() ?? 'D'}
          </span>

          {/* Infos — visibles uniquement en mode étendu */}
          <div className="flex-1 min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {userDB.nom ?? 'Utilisateur'}
            </p>
            <p className="text-xs text-[var(--text-muted)] truncate">{userDB.telephone ?? ''}</p>
          </div>
        </div>
      )}

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-1.5 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_LINKS.map(({ href, label, Icon }) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : pathname === href || pathname.startsWith(`${href}/`)

          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-[var(--brand)]/10 text-[var(--brand)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 1.75} />

              {/* Label — visible uniquement en mode étendu */}
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 overflow-hidden">
                {label}
              </span>

              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Déconnexion ────────────────────────────────────────────────────── */}
      <div className="p-1.5 border-t border-[var(--border)] shrink-0">
        <button
          onClick={handleLogout}
          title="Déconnexion"
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-500 transition-colors whitespace-nowrap"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 overflow-hidden">
            Déconnexion
          </span>
        </button>
      </div>
    </aside>
  )
}
