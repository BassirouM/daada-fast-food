import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import PwaInstallBanner from '@/components/features/home/PwaInstallBanner'
import StatsSection from '@/components/features/home/StatsSection'
import CategoriesSection from '@/components/features/home/CategoriesSection'
import CountdownSection from '@/components/features/home/CountdownSection'
import TestimonialsCarousel from '@/components/features/home/TestimonialsCarousel'

// Always render server-side so Supabase queries run fresh each request
export const dynamic = 'force-dynamic'

type Plat = Database['public']['Tables']['menus']['Row']

async function getPlatsPopulaires(): Promise<Plat[]> {
  try {
    const { data, error } = await supabase
      .from('menus')
      .select('id, nom, description, prix, categorie, image_url, note_moyenne, nb_commandes, disponible, temps_preparation, tags, created_at')
      .eq('disponible', true)
      .order('nb_commandes', { ascending: false })
      .limit(6)
    if (error) return []
    return (data ?? []) as Plat[]
  } catch {
    return []
  }
}

async function getPlatsRecommandes(): Promise<Plat[]> {
  try {
    const { data, error } = await supabase
      .from('menus')
      .select('id, nom, description, prix, categorie, image_url, note_moyenne, nb_commandes, disponible, temps_preparation, tags, created_at')
      .eq('disponible', true)
      .order('note_moyenne', { ascending: false })
      .limit(4)
    if (error) return []
    return (data ?? []) as Plat[]
  } catch {
    return []
  }
}

const CATEGORY_EMOJIS: Record<string, string> = {
  burger: '🍔',
  poulet: '🍗',
  pizza: '🍕',
  boisson: '🥤',
  dessert: '🍰',
  sandwich: '🥪',
  frites: '🍟',
  salade: '🥗',
}

function getCategoryEmoji(categorie: string): string {
  const key = categorie.toLowerCase()
  return (
    Object.entries(CATEGORY_EMOJIS).find(([k]) => key.includes(k))?.[1] ?? '🍽️'
  )
}

function PlatCardSkeleton() {
  return (
    <div
      className="animate-shimmer rounded-xl"
      style={{ height: 260, borderRadius: 'var(--radius-xl)' }}
    />
  )
}

function PlatCard({ plat }: { plat: Plat }) {
  return (
    <div
      className="glass-card"
      style={{ background: 'var(--bg-surface)', overflow: 'hidden' }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
        {plat.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={plat.image_url}
            alt={plat.nom}
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              background: 'linear-gradient(135deg, #FF6B00, #CC5500)',
            }}
          >
            {getCategoryEmoji(plat.categorie)}
          </div>
        )}
        {plat.note_moyenne > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 999,
              background: 'rgba(0,0,0,0.72)',
              color: '#FFD700',
              backdropFilter: 'blur(8px)',
            }}
          >
            ⭐ {plat.note_moyenne.toFixed(1)}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '0.75rem' }}>
        <h3
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {plat.nom}
        </h3>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {plat.description}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '0.75rem',
          }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand)' }}>
            {formatPrice(plat.prix)}
          </span>
          <Link
            href="/menu"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--brand)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 700,
              transition: 'transform var(--t-base)',
              textDecoration: 'none',
            }}
            aria-label={`Commander ${plat.nom}`}
          >
            +
          </Link>
        </div>
      </div>
    </div>
  )
}

function PromoCard({ plat }: { plat: Plat }) {
  const prixPromo = Math.round(plat.prix * 0.8)
  return (
    <div
      className="promo-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-brand)',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 'var(--radius-lg)',
          flexShrink: 0,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #FF6B00, #CC5500)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.75rem',
        }}
      >
        {plat.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={plat.image_url}
            alt={plat.nom}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          getCategoryEmoji(plat.categorie)
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'inline-block',
            fontSize: '0.6875rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 999,
            background: '#FF6B00',
            color: 'white',
            marginBottom: 4,
          }}
        >
          PROMO -20%
        </span>
        <p
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {plat.nom}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 2 }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand)' }}>
            {formatPrice(prixPromo)}
          </span>
          <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
            {formatPrice(plat.prix)}
          </span>
        </div>
      </div>

      <Link
        href="/menu"
        style={{
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--brand)',
          color: 'white',
          fontSize: '0.8125rem',
          fontWeight: 700,
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        +
      </Link>
    </div>
  )
}

const ETAPES: Array<{ svg: React.ReactNode; titre: string; desc: string }> = [
  {
    svg: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect width="48" height="48" rx="12" fill="rgba(255,107,0,0.15)" />
        <rect x="14" y="12" width="20" height="24" rx="3" fill="none" stroke="#FF6B00" strokeWidth="1.5" />
        <line x1="18" y1="19" x2="30" y2="19" stroke="#FF6B00" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="24" x2="30" y2="24" stroke="#FF6B00" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="29" x2="24" y2="29" stroke="#FF6B00" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    titre: 'Choisir',
    desc: 'Parcourez notre menu et ajoutez vos plats préférés au panier',
  },
  {
    svg: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect width="48" height="48" rx="12" fill="rgba(255,107,0,0.15)" />
        <rect x="10" y="16" width="28" height="18" rx="3" fill="none" stroke="#FF6B00" strokeWidth="1.5" />
        <line x1="10" y1="22" x2="38" y2="22" stroke="#FF6B00" strokeWidth="1.5" />
        <rect x="14" y="26" width="8" height="4" rx="1" fill="#FF6B00" opacity="0.6" />
      </svg>
    ),
    titre: 'Payer',
    desc: 'Payez en sécurité via MTN MoMo, Orange Money ou en espèces',
  },
  {
    svg: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect width="48" height="48" rx="12" fill="rgba(255,107,0,0.15)" />
        <circle cx="14" cy="32" r="4" fill="none" stroke="#FF6B00" strokeWidth="1.5" />
        <circle cx="34" cy="32" r="4" fill="none" stroke="#FF6B00" strokeWidth="1.5" />
        <path d="M18 32 L22 20 L30 20 L34 28" fill="none" stroke="#FF6B00" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M22 20 L26 14 L32 14" fill="none" stroke="#FF6B00" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    titre: 'Recevoir',
    desc: 'Votre commande arrive chaud à votre porte en ~30 min',
  },
]

export default async function HomePage() {
  const [populaires, recommandes] = await Promise.all([
    getPlatsPopulaires(),
    getPlatsRecommandes(),
  ])

  const offresJour = populaires.slice(0, 3)

  return (
    <main
      style={{
        background: 'var(--bg-base)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)',
        minHeight: '100vh',
      }}
    >
      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section
        className="hero-bg"
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: 420,
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 100%)',
            pointerEvents: 'none',
          }}
        />

        <div
          className="container"
          style={{
            position: 'relative',
            zIndex: 1,
            paddingTop: '3rem',
            paddingBottom: '3rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <span
            className="animate-fade-in"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.875rem',
              borderRadius: 999,
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'rgba(255,107,0,0.2)',
              border: '1px solid rgba(255,107,0,0.45)',
              color: '#FF8C38',
              marginBottom: '1rem',
              animationDelay: '0.1s',
            }}
          >
            🔥 Livraison à Maroua
          </span>

          {/* LCP element: text renders instantly, no network request */}
          <h1
            className="font-display animate-slide-down"
            style={{
              fontSize: 'clamp(1.875rem, 8vw, 2.5rem)',
              color: '#FFFFFF',
              marginBottom: '1rem',
              textShadow: '0 2px 24px rgba(0,0,0,0.5)',
              animationDelay: '0.2s',
            }}
          >
            La meilleure bouffe<br />de Maroua 🔥
          </h1>

          <p
            className="typing-text"
            style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.92)', marginBottom: '2rem', maxWidth: 300 }}
          >
            Commandez, on livre en 30 min ⚡
          </p>

          <Link
            href="/menu"
            className="animate-scale-in"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 2rem',
              borderRadius: 999,
              background: 'linear-gradient(135deg, #FF6B00, #CC5500)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(255,107,0,0.5)',
              animationDelay: '0.4s',
            }}
          >
            🛒 Commander maintenant
          </Link>

          <div
            className="animate-bounce-in"
            style={{ fontSize: '5rem', marginTop: '2.5rem', animationDelay: '0.6s' }}
            aria-hidden="true"
          >
            🍔
          </div>
        </div>
      </section>

      {/* ─── PWA BANNER ────────────────────────────────────────────────────── */}
      <PwaInstallBanner />

      {/* ─── STATS ─────────────────────────────────────────────────────────── */}
      <StatsSection />

      {/* ─── CATEGORIES ────────────────────────────────────────────────────── */}
      <CategoriesSection />

      {/* ─── POPULAIRES ────────────────────────────────────────────────────── */}
      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <h2 className="font-display" style={{ fontSize: '1.125rem', color: 'var(--text-primary)' }}>
              🔥 Les Plus Populaires
            </h2>
            <Link href="/menu" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand)' }}>
              Voir tout →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {populaires.length === 0
              ? Array.from({ length: 6 }).map((_, i) => <PlatCardSkeleton key={i} />)
              : populaires.map(plat => <PlatCard key={plat.id} plat={plat} />)}
          </div>
        </div>
      </section>

      {/* ─── OFFRES DU JOUR ────────────────────────────────────────────────── */}
      {offresJour.length > 0 && (
        <section style={{ padding: '1.5rem 0', background: 'var(--bg-surface)' }}>
          <div className="container">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <h2 className="font-display" style={{ fontSize: '1.125rem', color: 'var(--text-primary)' }}>
                🎁 Offres du Jour
              </h2>
              <CountdownSection />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {offresJour.map(plat => <PromoCard key={plat.id} plat={plat} />)}
            </div>
          </div>
        </section>
      )}

      {/* ─── RECOMMANDÉS ───────────────────────────────────────────────────── */}
      <section style={{ padding: '2rem 0' }}>
        <div className="container">
          <h2 className="font-display" style={{ fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: 4 }}>
            Les plus appréciés ⭐
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Recommandé pour toi
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {recommandes.length === 0
              ? Array.from({ length: 4 }).map((_, i) => <PlatCardSkeleton key={i} />)
              : recommandes.map(plat => <PlatCard key={plat.id} plat={plat} />)}
          </div>
        </div>
      </section>

      {/* ─── COMMENT COMMANDER ─────────────────────────────────────────────── */}
      <section style={{ padding: '2rem 0', background: 'var(--bg-surface)' }}>
        <div className="container">
          <h2
            className="font-display"
            style={{ fontSize: '1.25rem', color: 'var(--text-primary)', textAlign: 'center', marginBottom: '1.5rem' }}
          >
            Comment ça marche ?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {ETAPES.map((etape, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {etape.svg}
                  <span
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'var(--brand)',
                      color: 'white',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {i + 1}
                  </span>
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {etape.titre}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {etape.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TÉMOIGNAGES ───────────────────────────────────────────────────── */}
      <TestimonialsCarousel />

      {/* ─── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '2.5rem 0' }}>
        <div
          className="container"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }} aria-hidden="true">🛵</div>
          <h2 className="font-display" style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Prêt à commander ?
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Livraison rapide dans tout Maroua
          </p>
          <Link
            href="/menu"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 2rem',
              borderRadius: 999,
              background: 'linear-gradient(135deg, #FF6B00, #CC5500)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(255,107,0,0.4)',
            }}
          >
            Voir le menu →
          </Link>
        </div>
      </section>
    </main>
  )
}
