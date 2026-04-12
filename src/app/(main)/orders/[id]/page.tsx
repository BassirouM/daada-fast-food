'use client'

// ─── React & Next.js ──────────────────────────────────────────────────────────
import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'

// ─── Stores & hooks ───────────────────────────────────────────────────────────
import { useAuth } from '@/hooks/useAuth'
import { useCartStore } from '@/stores/cart.store'
import type { CartItem } from '@/stores/cart.store'

// ─── Supabase ─────────────────────────────────────────────────────────────────
import { supabase } from '@/lib/supabase'

// ─── Firebase Firestore (chat) ────────────────────────────────────────────────
import { getFirebaseFirestore } from '@/lib/firebase'
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'

// ─── Utils ────────────────────────────────────────────────────────────────────
import { formatPrice } from '@/lib/utils'

// ─── TrackingMap — Mapbox, must be client-only ────────────────────────────────
const TrackingMap = dynamic(
  () => import('@/components/features/orders/TrackingMap'),
  { ssr: false, loading: () => <MapSkeleton /> }
)

// ─── Local types ──────────────────────────────────────────────────────────────

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled'

type ArticleRow = {
  id: string
  menu_id: string
  nom: string
  quantite: number
  prix_unitaire: number
  menus?: { image_url: string | null } | null
}

type PaiementRow = {
  methode: string
  transaction_id: string | null
  montant: number
  statut: string
}

type CommandeDetail = {
  id: string
  statut: OrderStatus
  adresse_livraison: string
  frais_livraison: number
  sous_total: number
  total: number
  note_cuisinier: string | null
  temps_estime: number | null
  livreur_id: string | null
  created_at: string
  updated_at: string
  commande_articles: ArticleRow[]
  paiements: PaiementRow[]
}

type LivreurPosition = {
  livreur_id: string
  latitude: number
  longitude: number
  updated_at: string
}

type ChatMessage = {
  id: string
  senderId: string
  senderType: 'client' | 'livreur'
  texte: string
  createdAt: Timestamp | null
}

type RatingData = {
  note: number
  commentaire: string
  submitted: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WHATSAPP_SUPPORT = '237677000000'

const METHODE_LABEL: Record<string, string> = {
  orange_money: '🟠 Orange Money',
  mtn_momo:     '🟡 MTN MoMo',
  cinetpay:     '💳 CinetPay',
  cash:         '💵 Cash',
}

/** Ordered timeline steps with metadata */
type TimelineStep = {
  key: OrderStatus[]      // statuts qui "activent" cette étape
  doneWhen: OrderStatus[] // statuts où cette étape est terminée
  icon: string
  label: string
  sublabel: string
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    key:       ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered'],
    doneWhen:  ['confirmed', 'preparing', 'ready', 'picked_up', 'delivered'],
    icon:      '✅',
    label:     'Commande reçue',
    sublabel:  'Votre commande a été enregistrée',
  },
  {
    key:       ['confirmed', 'preparing', 'ready', 'picked_up', 'delivered'],
    doneWhen:  ['ready', 'picked_up', 'delivered'],
    icon:      '🔄',
    label:     'En préparation',
    sublabel:  'Le cuisinier prépare votre repas',
  },
  {
    key:       ['ready', 'picked_up', 'delivered'],
    doneWhen:  ['delivered'],
    icon:      '🛵',
    label:     'Livreur en route',
    sublabel:  'Votre commande est en chemin',
  },
  {
    key:       ['delivered'],
    doneWhen:  ['delivered'],
    icon:      '🎉',
    label:     'Livrée !',
    sublabel:  'Bon appétit !',
  },
]

// ─── Small helpers ────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-CM', { hour: '2-digit', minute: '2-digit' })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-CM', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function statusColor(s: OrderStatus): string {
  const m: Record<OrderStatus, string> = {
    pending: '#F59E0B', confirmed: '#3B82F6', preparing: '#F97316',
    ready: '#8B5CF6', picked_up: '#06B6D4', delivered: '#10B981', cancelled: '#EF4444',
  }
  return m[s] ?? '#888'
}

function statusLabel(s: OrderStatus): string {
  const m: Record<OrderStatus, string> = {
    pending: 'En attente', confirmed: 'Confirmée', preparing: 'En préparation',
    ready: 'Prête', picked_up: 'En livraison', delivered: 'Livrée', cancelled: 'Annulée',
  }
  return m[s] ?? s
}

// ─── Skeleton while map loads ─────────────────────────────────────────────────

function MapSkeleton() {
  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: 16,
      background: 'var(--bg-elevated)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '0.5rem',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid rgba(249,115,22,.2)', borderTopColor: '#F97316',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Chargement carte…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// =============================================================================
// PARTIE 2 — Sous-composants UI
// =============================================================================

// ─── Timeline verticale ───────────────────────────────────────────────────────

function OrderTimeline({ statut, createdAt, tempsEstime }: {
  statut: OrderStatus
  createdAt: string
  tempsEstime: number | null
}) {
  const isCancelled = statut === 'cancelled'

  if (isCancelled) {
    return (
      <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: '1rem', border: '1px solid var(--border)', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.75rem' }}>❌</span>
          <div>
            <p style={{ fontWeight: 700, color: '#EF4444', fontSize: '0.9375rem' }}>Commande annulée</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDateTime(createdAt)}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: '1rem', border: '1px solid var(--border)', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {TIMELINE_STEPS.map((step, idx) => {
          const isActive = step.key.includes(statut) && !step.doneWhen.includes(statut)
          const isDone   = step.doneWhen.includes(statut)
          const isLast   = idx === TIMELINE_STEPS.length - 1

          return (
            <div key={idx} style={{ display: 'flex', gap: '0.75rem' }}>
              {/* Left column: dot + line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                {/* Dot */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: isDone
                    ? 'linear-gradient(135deg,#10B981,#059669)'
                    : isActive
                      ? 'linear-gradient(135deg,#F97316,#EA580C)'
                      : 'var(--bg-elevated)',
                  border: isActive ? 'none' : isDone ? 'none' : '2px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.875rem',
                  flexShrink: 0,
                  boxShadow: isActive ? '0 0 0 4px rgba(249,115,22,.2)' : 'none',
                  animation: isActive ? 'stepPulse 1.8s ease infinite' : 'none',
                  transition: 'all 0.4s ease',
                }}>
                  {isDone ? '✓' : step.icon}
                </div>
                {/* Vertical connector */}
                {!isLast && (
                  <div style={{
                    width: 3, flex: 1, minHeight: 28,
                    background: 'var(--bg-elevated)',
                    borderRadius: 2,
                    margin: '2px 0',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0,
                      height: isDone ? '100%' : '0%',
                      background: 'linear-gradient(to bottom,#10B981,#059669)',
                      borderRadius: 2,
                      transition: 'height 0.8s ease',
                    }} />
                  </div>
                )}
              </div>

              {/* Right column: text */}
              <div style={{ paddingBottom: isLast ? 0 : '1rem', paddingTop: '0.25rem' }}>
                <p style={{
                  fontWeight: isActive || isDone ? 700 : 500,
                  fontSize: '0.9375rem',
                  color: isActive ? '#F97316' : isDone ? 'var(--text-primary)' : 'var(--text-muted)',
                  transition: 'color 0.4s',
                }}>
                  {step.label}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                  {idx === 0
                    ? formatTime(createdAt)
                    : idx === 2 && tempsEstime
                      ? `ETA ~${tempsEstime} min`
                      : step.sublabel}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes stepPulse {
          0%,100% { box-shadow: 0 0 0 4px rgba(249,115,22,.2); }
          50%      { box-shadow: 0 0 0 8px rgba(249,115,22,.05); }
        }
      `}</style>
    </div>
  )
}

// ─── Chat bottom sheet ────────────────────────────────────────────────────────

const QUICK_TEMPLATES = [
  'Je suis devant la maison',
  'Appelez-moi s\'il vous plaît',
  'Je serai là dans 5 minutes',
  'Où êtes-vous exactement ?',
]

function ChatSheet({ commandeId, userId, onClose }: {
  commandeId: string
  userId: string
  onClose: () => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [texte, setTexte]       = useState('')
  const [sending, setSending]   = useState(false)
  const [firestoreOk, setFirestoreOk] = useState(true)
  const bottomRef               = useRef<HTMLDivElement>(null)

  // Subscribe to Firestore messages
  useEffect(() => {
    let db: ReturnType<typeof getFirebaseFirestore> | null = null
    try {
      db = getFirebaseFirestore()
    } catch {
      setFirestoreOk(false)
      return
    }

    const q = query(
      collection(db, 'chats', commandeId, 'messages'),
      orderBy('createdAt', 'asc')
    )

    const unsub = onSnapshot(q, (snap) => {
      const msgs: ChatMessage[] = snap.docs.map((d) => ({
        id:         d.id,
        senderId:   d.data().senderId as string,
        senderType: d.data().senderType as 'client' | 'livreur',
        texte:      d.data().texte as string,
        createdAt:  d.data().createdAt as Timestamp | null,
      }))
      setMessages(msgs)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }, () => setFirestoreOk(false))

    return () => unsub()
  }, [commandeId])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || sending) return
    setSending(true)
    setTexte('')
    try {
      const db = getFirebaseFirestore()
      await addDoc(collection(db, 'chats', commandeId, 'messages'), {
        senderId:   userId,
        senderType: 'client',
        texte:      text.trim(),
        createdAt:  serverTimestamp(),
      })
    } catch {
      setTexte(text)
    } finally {
      setSending(false)
    }
  }, [commandeId, userId, sending])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 40, backdropFilter: 'blur(2px)' }}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        maxHeight: '75vh', display: 'flex', flexDirection: 'column',
        background: 'var(--bg-surface)', borderRadius: '20px 20px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,.3)',
        animation: 'slideUp 0.3s ease',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem 0.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>💬 Chat livreur</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        </div>

        {!firestoreOk ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.875rem' }}>
            Chat non disponible — configurez Firebase
          </div>
        ) : (
          <>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {messages.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', padding: '1rem 0' }}>
                  Aucun message. Utilisez les templates ci-dessous.
                </p>
              )}
              {messages.map((m) => {
                const isMe = m.senderType === 'client'
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '75%', padding: '0.5rem 0.75rem', borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: isMe ? 'linear-gradient(135deg,#F97316,#EA580C)' : 'var(--bg-elevated)',
                      color: isMe ? 'white' : 'var(--text-primary)',
                      fontSize: '0.875rem',
                    }}>
                      {m.texte}
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Quick templates */}
            <div style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.375rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {QUICK_TEMPLATES.map((t) => (
                <button
                  key={t}
                  onClick={() => void sendMessage(t)}
                  style={{
                    flexShrink: 0, padding: '0.375rem 0.75rem', borderRadius: 20,
                    border: '1.5px solid var(--border)', background: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1rem calc(0.75rem + env(safe-area-inset-bottom))' }}>
              <input
                value={texte}
                onChange={(e) => setTexte(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(texte) } }}
                placeholder="Écrire un message…"
                style={{
                  flex: 1, padding: '0.625rem 1rem', borderRadius: 22,
                  border: '1.5px solid var(--border)', background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)', fontSize: '0.9375rem', outline: 'none',
                }}
              />
              <button
                onClick={() => void sendMessage(texte)}
                disabled={!texte.trim() || sending}
                style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: texte.trim() ? 'linear-gradient(135deg,#F97316,#EA580C)' : 'var(--bg-elevated)',
                  border: 'none', cursor: texte.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                ➤
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </>
  )
}

// ─── Star rating ──────────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem',
            fontSize: '2rem', transition: 'transform 0.15s',
            transform: n <= value ? 'scale(1.15)' : 'scale(1)',
            filter: n <= value ? 'none' : 'grayscale(1) opacity(.4)',
          }}
        >
          ⭐
        </button>
      ))}
    </div>
  )
}

// =============================================================================
// PARTIE 3 — Page principale (default export)
// =============================================================================

export default function OrderTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const commandeId = params.id as string

  const { user: userDB, isLoading: authLoading } = useAuth()
  const { addItem } = useCartStore()

  // ── State ───────────────────────────────────────────────────────────────────
  const [commande,  setCommande]  = useState<CommandeDetail | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [livreurPos, setLivreurPos] = useState<[number, number] | null>(null)
  const [eta,        setEta]       = useState<number | null>(null)
  const [showChat,   setShowChat]  = useState(false)
  const [rating,     setRating]    = useState<RatingData>({ note: 0, commentaire: '', submitted: false })
  const [reordering, setReordering] = useState(false)
  const [ratingLoading, setRatingLoading] = useState(false)

  // ── Fetch commande ──────────────────────────────────────────────────────────
  const fetchCommande = useCallback(async () => {
    if (!commandeId) return
    const { data } = await supabase
      .from('commandes')
      .select(`
        id, statut, adresse_livraison, frais_livraison, sous_total, total,
        note_cuisinier, temps_estime, livreur_id, created_at, updated_at,
        commande_articles ( id, menu_id, nom, quantite, prix_unitaire,
          menus ( image_url )
        ),
        paiements ( methode, transaction_id, montant, statut )
      `)
      .eq('id', commandeId)
      .single()

    if (data) setCommande(data as unknown as CommandeDetail)
    setLoading(false)
  }, [commandeId])

  useEffect(() => {
    if (!authLoading) {
      if (!userDB?.id) { router.replace('/login'); return }
      void fetchCommande()
    }
  }, [authLoading, userDB?.id, fetchCommande, router])

  // ── Supabase Realtime — commande status ─────────────────────────────────────
  useEffect(() => {
    if (!commandeId) return
    const channel = supabase
      .channel(`commande:${commandeId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'commandes', filter: `id=eq.${commandeId}` },
        (payload) => {
          setCommande((prev) => prev
            ? { ...prev, ...(payload.new as Partial<CommandeDetail>) }
            : prev
          )
        }
      )
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [commandeId])

  // ── Supabase Realtime — livreur position (toutes les ~10 s) ─────────────────
  useEffect(() => {
    const livreurId = commande?.livreur_id
    if (!livreurId) return

    const fetchPos = async () => {
      const { data } = await supabase
        .from('positions_livreurs')
        .select('latitude, longitude')
        .eq('livreur_id', livreurId)
        .single()
      if (data) {
        const row = data as Pick<LivreurPosition, 'latitude' | 'longitude'>
        setLivreurPos([row.longitude, row.latitude])
        if (commande?.temps_estime) setEta(commande.temps_estime)
      }
    }

    void fetchPos()
    const interval = setInterval(() => void fetchPos(), 10_000)

    const channel = supabase
      .channel(`livreur:${livreurId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'positions_livreurs', filter: `livreur_id=eq.${livreurId}` },
        (payload) => {
          const row = payload.new as LivreurPosition
          setLivreurPos([row.longitude, row.latitude])
        }
      )
      .subscribe()

    return () => { clearInterval(interval); void supabase.removeChannel(channel) }
  }, [commande?.livreur_id, commande?.temps_estime])

  // ── Récommander ─────────────────────────────────────────────────────────────
  const handleReorder = useCallback(async () => {
    if (!commande) return
    setReordering(true)
    try {
      const menuIds = commande.commande_articles.map((a) => a.menu_id)
      const { data: menus } = await supabase
        .from('menus')
        .select('id, nom, prix, image_url, categorie, disponible, temps_preparation, description, tags, note_moyenne, nb_commandes')
        .in('id', menuIds)

      const menuMap = new Map(
        ((menus ?? []) as Array<Record<string, unknown>>).map((m) => [m.id as string, m])
      )

      for (const article of commande.commande_articles) {
        const m = menuMap.get(article.menu_id)
        if (!m) continue

        const mImgUrl = m.image_url as string | null | undefined
        const cartItem: CartItem = {
          id:              `ro-${article.menu_id}-${Date.now()}`,
          menuItem: {
            id:                      m.id as string,
            category_id:             m.categorie as string,
            name:                    m.nom as string,
            slug:                    (m.id as string).slice(0, 8),
            description:             (m.description as string) ?? '',
            price:                   m.prix as number,
            ...(mImgUrl ? { image_url: mImgUrl } : {}),
            option_groups:           [],
            is_available:            m.disponible as boolean,
            is_featured:             false,
            preparation_time_minutes: m.temps_preparation as number,
            tags:                    (m.tags as string[]) ?? [],
            created_at:              '',
          },
          quantity:        article.quantite,
          selectedOptions: [],
          unitPrice:       article.prix_unitaire,
          totalPrice:      article.prix_unitaire * article.quantite,
        }
        addItem(cartItem)
      }
      router.push('/checkout')
    } finally {
      setReordering(false)
    }
  }, [commande, addItem, router])

  // ── Submit rating ────────────────────────────────────────────────────────────
  const handleSubmitRating = useCallback(async () => {
    if (rating.note === 0 || rating.submitted || ratingLoading) return
    setRatingLoading(true)
    try {
      await fetch(`/api/orders/${commandeId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note: rating.note, commentaire: rating.commentaire }),
      })
      setRating((r) => ({ ...r, submitted: true }))
    } finally {
      setRatingLoading(false)
    }
  }, [commandeId, rating, ratingLoading])

  // ── jsPDF invoice ────────────────────────────────────────────────────────────
  const handleDownloadInvoice = useCallback(async () => {
    if (!commande) return
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(249, 115, 22)
    doc.text('DAADA FAST FOOD', 105, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.text('Maroua, Cameroun', 105, 27, { align: 'center' })

    doc.setFontSize(14)
    doc.setTextColor(30, 30, 30)
    doc.setFont('helvetica', 'bold')
    doc.text(`FACTURE #${commande.id.slice(0, 8).toUpperCase()}`, 20, 45)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(`Date : ${formatDateTime(commande.created_at)}`, 20, 52)
    doc.text(`Livraison : ${commande.adresse_livraison}`, 20, 57)

    // Table header
    let y = 70
    doc.setFillColor(249, 115, 22)
    doc.rect(20, y - 5, 170, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('Article', 22, y)
    doc.text('Qté', 120, y, { align: 'center' })
    doc.text('P.U.', 150, y, { align: 'right' })
    doc.text('Total', 188, y, { align: 'right' })

    y += 8
    doc.setTextColor(30, 30, 30)
    doc.setFont('helvetica', 'normal')

    for (const art of commande.commande_articles) {
      doc.text(art.nom.slice(0, 40), 22, y)
      doc.text(String(art.quantite), 120, y, { align: 'center' })
      doc.text(`${art.prix_unitaire} FCFA`, 150, y, { align: 'right' })
      doc.text(`${art.prix_unitaire * art.quantite} FCFA`, 188, y, { align: 'right' })
      y += 7
      if (y > 260) { doc.addPage(); y = 20 }
    }

    // Totals
    doc.setDrawColor(220, 220, 220)
    doc.line(20, y + 2, 190, y + 2)
    y += 8
    doc.text('Sous-total', 120, y)
    doc.text(`${commande.sous_total} FCFA`, 188, y, { align: 'right' })
    y += 6
    doc.text('Frais de livraison', 120, y)
    doc.text(`${commande.frais_livraison} FCFA`, 188, y, { align: 'right' })
    y += 6
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(249, 115, 22)
    doc.text('TOTAL', 120, y)
    doc.text(`${commande.total} FCFA`, 188, y, { align: 'right' })

    // Payment
    const pmt = commande.paiements?.[0]
    if (pmt) {
      y += 10
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.setFontSize(8)
      doc.text(`Méthode : ${METHODE_LABEL[pmt.methode] ?? pmt.methode}`, 20, y)
      if (pmt.transaction_id) {
        y += 5
        doc.text(`Transaction : ${pmt.transaction_id}`, 20, y)
      }
    }

    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('Merci de votre confiance — Daada Fast Food, Maroua 🍔', 105, 285, { align: 'center' })

    doc.save(`facture-daada-${commande.id.slice(0, 8)}.pdf`)
  }, [commande])

  // ── WhatsApp share ───────────────────────────────────────────────────────────
  const handleWhatsApp = useCallback(() => {
    if (!commande) return
    const msg = encodeURIComponent(
      `Bonjour, j'ai une question sur ma commande #${commande.id.slice(0, 8).toUpperCase()} — Daada Fast Food Maroua`
    )
    window.open(`https://wa.me/${WHATSAPP_SUPPORT}?text=${msg}`, '_blank')
  }, [commande])

  // ── Render ───────────────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: 12,
    border: '1.5px solid var(--border)', background: 'var(--bg-elevated)',
    color: 'var(--text-primary)', fontSize: '0.9375rem', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', resize: 'none',
  }

  const sectionStyle: React.CSSProperties = {
    background: 'var(--bg-surface)', borderRadius: 16,
    padding: '1rem', marginBottom: '0.75rem', border: '1px solid var(--border)',
  }

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <div style={{ background: 'var(--bg-surface)', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ height: 24, width: 160, borderRadius: 8, background: 'var(--bg-elevated)', animation: 'pulse 1.5s ease infinite', margin: '0 auto' }} />
        </div>
        <div style={{ maxWidth: 480, margin: '1rem auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[120, 200, 140].map((h, i) => (
            <div key={i} style={{ height: h, borderRadius: 16, background: 'var(--bg-surface)', animation: 'pulse 1.5s ease infinite', border: '1px solid var(--border)' }} />
          ))}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      </div>
    )
  }

  if (!commande) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '3rem' }}>🔍</div>
        <p style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Commande introuvable</p>
        <button onClick={() => router.push('/orders')} style={{ padding: '0.75rem 1.5rem', borderRadius: 12, background: 'var(--brand)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          Voir mes commandes
        </button>
      </div>
    )
  }

  const statut       = commande.statut as OrderStatus
  const color        = statusColor(statut)
  const isDelivered  = statut === 'delivered'
  const isOnTheWay   = statut === 'picked_up' || statut === 'ready'
  const pmt          = commande.paiements?.[0]
  const shortId      = commande.id.slice(0, 8).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem' }}>
          <button
            onClick={() => router.push('/orders')}
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-primary)', padding: '0.25rem' }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Commande #{shortId}
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDateTime(commande.created_at)}</p>
          </div>
          <span style={{ padding: '0.3rem 0.75rem', borderRadius: 20, background: `${color}20`, color, fontSize: '0.8125rem', fontWeight: 700 }}>
            {statusLabel(statut)}
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '0.75rem 1rem 6rem' }}>

        {/* ── Timeline ── */}
        <OrderTimeline statut={statut} createdAt={commande.created_at} tempsEstime={commande.temps_estime} />

        {/* ── Mini-carte livreur (visible en livraison) ── */}
        {(isOnTheWay || isDelivered) && (
          <div style={{ ...sectionStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{ height: 220 }}>
              <Suspense fallback={<MapSkeleton />}>
                <TrackingMap
                  livreurPosition={livreurPos}
                  clientPosition={null}
                  eta={eta}
                />
              </Suspense>
            </div>
            {/* ETA bar */}
            <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Position livreur</p>
                <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {livreurPos ? '🟢 En direct' : '⏳ En attente…'}
                </p>
              </div>
              {eta !== null && (
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Arrivée estimée</p>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: '#F97316' }}>~{eta} min</p>
                </div>
              )}
              {/* Chat button */}
              <button
                onClick={() => setShowChat(true)}
                style={{ padding: '0.5rem 0.875rem', borderRadius: 10, border: '1.5px solid var(--brand)', background: 'rgba(249,115,22,.08)', color: 'var(--brand)', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer' }}
              >
                💬 Chat
              </button>
            </div>
          </div>
        )}

        {/* ── Articles ── */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            🛒 Articles commandés
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {commande.commande_articles.map((art) => (
              <div key={art.id} style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-elevated)', position: 'relative' }}>
                  {art.menus?.image_url
                    ? <Image src={art.menus.image_url} alt={art.nom} fill style={{ objectFit: 'cover' }} sizes="48px" />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem' }}>🍔</div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{art.nom}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>×{art.quantite} · {formatPrice(art.prix_unitaire)} / u</p>
                </div>
                <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', flexShrink: 0 }}>
                  {formatPrice(art.prix_unitaire * art.quantite)}
                </p>
              </div>
            ))}
          </div>

          {/* Note cuisinier */}
          {commande.note_cuisinier && (
            <div style={{ marginTop: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 10, padding: '0.625rem', borderLeft: '3px solid var(--brand)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>📝 Note cuisinier</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{commande.note_cuisinier}</p>
            </div>
          )}

          {/* Price breakdown */}
          <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Sous-total</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatPrice(commande.sous_total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Frais de livraison</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatPrice(commande.frais_livraison)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--brand)' }}>{formatPrice(commande.total)}</span>
            </div>
          </div>
        </div>

        {/* ── Adresse & paiement ── */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            📋 Informations
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '0.1rem' }}>📍</span>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Adresse livraison</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>{commande.adresse_livraison}</p>
              </div>
            </div>
            {pmt && (
              <>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '0.1rem' }}>💳</span>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Méthode de paiement</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>{METHODE_LABEL[pmt.methode] ?? pmt.methode}</p>
                  </div>
                </div>
                {pmt.transaction_id && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '0.1rem' }}>🔖</span>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>N° transaction</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'monospace' }}>{pmt.transaction_id}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Post-livraison ── */}
        {isDelivered && (
          <>
            {/* Rating */}
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', textAlign: 'center' }}>
                ⭐ Évaluer la commande
              </h2>
              {rating.submitted ? (
                <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🙏</div>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Merci pour votre avis !</p>
                </div>
              ) : (
                <>
                  <StarRating value={rating.note} onChange={(n) => setRating((r) => ({ ...r, note: n }))} />
                  {rating.note > 0 && (
                    <>
                      <textarea
                        value={rating.commentaire}
                        onChange={(e) => setRating((r) => ({ ...r, commentaire: e.target.value.slice(0, 300) }))}
                        placeholder="Commentaire optionnel (300 car. max)…"
                        rows={3}
                        style={{ ...inputStyle, marginTop: '0.75rem' } as React.CSSProperties}
                      />
                      <button
                        onClick={() => void handleSubmitRating()}
                        disabled={ratingLoading}
                        style={{ marginTop: '0.75rem', width: '100%', padding: '0.75rem', borderRadius: 12, background: ratingLoading ? 'var(--bg-elevated)' : 'linear-gradient(135deg,#F97316,#EA580C)', color: ratingLoading ? 'var(--text-muted)' : 'white', fontWeight: 700, border: 'none', cursor: ratingLoading ? 'not-allowed' : 'pointer', fontSize: '0.9375rem' }}
                      >
                        {ratingLoading ? 'Envoi…' : 'Envoyer mon avis'}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <button
                onClick={() => void handleReorder()}
                disabled={reordering}
                style={{ width: '100%', padding: '0.875rem', borderRadius: 14, background: reordering ? 'var(--bg-elevated)' : 'linear-gradient(135deg,#F97316,#EA580C)', color: reordering ? 'var(--text-muted)' : 'white', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: reordering ? 'not-allowed' : 'pointer', boxShadow: reordering ? 'none' : '0 4px 20px rgba(249,115,22,.3)' }}
              >
                {reordering ? 'Chargement…' : '🔄 Commander à nouveau'}
              </button>

              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <button
                  onClick={() => void handleDownloadInvoice()}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: 12, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  📄 Télécharger facture
                </button>
                <button
                  onClick={handleWhatsApp}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: 12, border: '1.5px solid #25D366', background: 'rgba(37,211,102,.06)', color: '#25D366', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  💬 WhatsApp
                </button>
              </div>
            </div>
          </>
        )}

        {/* Chat button (hors livraison) */}
        {!isOnTheWay && !isDelivered && statut !== 'cancelled' && (
          <button
            onClick={() => setShowChat(true)}
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', borderRadius: 12, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
          >
            💬 Contacter le livreur
          </button>
        )}
      </main>

      {/* ── Chat bottom sheet ── */}
      {showChat && userDB?.id && (
        <ChatSheet
          commandeId={commandeId}
          userId={userDB.id}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  )
}
