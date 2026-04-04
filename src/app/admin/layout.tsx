'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Bike,
  BarChart3,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

// ─── Navigation ───────────────────────────────────────────────────────────────

const NAV = [
  { href: '/admin',          icon: LayoutDashboard, label: 'Vue d\'ensemble' },
  { href: '/admin/orders',   icon: ShoppingBag,     label: 'Commandes'       },
  { href: '/admin/menu',     icon: UtensilsCrossed, label: 'Menu'            },
  { href: '/admin/livreurs', icon: Bike,            label: 'Livreurs'        },
  { href: '/admin/rapports', icon: BarChart3,       label: 'Rapports'        },
]

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ── Garde rôle ─────────────────────────────────────────────────────────────
  const isAdmin = user ? (['admin', 'super_admin'] as string[]).includes(user.role) : false

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/login?returnUrl=/admin')
      return
    }
    if (!(['admin', 'super_admin'] as string[]).includes(user.role)) {
      router.replace('/')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-base)]">
        <div className="text-[var(--text-muted)] text-sm">Vérification des droits…</div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-[var(--border)]',
          'bg-[var(--bg-surface)] transition-transform duration-200',
          'lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 px-4 border-b border-[var(--border)]">
          <span className="text-xl">🍔</span>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">Daada Admin</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">
              {(user.role as string) === 'super_admin' ? 'Super Admin' : 'Admin'}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => {
            const exact   = href === '/admin'
            const active  = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  active
                    ? 'bg-[var(--brand)]/10 text-[var(--brand)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="h-3 w-3 opacity-50" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer — infos admin + déconnexion */}
        <div className="border-t border-[var(--border)] p-3">
          <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
            <div className="w-7 h-7 rounded-full bg-[var(--brand)]/20 flex items-center justify-center text-xs font-bold text-[var(--brand)]">
              {user.nom.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.nom}</p>
              <p className="text-[10px] text-[var(--text-muted)] truncate">{user.telephone}</p>
            </div>
          </div>
          <button
            onClick={() => { void handleLogout() }}
            className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar mobile */}
        <header className="flex h-14 items-center gap-3 border-b border-[var(--border)] px-4 bg-[var(--bg-surface)] lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label="Ouvrir le menu"
          >
            <svg className="h-5 w-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-bold text-[var(--text-primary)]">Daada Admin</span>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
