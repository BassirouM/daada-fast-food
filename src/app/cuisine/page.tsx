import type { Metadata } from 'next'
import Link from 'next/link'
import { RecetteCard } from './RecetteCard'

export const metadata: Metadata = {
  title: 'Cuisine Camerounaise',
  description: 'Découvrez les recettes des meilleures cuisinières de Maroua. Ndolé, Poulet DG, Eru — filmées en HD avec ingrédients locaux.',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Recette = {
  id: string
  titre: string
  imageUrl: string
  difficulte: 'Facile' | 'Moyen' | 'Difficile'
  tempTotal: number
  tier: 'free' | 'premium'
  categorie: string
}

type Epicier = {

  id: string
  nom: string
  distance: string
  specialite: string
}

// ─── Data (en attendant Supabase) ─────────────────────────────────────────────

const RECETTES: Recette[] = [
  {
    id: 'r1',
    titre: 'Ndolé Traditionnel de Maman',
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=400&fit=crop',
    difficulte: 'Moyen',
    tempTotal: 90,
    tier: 'free',
    categorie: 'Plat principal',
  },
  {
    id: 'r2',
    titre: 'Poulet DG — Recette Facile',
    imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=600&h=400&fit=crop',
    difficulte: 'Facile',
    tempTotal: 65,
    tier: 'free',
    categorie: 'Plat principal',
  },
  {
    id: 'r3',
    titre: 'Eru Authentique',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop',
    difficulte: 'Moyen',
    tempTotal: 75,
    tier: 'free',
    categorie: 'Plat principal',
  },
  {
    id: 'r4',
    titre: 'Secret : Sauce Arachide Parfaite',
    imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop',
    difficulte: 'Difficile',
    tempTotal: 135,
    tier: 'premium',
    categorie: 'Sauce',
  },
  {
    id: 'r5',
    titre: 'Beignets de Plantain Croustillants',
    imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&h=400&fit=crop',
    difficulte: 'Facile',
    tempTotal: 30,
    tier: 'premium',
    categorie: 'Snack',
  },
  {
    id: 'r6',
    titre: 'Thieb Bou Djenn Camerounais',
    imageUrl: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&h=400&fit=crop',
    difficulte: 'Difficile',
    tempTotal: 180,
    tier: 'premium',
    categorie: 'Plat principal',
  },
]

const EPICIERS: Epicier[] = [
  { id: 'e1', nom: 'Marché Central Maroua', distance: '0.8 km', specialite: 'Épices, légumes frais' },
  { id: 'e2', nom: 'Épicerie Chez Fatima', distance: '1.2 km', specialite: 'Huile de palme, graines' },
  { id: 'e3', nom: 'Grand Marché', distance: '2.1 km', specialite: 'Tous ingrédients' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CuisinePage() {
  const libres  = RECETTES.filter((r) => r.tier === 'free')
  const premium = RECETTES.filter((r) => r.tier === 'premium')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
          padding: '4rem 1.5rem 3rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              borderRadius: 999,
              background: 'linear-gradient(135deg, var(--accent-dark, #F59E0B), var(--accent, #FBBF24))',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '1rem',
            }}
          >
            ✨ Daada Cuisine
          </span>

          <h1
            style={{
              fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
              fontWeight: 800,
              color: '#1F2937',
              lineHeight: 1.15,
              marginBottom: '1rem',
            }}
          >
            Cuisinez comme un Chef camerounais 👨‍🍳
          </h1>

          <p style={{ fontSize: '1.0625rem', color: '#4B5563', lineHeight: 1.6, marginBottom: '1.5rem', maxWidth: 560 }}>
            Découvrez les secrets des meilleures cuisinières de Maroua.
            Recettes filmées en HD, instructions détaillées, ingrédients locaux.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '0.75rem 1.5rem',
                borderRadius: 12,
                background: 'var(--brand)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.9375rem',
                textDecoration: 'none',
                boxShadow: 'var(--shadow-brand)',
                transition: 'background 0.15s',
              }}
            >
              Commencer gratuitement →
            </Link>
            <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
              Premium dès 1 500 FCFA/mois · annulable à tout moment
            </span>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
            {[
              { v: '3', l: 'recettes gratuites' },
              { v: '3', l: 'recettes premium' },
              { v: '100%', l: 'ingrédients locaux' },
            ].map(({ v, l }) => (
              <div key={l}>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand)' }}>{v}</p>
                <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1024, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ── Recettes gratuites ──────────────────────────────────────────── */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recettes gratuites
            </h2>
            <span
              style={{
                padding: '3px 12px',
                borderRadius: 999,
                background: 'var(--success-subtle)',
                color: 'var(--success)',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {libres.length} disponibles
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {libres.map((r) => <RecetteCard key={r.id} recette={r} />)}
          </div>
        </section>

        {/* ── Recettes premium ────────────────────────────────────────────── */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recettes premium ✨
            </h2>
            <Link
              href="/login"
              style={{
                padding: '5px 14px',
                borderRadius: 999,
                background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Débloquer tout
            </Link>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {premium.map((r) => <RecetteCard key={r.id} recette={r} />)}
          </div>
        </section>

        {/* ── Trouver les ingrédients ──────────────────────────────────────── */}
        <section
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 20,
            border: '1px solid var(--border)',
            padding: '1.75rem',
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
            🗺️ Trouvez vos ingrédients à Maroua
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Épiceries et marchés partenaires avec les ingrédients de nos recettes
          </p>

          {/* Map placeholder */}
          <div
            style={{
              height: 200,
              borderRadius: 14,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 8,
              marginBottom: '1.25rem',
            }}
          >
            <span style={{ fontSize: '2.5rem' }}>🗺️</span>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Carte interactive — disponible après configuration Mapbox
            </p>
          </div>

          {/* Épiciers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {EPICIERS.map((e) => (
              <div
                key={e.id}
                style={{
                  background: 'var(--bg-elevated)',
                  borderRadius: 12,
                  padding: '0.875rem',
                  border: '1px solid var(--border)',
                }}
              >
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {e.nom}
                </h3>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand)', marginBottom: 2 }}>
                  📍 {e.distance}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {e.specialite}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
