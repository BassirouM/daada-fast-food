'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { cn } from '@/lib/utils'

// ─── Types locaux ─────────────────────────────────────────────────────────────

type NiveauUI = 'bronze' | 'argent' | 'or' | 'diamant'

// ─── Constantes ───────────────────────────────────────────────────────────────

const QUARTIERS_MAROUA = [
  'Centre-ville',
  'Domayo',
  'Kakataré',
  'Djarengol',
  'Founangué',
  'Pont-Vert',
  'Hardé',
  'Lopéré',
  'Makabaye',
  'Pitoaré',
  'Ngassa',
  'Kongola',
  'Doualaré',
  'Bamaré',
  'Papata',
  'Dougoy',
]

type NiveauConfig = {
  label: string
  emoji: string
  seuil: number
  prochainSeuil: number | null
  avantage: string
  couleur: string
}

const NIVEAUX: Record<NiveauUI, NiveauConfig> = {
  bronze: {
    label: 'Bronze',
    emoji: '🥉',
    seuil: 0,
    prochainSeuil: 1000,
    avantage: 'Bienvenue chez Daada !',
    couleur: '#CD7F32',
  },
  argent: {
    label: 'Argent',
    emoji: '🥈',
    seuil: 1000,
    prochainSeuil: 5000,
    avantage: 'Livraison -50%',
    couleur: '#C0C0C0',
  },
  or: {
    label: 'Or',
    emoji: '🥇',
    seuil: 5000,
    prochainSeuil: 10000,
    avantage: 'Livraison gratuite',
    couleur: '#FFD700',
  },
  diamant: {
    label: 'Diamant',
    emoji: '💎',
    seuil: 10000,
    prochainSeuil: null,
    avantage: '-10% sur tout',
    couleur: '#B9F2FF',
  },
}

const NIVEAUX_LIST: NiveauUI[] = ['bronze', 'argent', 'or', 'diamant']

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function getNiveauUI(points: number): NiveauUI {
  if (points >= 10000) return 'diamant'
  if (points >= 5000) return 'or'
  if (points >= 1000) return 'argent'
  return 'bronze'
}

function getProgressInfo(points: number, niveau: NiveauUI) {
  const cfg = NIVEAUX[niveau]
  if (!cfg.prochainSeuil) return { pct: 100, restant: 0, prochainSeuil: null }
  const range = cfg.prochainSeuil - cfg.seuil
  const done = points - cfg.seuil
  const pct = Math.min(100, Math.round((done / range) * 100))
  return { pct, restant: cfg.prochainSeuil - points, prochainSeuil: cfg.prochainSeuil }
}

function maskPhone(telephone: string): string {
  const digits = telephone.replace(/\D/g, '')
  const local = digits.startsWith('237') ? digits.slice(3) : digits
  if (local.length !== 9) return telephone
  const last2 = local.slice(-2)
  return `+237 ${local[0]}XX XXX X${last2}`
}

function getInitials(nom: string): string {
  const parts = nom.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  return nom.slice(0, 2).toUpperCase()
}

function getAvatarColor(nom: string): string {
  const palette = [
    '#FF6B00', '#E63946', '#457B9D', '#2A9D8F',
    '#E9C46A', '#8338EC', '#06D6A0', '#118AB2',
  ]
  let hash = 0
  for (const ch of nom) hash = (hash * 31 + ch.charCodeAt(0)) % palette.length
  return palette[Math.abs(hash)]!
}

// ─── Avatar SVG initiales ─────────────────────────────────────────────────────

function AvatarSVG({ nom, size = 80 }: { nom: string; size?: number }) {
  const initials = getInitials(nom)
  const bg = getAvatarColor(nom)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      role="img"
      aria-label={`Avatar de ${nom}`}
    >
      <circle cx="40" cy="40" r="40" fill={bg} />
      <text
        x="40"
        y="40"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="28"
        fontWeight="700"
        fill="white"
        fontFamily="system-ui, sans-serif"
      >
        {initials}
      </text>
    </svg>
  )
}

// ─── ProfileHeader ────────────────────────────────────────────────────────────

function ProfileHeader() {
  const { user, updateProfile } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const [nom, setNom] = useState('')
  const [quartier, setQuartier] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenEdit = () => {
    setNom(user?.nom ?? '')
    setQuartier(user?.quartier ?? '')
    setError(null)
    setEditOpen(true)
  }

  const handleSave = async () => {
    if (nom.trim().length < 2) {
      setError('Le nom doit contenir au moins 2 caractères.')
      return
    }
    setSaving(true)
    const ok = await updateProfile({
      nom: nom.trim(),
      quartier: quartier || undefined,
    })
    setSaving(false)
    if (ok) {
      setEditOpen(false)
    } else {
      setError('Erreur lors de la mise à jour. Réessayez.')
    }
  }

  if (!user) return null

  const niveau = getNiveauUI(user.points_fidelite)

  return (
    <>
      <div className="flex items-center gap-4 px-4 py-5">
        {/* Avatar */}
        <div className="relative shrink-0">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt={user.nom}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-[var(--brand)]/30"
            />
          ) : (
            <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-[var(--brand)]/30">
              <AvatarSVG nom={user.nom} size={80} />
            </div>
          )}
          {/* Badge niveau */}
          <span
            className="absolute -bottom-1 -right-1 flex items-center justify-center w-7 h-7 rounded-full text-sm leading-none"
            style={{
              background: 'var(--bg-elevated)',
              border: '2px solid var(--bg-surface)',
            }}
          >
            {NIVEAUX[niveau].emoji}
          </span>
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">
            {user.nom}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5 tabular-nums">
            {maskPhone(user.telephone)}
          </p>
          {user.quartier && (
            <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
              <span aria-hidden="true">📍</span>
              <span>{user.quartier}</span>
            </p>
          )}
        </div>

        {/* Bouton modifier */}
        <button
          onClick={handleOpenEdit}
          aria-label="Modifier le profil"
          className={cn(
            'shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl',
            'bg-[var(--bg-elevated)] border border-[var(--border)]',
            'text-sm font-medium text-[var(--text-primary)]',
            'hover:border-[var(--border-strong)] transition-colors active:scale-95',
          )}
        >
          <Pencil className="h-4 w-4" />
          <span className="hidden sm:inline">Modifier</span>
        </button>
      </div>

      {/* Modal édition profil */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Modifier le profil"
      >
        <div className="space-y-4">
          {/* Champ nom */}
          <div>
            <label
              htmlFor="edit-nom"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Nom complet
            </label>
            <input
              id="edit-nom"
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Votre nom"
              className={cn(
                'w-full px-3 py-2.5 rounded-xl border bg-[var(--bg-elevated)]',
                'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50',
                'border-[var(--border)] transition-colors',
              )}
            />
          </div>

          {/* Champ quartier */}
          <div>
            <label
              htmlFor="edit-quartier"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Quartier
            </label>
            <select
              id="edit-quartier"
              value={quartier}
              onChange={(e) => setQuartier(e.target.value)}
              className={cn(
                'w-full px-3 py-2.5 rounded-xl border bg-[var(--bg-elevated)]',
                'text-[var(--text-primary)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50',
                'border-[var(--border)] transition-colors',
              )}
            >
              <option value="">Choisir un quartier</option>
              {QUARTIERS_MAROUA.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <ModalFooter>
          <button
            onClick={() => setEditOpen(false)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => { void handleSave() }}
            disabled={saving}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all',
              'bg-[var(--brand)] hover:bg-[var(--brand-dark)] active:scale-95',
              saving && 'opacity-60 cursor-not-allowed',
            )}
          >
            {saving ? 'Enregistrement…' : 'Sauvegarder'}
          </button>
        </ModalFooter>
      </Modal>
    </>
  )
}

// ─── FideliteCard ─────────────────────────────────────────────────────────────

function FideliteCard() {
  const { user } = useAuth()
  if (!user) return null

  const points = user.points_fidelite
  const niveau = getNiveauUI(points)
  const config = NIVEAUX[niveau]
  const { pct, restant, prochainSeuil } = getProgressInfo(points, niveau)
  const indexNiveau = NIVEAUX_LIST.indexOf(niveau)
  const prochainNiveau = NIVEAUX_LIST[indexNiveau + 1]

  return (
    <div className="px-4">
      {/* Card premium gradient orange/noir */}
      <div
        className="relative rounded-2xl overflow-hidden p-5 shadow-[var(--shadow-lg)]"
        style={{
          background:
            'linear-gradient(135deg, #0A0A0A 0%, #1c0900 45%, #FF6B00 100%)',
        }}
      >
        {/* Cercles décoratifs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #FF6B00 0%, transparent 70%)',
            transform: 'translate(35%, -35%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 w-36 h-36 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #FF6B00 0%, transparent 70%)',
            transform: 'translate(-35%, 35%)',
          }}
        />

        {/* Ligne titre + points + badge niveau */}
        <div className="flex items-start justify-between mb-4 relative">
          <div>
            <p className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.15em]">
              Daada Points
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-black text-white tabular-nums leading-none">
                {points.toLocaleString('fr-FR')}
              </span>
              <span className="text-white/50 text-sm font-medium">pts</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-4xl leading-none">{config.emoji}</span>
            <p className="text-xs font-bold mt-1" style={{ color: config.couleur }}>
              {config.label}
            </p>
          </div>
        </div>

        {/* Avantage actuel */}
        <div className="mb-4 px-3 py-2.5 rounded-xl bg-white/10 relative">
          <p className="text-[10px] text-white/50 uppercase tracking-wide">
            Avantage actuel
          </p>
          <p className="text-sm font-semibold text-white mt-0.5">
            {config.avantage}
          </p>
        </div>

        {/* Barre de progression */}
        <div className="relative">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-white/50">Progression</span>
            {prochainSeuil && prochainNiveau ? (
              <span className="text-xs text-white/50">
                encore{' '}
                <span className="font-semibold text-white/80">
                  {restant.toLocaleString('fr-FR')} pts
                </span>{' '}
                pour{' '}
                <span
                  className="font-semibold"
                  style={{ color: NIVEAUX[prochainNiveau].couleur }}
                >
                  {NIVEAUX[prochainNiveau].label}
                </span>
              </span>
            ) : (
              <span
                className="text-xs font-bold"
                style={{ color: config.couleur }}
              >
                Niveau maximum !
              </span>
            )}
          </div>
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${config.couleur}88, ${config.couleur})`,
              }}
            />
          </div>
        </div>

        {/* Étapes niveaux */}
        <div className="flex items-end justify-between mt-5 pt-4 border-t border-white/10 relative">
          {NIVEAUX_LIST.map((n) => {
            const cfg = NIVEAUX[n]
            const idx = NIVEAUX_LIST.indexOf(n)
            const isActive = n === niveau
            const isPast = idx < indexNiveau
            return (
              <div key={n} className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    'transition-all leading-none',
                    isActive &&
                      'text-2xl drop-shadow-[0_0_10px_rgba(255,107,0,0.9)]',
                    !isActive && 'text-base',
                    !isActive && !isPast && 'opacity-25',
                  )}
                >
                  {cfg.emoji}
                </span>
                <span
                  className="text-[10px] font-semibold"
                  style={{
                    color: isActive
                      ? cfg.couleur
                      : isPast
                        ? cfg.couleur + '88'
                        : '#ffffff33',
                  }}
                >
                  {cfg.label}
                </span>
                <span className="text-[9px] text-white/30">
                  {cfg.seuil >= 1000
                    ? `${cfg.seuil / 1000}k`
                    : cfg.seuil === 0
                      ? '0'
                      : String(cfg.seuil)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Règle de gain */}
      <p className="text-xs text-[var(--text-muted)] text-center mt-2">
        1 point gagné pour chaque 100 FCFA dépensés
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <header className="sticky top-0 z-40 bg-[var(--bg-base)]/80 backdrop-blur-md border-b border-[var(--border)] px-4 py-3">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          Mon profil
        </h1>
      </header>

      <div className="pb-24 space-y-5 pt-2">
        {/* 1 — Header profil */}
        <ProfileHeader />

        {/* 2 — Carte fidélité */}
        <FideliteCard />

        {/* PARTIE 2 — Historique commandes, adresses, paramètres */}
      </div>
    </div>
  )
}
