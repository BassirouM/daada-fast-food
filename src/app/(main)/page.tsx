import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import WelcomeBanner    from '@/components/features/home/WelcomeBanner'
import HomeSearchBar    from '@/components/features/home/HomeSearchBar'
import PwaInstallBanner from '@/components/features/home/PwaInstallBanner'
import TestimonialsCarousel from '@/components/features/home/TestimonialsCarousel'

export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

type Plat = Database['public']['Tables']['menus']['Row']

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getPlats(): Promise<{ populaires: Plat[]; topNotes: Plat[] }> {
  try {
    const [{ data: pop }, { data: top }] = await Promise.all([
      supabase
        .from('menus')
        .select('id, nom, description, prix, categorie, image_url, note_moyenne, nb_commandes, disponible, temps_preparation, tags, created_at')
        .eq('disponible', true)
        .order('nb_commandes', { ascending: false })
        .limit(6),
      supabase
        .from('menus')
        .select('id, nom, description, prix, categorie, image_url, note_moyenne, nb_commandes, disponible, temps_preparation, tags, created_at')
        .eq('disponible', true)
        .order('note_moyenne', { ascending: false })
        .limit(4),
    ])
    return { populaires: (pop ?? []) as Plat[], topNotes: (top ?? []) as Plat[] }
  } catch {
    return { populaires: [], topNotes: [] }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CAT_CONFIG: Record<string, { emoji: string; gradient: string; label: string }> = {
  burger:   { emoji: '🍔', gradient: 'linear-gradient(135deg, #F97316, #FB923C)', label: 'Burgers'  },
  poulet:   { emoji: '🍗', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)', label: 'Poulet'   },
  pizza:    { emoji: '🍕', gradient: 'linear-gradient(135deg, #EF4444, #DC2626)', label: 'Pizza'    },
  frites:   { emoji: '🍟', gradient: 'linear-gradient(135deg, #EAB308, #CA8A04)', label: 'Frites'   },
  boisson:  { emoji: '🥤', gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)', label: 'Boissons' },
  dessert:  { emoji: '🍰', gradient: 'linear-gradient(135deg, #EC4899, #DB2777)', label: 'Desserts' },
  sandwich: { emoji: '🥪', gradient: 'linear-gradient(135deg, #10B981, #059669)', label: 'Sandwichs'},
  salade:   { emoji: '🥗', gradient: 'linear-gradient(135deg, #22C55E, #16A34A)', label: 'Salades'  },
}

function getCatInfo(cat: string) {
  const k = cat.toLowerCase()
  return Object.entries(CAT_CONFIG).find(([key]) => k.includes(key))?.[1]
    ?? { emoji: '🍽️', gradient: 'linear-gradient(135deg, #6B7280, #4B5563)', label: cat }
}

// ─── Composants ───────────────────────────────────────────────────────────────

function PlatCard({ plat }: { plat: Plat }) {
  const cat    = getCatInfo(plat.categorie)
  const temps  = (plat.temps_preparation ?? 20) + 10
  const isHot  = plat.nb_commandes > 50

  return (
    <Link
      href={`/menu?id=${plat.id}`}
      style={{
        display: 'block', textDecoration: 'none',
        borderRadius: 18, overflow: 'hidden',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', height: 130, overflow: 'hidden' }}>
        {plat.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={plat.image_url} alt={plat.nom} loading="lazy" decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: cat.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '3.25rem',
          }}>{cat.emoji}</div>
        )}

        {/* Badges */}
        {isHot && (
          <span style={{
            position: 'absolute', top: 8, left: 8,
            fontSize: '0.625rem', fontWeight: 800,
            padding: '3px 8px', borderRadius: 999,
            background: '#F97316', color: 'white',
          }}>🔥 Populaire</span>
        )}
        <span style={{
          position: 'absolute', bottom: 8, right: 8,
          fontSize: '0.6875rem', fontWeight: 700,
          padding: '3px 8px', borderRadius: 999,
          background: 'rgba(0,0,0,0.65)', color: 'white',
          backdropFilter: 'blur(6px)',
        }}>🛵 {temps} min</span>
      </div>

      {/* Infos */}
      <div style={{ padding: '0.7rem 0.75rem 0.75rem' }}>
        <p style={{
          fontSize: '0.875rem', fontWeight: 700,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: plat.note_moyenne > 0 ? 3 : 8,
        }}>{plat.nom}</p>

        {plat.note_moyenne > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 6 }}>
            <span style={{ fontSize: '0.625rem', color: '#F59E0B' }}>★★★★★</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: 2 }}>
              {plat.note_moyenne.toFixed(1)}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1rem', fontWeight: 900, color: '#F97316' }}>
            {formatPrice(plat.prix)}
          </span>
          <span style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #F97316, #EA580C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '1.25rem', fontWeight: 700,
            boxShadow: '0 3px 10px rgba(249,115,22,0.4)',
          }}>+</span>
        </div>
      </div>
    </Link>
  )
}

function SectionHeader({ title, sub, href }: { title: string; sub?: string; href?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          {title}
        </h2>
        {sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</p>}
      </div>
      {href && (
        <Link href={href} style={{
          fontSize: '0.8125rem', fontWeight: 700, color: '#F97316',
          textDecoration: 'none', whiteSpace: 'nowrap', paddingTop: 2,
        }}>Voir tout →</Link>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { populaires, topNotes } = await getPlats()
  const offres = populaires.slice(0, 3)

  return (
    <main style={{
      background: 'var(--bg-base)',
      paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)',
      minHeight: '100vh',
    }}>

      {/* ══════════════════════════════════════════════════════════════════
          1. BIENVENUE personnalisée
      ══════════════════════════════════════════════════════════════════ */}
      <WelcomeBanner />

      {/* ══════════════════════════════════════════════════════════════════
          2. HERO — headline + barre de recherche
      ══════════════════════════════════════════════════════════════════ */}
      <section
        className="hero-bg"
        style={{ position: 'relative', overflow: 'hidden', paddingBottom: '2rem' }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(165deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.75) 100%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'relative', zIndex: 1,
          padding: '2.25rem 1.25rem 1.75rem',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center', gap: '0.875rem',
        }}>
          {/* Pill live */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '0.3125rem 0.875rem', borderRadius: 999,
            fontSize: '0.75rem', fontWeight: 700,
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.28)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#22C55E',
              boxShadow: '0 0 0 2px rgba(34,197,94,0.3)',
              display: 'inline-block',
            }} />
            On livre maintenant · Maroua 📍
          </span>

          <h1 className="font-display" style={{
            fontSize: 'clamp(1.625rem, 7vw, 2.5rem)',
            color: '#fff',
            lineHeight: 1.15,
            textShadow: '0 2px 20px rgba(0,0,0,0.45)',
            maxWidth: 340,
          }}>
            La meilleure bouffe<br />
            <span style={{ color: '#FB923C' }}>livrée en 30 min</span> ⚡
          </h1>

          <HomeSearchBar />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          3. STATS rapides — barre de confiance
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 0,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {[
          { val: '500+',  label: 'commandes/jour' },
          { val: '4.8★',  label: 'note moyenne'   },
          { val: '~30',   label: 'min livraison'  },
          { val: '100%',  label: 'local Maroua'   },
        ].map((s, i) => (
          <div key={i} style={{
            flex: '1 0 auto',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '0.75rem 0.5rem',
            borderRight: i < 3 ? '1px solid var(--border)' : 'none',
            minWidth: 72,
          }}>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#F97316' }}>{s.val}</span>
            <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: 1, whiteSpace: 'nowrap' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          4. CATÉGORIES — grille visuelle 4×2
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '1.5rem 1rem 1rem' }}>
        <SectionHeader title="🍽️ Que veux-tu manger ?" href="/menu" />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.625rem',
        }}>
          {Object.entries(CAT_CONFIG).slice(0, 8).map(([slug, { emoji, gradient, label }]) => (
            <Link
              key={slug}
              href={`/menu?categorie=${slug}`}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '0.4rem',
                padding: '0.875rem 0.25rem',
                borderRadius: 16, textDecoration: 'none',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                transition: 'transform 0.15s',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem',
                boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
              }}>{emoji}</div>
              <span style={{
                fontSize: '0.625rem', fontWeight: 700,
                color: 'var(--text-primary)',
                textAlign: 'center', lineHeight: 1.2,
              }}>{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          5. OFFRES DU JOUR — cards horizontales
      ══════════════════════════════════════════════════════════════════ */}
      {offres.length > 0 && (
        <section style={{ padding: '0.5rem 0 1.5rem' }}>
          <div style={{ padding: '0 1rem', marginBottom: '0.875rem' }}>
            <SectionHeader
              title="🎁 Offres du jour"
              sub="Disponibles aujourd'hui uniquement"
              href="/menu"
            />
          </div>
          <div style={{
            display: 'flex', gap: '0.75rem',
            overflowX: 'auto', padding: '0.125rem 1rem 0.5rem',
            scrollbarWidth: 'none',
          }}>
            {offres.map((plat) => {
              const cat      = getCatInfo(plat.categorie)
              const promo    = Math.round(plat.prix * 0.8)
              return (
                <Link
                  key={plat.id}
                  href={`/menu?id=${plat.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    minWidth: 240, padding: '0.875rem',
                    borderRadius: 16, textDecoration: 'none',
                    background: 'var(--bg-surface)',
                    border: '1px solid rgba(249,115,22,0.2)',
                    boxShadow: '0 2px 12px rgba(249,115,22,0.08)',
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: 60, height: 60, borderRadius: 12, flexShrink: 0,
                    background: cat.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.75rem', overflow: 'hidden',
                  }}>
                    {plat.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={plat.image_url} alt={plat.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : cat.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: '0.625rem', fontWeight: 800,
                      padding: '2px 8px', borderRadius: 999,
                      background: '#F97316', color: 'white',
                      display: 'inline-block', marginBottom: 4,
                    }}>-20%</span>
                    <p style={{
                      fontSize: '0.875rem', fontWeight: 700,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{plat.nom}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontWeight: 800, color: '#F97316', fontSize: '0.9375rem' }}>{formatPrice(promo)}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatPrice(plat.prix)}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          6. PWA
      ══════════════════════════════════════════════════════════════════ */}
      <PwaInstallBanner />

      {/* ══════════════════════════════════════════════════════════════════
          7. LES PLUS COMMANDÉS
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '1.5rem 1rem' }}>
        <SectionHeader
          title="🔥 Les plus commandés"
          sub="Ce que tout Maroua commande"
          href="/menu"
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
          {populaires.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-shimmer" style={{ height: 230, borderRadius: 18 }} />
              ))
            : populaires.map((p) => <PlatCard key={p.id} plat={p} />)}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          8. LES MIEUX NOTÉS
      ══════════════════════════════════════════════════════════════════ */}
      {topNotes.length > 0 && (
        <section style={{ padding: '0.5rem 1rem 1.5rem', background: 'var(--bg-surface)' }}>
          <div style={{ paddingTop: '1rem' }}>
            <SectionHeader title="⭐ Les mieux notés" sub="Recommandés par nos clients" href="/menu" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {topNotes.map((p) => <PlatCard key={p.id} plat={p} />)}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          9. MODES DE PAIEMENT — confiance locale
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '1.5rem 1rem' }}>
        <h2 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>
          💳 Paiement facile
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {[
            { icon: '📱', label: 'MTN Mobile Money',    sub: 'Paiement instantané',      color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
            { icon: '🟠', label: 'Orange Money',        sub: 'Confirmation en 1 clic',   color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
            { icon: '💵', label: 'Espèces à la livraison', sub: 'Aucune app requise',    color: '#22C55E', bg: 'rgba(34,197,94,0.08)'  },
          ].map(({ icon, label, sub, color, bg }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '0.875rem 1rem',
              borderRadius: 14, background: bg,
              border: `1px solid ${color}30`,
            }}>
              <span style={{ fontSize: '1.625rem', flexShrink: 0 }}>{icon}</span>
              <div>
                <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 1 }}>{sub}</p>
              </div>
              <span style={{
                marginLeft: 'auto', fontSize: '0.6875rem', fontWeight: 700,
                padding: '3px 10px', borderRadius: 999,
                background: color, color: 'white', flexShrink: 0,
              }}>Actif</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          10. COMMANDER EN 3 ÉTAPES
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '0.5rem 1rem 1.5rem', background: 'var(--bg-surface)' }}>
        <div style={{ paddingTop: '1rem' }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Commander en 3 étapes
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0' }}>
          {[
            { n: '1', emoji: '🛒', titre: 'Choisir',  desc: 'Parcourez notre menu appétissant' },
            { n: '2', emoji: '💳', titre: 'Payer',     desc: 'MoMo, Orange Money ou espèces'   },
            { n: '3', emoji: '🛵', titre: 'Recevoir',  desc: 'Chaud, rapide, à votre porte'    },
          ].map(({ n, emoji, titre, desc }, i) => (
            <div key={n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
              {/* Ligne de connexion entre étapes */}
              {i < 2 && (
                <div style={{
                  position: 'absolute', top: 20, left: '50%', width: '100%',
                  height: 2,
                  background: 'linear-gradient(90deg, #F97316, rgba(249,115,22,0.2))',
                  zIndex: 0,
                }} />
              )}
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: 'linear-gradient(135deg, #F97316, #EA580C)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.25rem',
                boxShadow: '0 4px 14px rgba(249,115,22,0.35)',
                position: 'relative', zIndex: 1,
                marginBottom: '0.625rem',
              }}>{emoji}</div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 3 }}>{titre}</p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.4, padding: '0 0.25rem' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          11. TÉMOIGNAGES
      ══════════════════════════════════════════════════════════════════ */}
      <TestimonialsCarousel />

      {/* ══════════════════════════════════════════════════════════════════
          12. CTA FINAL
      ══════════════════════════════════════════════════════════════════ */}
      <section style={{
        margin: '1rem', borderRadius: 20,
        background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
        padding: '2rem 1.5rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        boxShadow: '0 8px 32px rgba(249,115,22,0.35)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🛵</div>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 900, color: '#fff', marginBottom: '0.375rem' }}>
          Prêt à commander ?
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.82)', marginBottom: '1.25rem' }}>
          Livraison rapide dans tout Maroua
        </p>
        <Link
          href="/menu"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '0.875rem 2.25rem', borderRadius: 999,
            background: '#fff', color: '#F97316',
            fontSize: '1rem', fontWeight: 800,
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          Voir le menu →
        </Link>
      </section>

    </main>
  )
}
