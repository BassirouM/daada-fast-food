'use client'

const TEMOIGNAGES = [
  {
    nom: 'Fatima N.',
    quartier: 'Domayo',
    note: 5,
    texte: 'Les burgers sont incroyables ! Livraison en 25 minutes, encore chaud à la maison. Je recommande vivement Daada !',
    avatar: '👩🏾',
  },
  {
    nom: 'Moussa K.',
    quartier: 'Katoual',
    note: 5,
    texte: 'Meilleur poulet grillé de Maroua, sans discussion. L\'app est simple et le paiement MTN MoMo fonctionne parfaitement.',
    avatar: '👨🏿',
  },
  {
    nom: 'Aïssatou B.',
    quartier: 'Pont Vert',
    note: 5,
    texte: 'Je commande chaque semaine depuis 3 mois. Les offres du vendredi sont top et la livraison est toujours ponctuelle.',
    avatar: '👩🏿',
  },
  {
    nom: 'Ibrahim D.',
    quartier: 'Lopéré',
    note: 4,
    texte: 'Très bonne qualité pour le prix. La pizza au feu de bois vaut vraiment le détour. Service client réactif aussi.',
    avatar: '👨🏾',
  },
]

// Duplicate for infinite scroll illusion
const ALL = [...TEMOIGNAGES, ...TEMOIGNAGES]

export default function TestimonialsCarousel() {
  return (
    <section style={{ padding: '2rem 0', overflow: 'hidden' }}>
      <div style={{ paddingLeft: '1rem', marginBottom: '1rem' }}>
        <h2
          className="font-display"
          style={{ fontSize: '1.125rem', color: 'var(--text-primary)' }}
        >
          Ce que disent nos clients 💬
        </h2>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          width: 'max-content',
          animation: 'scrollLeft 28s linear infinite',
        }}
      >
        {ALL.map((t, i) => (
          <div
            key={i}
            className="glass-card"
            style={{
              width: 260,
              flexShrink: 0,
              padding: '1rem',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }}>
              <span style={{ fontSize: '2rem' }}>{t.avatar}</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{t.nom}</p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>📍 {t.quartier}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1px', marginBottom: '0.5rem' }}>
              {Array.from({ length: 5 }).map((_, j) => (
                <span key={j} style={{ color: j < t.note ? '#FFD700' : 'var(--border)', fontSize: '0.875rem' }}>
                  ★
                </span>
              ))}
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              &ldquo;{t.texte}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
