import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { template: '%s — Daada', default: 'Daada' },
  description: 'Livraison rapide à Maroua, Cameroun',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Fond gradient orange → noir */}
      <div
        className="fixed inset-0 -z-10"
        aria-hidden
        style={{
          background: 'linear-gradient(160deg, #FF6B00 0%, #CC4400 30%, #0A0A0A 70%)',
        }}
      />

      {/* Logo centré en haut */}
      <header className="flex flex-col items-center pt-12 pb-4 select-none" aria-label="Daada">
        <div className="flex items-center gap-2">
          <span
            className="text-5xl leading-none"
            aria-hidden
            style={{ filter: 'drop-shadow(0 0 16px rgba(255,107,0,0.8))' }}
          >
            🔥
          </span>
          <span
            className="text-5xl font-black tracking-tight text-white"
            style={{ textShadow: '0 2px 20px rgba(255,107,0,0.6)' }}
          >
            Daada
          </span>
        </div>
        <p className="text-sm text-white/60 mt-1.5 font-medium tracking-wide">
          Livraison rapide à Maroua
        </p>
      </header>

      {/* Contenu page */}
      <main className="flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </main>
    </div>
  )
}
