'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { logAudit } from '@/lib/db/audit'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { User, Clock, MapPin } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type StatutCommande =
  | 'pending' | 'confirmed' | 'preparing'
  | 'ready' | 'picked_up' | 'delivered' | 'cancelled'

type Article = { id: string; nom: string; quantite: number; prix_unitaire: number }

type Commande = {
  id: string
  statut: StatutCommande
  total: number
  adresse_livraison: string
  created_at: string
  livreur_id: string | null
  client: { nom: string; telephone: string } | null
  articles: Article[]
}

type Livreur = { id: string; nom: string; telephone: string; disponible: boolean }

// ─── Colonnes Kanban ──────────────────────────────────────────────────────────

type KanbanColId = 'new' | 'preparing' | 'delivery' | 'done'

type KanbanCol = {
  id:       KanbanColId
  label:    string
  emoji:    string
  statuts:  StatutCommande[]
  newStatut: StatutCommande
  color:    string
}

const COLUMNS: KanbanCol[] = [
  { id: 'new',      label: 'Nouvelles',   emoji: '🔴', statuts: ['pending', 'confirmed'],          newStatut: 'confirmed',  color: '#EF4444' },
  { id: 'preparing',label: 'Préparation', emoji: '🟡', statuts: ['preparing', 'ready'],             newStatut: 'preparing',  color: '#F59E0B' },
  { id: 'delivery', label: 'Livraison',   emoji: '🔵', statuts: ['picked_up'],                      newStatut: 'picked_up',  color: '#3B82F6' },
  { id: 'done',     label: 'Livrées',     emoji: '✅', statuts: ['delivered'],                      newStatut: 'delivered',  color: '#10B981' },
]

// ─── Audio notification ────────────────────────────────────────────────────────

function playNewOrderSound() {
  try {
    const ctx = new AudioContext()
    const seq = [880, 1108, 1320]
    seq.forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.2)
      osc.start(ctx.currentTime + i * 0.12)
      osc.stop(ctx.currentTime + i * 0.12 + 0.2)
    })
  } catch {
    // AudioContext non disponible
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-CM', { hour: '2-digit', minute: '2-digit' })
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

function OrderCard({
  commande,
  livreurs,
  onAssign,
  overlay = false,
}: {
  commande: Commande
  livreurs: Livreur[]
  onAssign: (commandeId: string, livreurId: string) => void
  overlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id:   commande.id,
    data: { commande },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 cursor-grab active:cursor-grabbing',
        'transition-all duration-150 touch-none',
        isDragging && !overlay && 'opacity-40 scale-95',
        overlay && 'shadow-xl rotate-1 opacity-95',
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-xs font-bold text-[var(--text-primary)]">
            #{commande.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
            <Clock className="h-2.5 w-2.5" />
            {formatTime(commande.created_at)}
          </p>
        </div>
        <p className="text-sm font-black text-[var(--brand)]">
          {formatPrice(commande.total)}
        </p>
      </div>

      {/* Client */}
      {commande.client && (
        <div className="flex items-center gap-1.5 mb-2">
          <User className="h-3 w-3 text-[var(--text-muted)]" />
          <p className="text-xs text-[var(--text-secondary)] truncate">{commande.client.nom}</p>
        </div>
      )}

      {/* Articles */}
      <div className="mb-2">
        <p className="text-[10px] text-[var(--text-muted)] truncate">
          {commande.articles.map((a) => `${a.nom} ×${a.quantite}`).join(', ')}
        </p>
      </div>

      {/* Adresse */}
      <div className="flex items-start gap-1 mb-2">
        <MapPin className="h-3 w-3 text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">{commande.adresse_livraison}</p>
      </div>

      {/* Assigner livreur */}
      {!overlay && livreurs.length > 0 && (
        <select
          className="w-full mt-1 px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[10px] text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/50"
          value={commande.livreur_id ?? ''}
          onChange={(e) => {
            if (e.target.value) onAssign(commande.id, e.target.value)
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <option value="">Assigner un livreur…</option>
          {livreurs.map((l) => (
            <option key={l.id} value={l.id} disabled={!l.disponible}>
              {l.nom}{!l.disponible ? ' (indisponible)' : ''}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

function KanbanColumn({
  col, commandes, livreurs, onAssign,
}: {
  col: KanbanCol
  commandes: Commande[]
  livreurs: Livreur[]
  onAssign: (commandeId: string, livreurId: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <div className="flex flex-col min-w-[250px] flex-1">
      {/* En-tête colonne */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-t-2xl border border-b-0 border-[var(--border)]"
        style={{ background: `${col.color}15` }}
      >
        <span className="text-sm">{col.emoji}</span>
        <p className="text-sm font-bold text-[var(--text-primary)]">{col.label}</p>
        <span
          className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: `${col.color}25`, color: col.color }}
        >
          {commandes.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[200px] p-2 rounded-b-2xl border border-[var(--border)] space-y-2',
          'transition-colors duration-150',
          isOver
            ? 'bg-[var(--brand)]/5 border-[var(--brand)]/50'
            : 'bg-[var(--bg-elevated)]',
        )}
      >
        {commandes.map((c) => (
          <OrderCard key={c.id} commande={c} livreurs={livreurs} onAssign={onAssign} />
        ))}
        {commandes.length === 0 && (
          <div className="flex items-center justify-center h-20">
            <p className="text-xs text-[var(--text-muted)]">Aucune commande</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const { user }    = useAuth()
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [livreurs,  setLivreurs]  = useState<Livreur[]>([])
  const [loading,   setLoading]   = useState(true)
  const [activeId,  setActiveId]  = useState<string | null>(null)
  const prevCountRef = useRef(0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchCommandes = useCallback(async () => {
    const { data } = await supabase
      .from('commandes')
      .select(`
        id, statut, total, adresse_livraison, created_at, livreur_id,
        users!commandes_client_id_fkey ( nom, telephone ),
        commande_articles ( id, nom, quantite, prix_unitaire )
      `)
      .not('statut', 'in', '("cancelled","delivered")')
      .order('created_at', { ascending: false })
      .limit(100)

    const rows = (data ?? []) as Array<Record<string, unknown>>
    const mapped: Commande[] = rows.map((r) => {
      const clientRow = r['users'] as { nom: string; telephone: string } | null
      return {
        id:               r['id'] as string,
        statut:           r['statut'] as StatutCommande,
        total:            r['total'] as number,
        adresse_livraison: r['adresse_livraison'] as string,
        created_at:       r['created_at'] as string,
        livreur_id:       r['livreur_id'] as string | null,
        client:           clientRow,
        articles:         (r['commande_articles'] as Article[]) ?? [],
      }
    })

    // Notification sonore nouvelles commandes
    const newCount = mapped.filter((c) => c.statut === 'pending').length
    if (prevCountRef.current > 0 && newCount > prevCountRef.current) {
      playNewOrderSound()
    }
    prevCountRef.current = newCount

    setCommandes(mapped)
    setLoading(false)
  }, [])

  const fetchLivreurs = useCallback(async () => {
    const { data } = await supabase
      .from('users')
      .select('id, nom, telephone')
      .eq('role', 'delivery_agent')

    const ids = (data ?? []).map((l: { id: string }) => l.id)

    if (ids.length === 0) { setLivreurs([]); return }

    const { data: positions } = await supabase
      .from('positions_livreurs')
      .select('livreur_id, disponible')
      .in('livreur_id', ids)

    const posMap = new Map(
      ((positions ?? []) as Array<{ livreur_id: string; disponible: boolean }>)
        .map((p) => [p.livreur_id, p.disponible])
    )

    setLivreurs(
      ((data ?? []) as Array<{ id: string; nom: string; telephone: string }>).map((l) => ({
        ...l,
        disponible: posMap.get(l.id) ?? false,
      }))
    )
  }, [])

  useEffect(() => {
    void fetchCommandes()
    void fetchLivreurs()
  }, [fetchCommandes, fetchLivreurs])

  // ── Realtime ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase
      .channel('admin-orders-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commandes' }, () => {
        void fetchCommandes()
      })
      .subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [fetchCommandes])

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string)

  const handleDragEnd = useCallback(async (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over || !user?.id) return

    const colId   = over.id as KanbanColId
    const col     = COLUMNS.find((c) => c.id === colId)
    if (!col) return

    const cmdId   = active.id as string
    const cmd     = commandes.find((c) => c.id === cmdId)
    if (!cmd || col.statuts.includes(cmd.statut)) return

    const oldStatut = cmd.statut
    const newStatut = col.newStatut

    // Optimistic update
    setCommandes((prev) =>
      prev.map((c) => c.id === cmdId ? { ...c, statut: newStatut } : c)
    )

    const { error } = await supabase
      .from('commandes')
      .update({ statut: newStatut, updated_at: new Date().toISOString() })
      .eq('id', cmdId)

    if (error) {
      // Rollback
      setCommandes((prev) =>
        prev.map((c) => c.id === cmdId ? { ...c, statut: oldStatut } : c)
      )
    } else {
      await logAudit({
        userId:    user.id,
        action:    `update_statut_commande:${oldStatut}→${newStatut}`,
        tableName: 'commandes',
        recordId:  cmdId,
        oldData:   { statut: oldStatut },
        newData:   { statut: newStatut },
      })
    }
  }, [commandes, user?.id])

  // ── Assigner livreur ───────────────────────────────────────────────────────

  const handleAssign = useCallback(async (commandeId: string, livreurId: string) => {
    if (!user?.id) return
    const { error } = await supabase
      .from('commandes')
      .update({ livreur_id: livreurId, updated_at: new Date().toISOString() })
      .eq('id', commandeId)

    if (!error) {
      setCommandes((prev) =>
        prev.map((c) => c.id === commandeId ? { ...c, livreur_id: livreurId } : c)
      )
      await logAudit({
        userId:    user.id,
        action:    'assign_livreur',
        tableName: 'commandes',
        recordId:  commandeId,
        newData:   { livreur_id: livreurId },
      })
    }
  }, [user?.id])

  // ── Render ─────────────────────────────────────────────────────────────────

  const activeCommande = commandes.find((c) => c.id === activeId) ?? null

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Commandes en cours</h1>
        <p className="text-sm text-[var(--text-muted)]">Glissez les cartes pour changer le statut</p>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className="min-w-[250px] flex-1 h-80 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]"
              style={{ animation: 'pulse 1.5s ease infinite' }}
            />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={(e) => { void handleDragEnd(e) }}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 items-start">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                col={col}
                commandes={commandes.filter((c) => col.statuts.includes(c.statut))}
                livreurs={livreurs}
                onAssign={handleAssign}
              />
            ))}
          </div>

          <DragOverlay>
            {activeCommande && (
              <OrderCard
                commande={activeCommande}
                livreurs={livreurs}
                onAssign={handleAssign}
                overlay
              />
            )}
          </DragOverlay>
        </DndContext>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}
