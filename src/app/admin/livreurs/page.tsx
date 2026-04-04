'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CheckCircle2, XCircle, Phone, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { logAudit } from '@/lib/db/audit'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type Livreur = {
  id:        string
  nom:       string
  telephone: string
  disponible: boolean
  lat:       number | null
  lng:       number | null
  updated_at: string | null
}

type Commande = {
  id:        string
  statut:    string
  total:     number
  adresse_livraison: string
  livreur_id: string | null
}

// ─── Map Mapbox ───────────────────────────────────────────────────────────────

function LiveMap({ livreurs }: { livreurs: Livreur[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<unknown>(null)

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token || !containerRef.current) return

    let mapInstance: {
      remove: () => void
      addSource: (id: string, src: unknown) => void
      getSource: (id: string) => unknown
      on: (evt: string, cb: () => void) => void
      flyTo: (opts: unknown) => void
    } | null = null

    const init = async () => {
      const mapboxgl = (await import('mapbox-gl')).default
      await import('mapbox-gl/dist/mapbox-gl.css')

      mapboxgl.accessToken = token

      const map = new mapboxgl.Map({
        container: containerRef.current!,
        style:     'mapbox://styles/mapbox/dark-v11',
        center:    [14.3165, 10.5916],
        zoom:      12,
      }) as typeof mapInstance

      mapRef.current = map
      mapInstance    = map

      for (const l of livreurs) {
        if (l.lat == null || l.lng == null) continue
        const el = document.createElement('div')
        el.className = 'livreur-marker'
        el.textContent = '🛵'
        el.style.cssText = `
          font-size: 24px; cursor: pointer; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
          transition: transform 0.2s;
        `
        new mapboxgl.Marker({ element: el })
          .setLngLat([l.lng, l.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div style="font-size:12px;padding:4px"><strong>${l.nom}</strong><br>${l.telephone}<br>${l.disponible ? '🟢 Disponible' : '🔴 Occupé'}</div>`
            )
          )
          .addTo(map as Parameters<typeof mapboxgl.Marker.prototype.addTo>[0])
      }
    }

    void init()

    return () => { mapInstance?.remove() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update markers positions (simplified — re-render ne crée pas de fuites)
  useEffect(() => {
    // Markers are static in this implementation
    // For production: update marker positions via Realtime
  }, [livreurs])

  const hasToken = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN)

  if (!hasToken) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 bg-[var(--bg-elevated)] rounded-2xl">
        <MapPin className="h-8 w-8 text-[var(--text-muted)]" />
        <p className="text-sm text-[var(--text-muted)] text-center px-4">
          Carte non disponible.<br />
          Définir <code className="text-xs bg-[var(--bg-overlay)] px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> dans .env.local
        </p>
      </div>
    )
  }

  return <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden" />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminLivreursPage() {
  const { user }     = useAuth()
  const [livreurs,   setLivreurs]   = useState<Livreur[]>([])
  const [commandes,  setCommandes]  = useState<Commande[]>([])
  const [loading,    setLoading]    = useState(true)
  const [assigning,  setAssigning]  = useState<string | null>(null)
  const [selLivreur, setSelLivreur] = useState<Record<string, string>>({})

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    const [{ data: usersData }, { data: posData }, { data: cmdsData }] = await Promise.all([
      supabase.from('users').select('id, nom, telephone').eq('role', 'delivery_agent'),
      supabase.from('positions_livreurs').select('livreur_id, latitude, longitude, disponible, updated_at'),
      supabase.from('commandes')
        .select('id, statut, total, adresse_livraison, livreur_id')
        .in('statut', ['confirmed', 'preparing', 'ready', 'picked_up'])
        .is('livreur_id', null),
    ])

    const posMap = new Map(
      ((posData ?? []) as Array<{
        livreur_id: string; latitude: number; longitude: number; disponible: boolean; updated_at: string
      }>).map((p) => [p.livreur_id, p])
    )

    setLivreurs(
      ((usersData ?? []) as Array<{ id: string; nom: string; telephone: string }>).map((u) => {
        const pos = posMap.get(u.id)
        return {
          ...u,
          disponible: pos?.disponible ?? false,
          lat:        pos?.latitude    ?? null,
          lng:        pos?.longitude   ?? null,
          updated_at: pos?.updated_at  ?? null,
        }
      })
    )

    setCommandes((cmdsData as Commande[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  // ── Realtime positions ──────────────────────────────────────────────────────

  useEffect(() => {
    const ch = supabase
      .channel('admin-positions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'positions_livreurs' }, () => {
        void fetchData()
      })
      .subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [fetchData])

  // ── Assigner commande ──────────────────────────────────────────────────────

  const handleAssign = useCallback(async (commandeId: string) => {
    const livreurId = selLivreur[commandeId]
    if (!livreurId || !user?.id) return

    setAssigning(commandeId)

    const { error } = await supabase
      .from('commandes')
      .update({ livreur_id: livreurId, statut: 'picked_up', updated_at: new Date().toISOString() })
      .eq('id', commandeId)

    if (!error) {
      await logAudit({
        userId:    user.id,
        action:    'assign_livreur_commande',
        tableName: 'commandes',
        recordId:  commandeId,
        newData:   { livreur_id: livreurId },
      })
      void fetchData()
    }

    setAssigning(null)
  }, [selLivreur, user?.id, fetchData])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const disponibles = livreurs.filter((l) => l.disponible)
  const occupes     = livreurs.filter((l) => !l.disponible)

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Livreurs</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {disponibles.length} disponible{disponibles.length !== 1 ? 's' : ''} · {occupes.length} occupé{occupes.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Liste livreurs */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Liste</h2>

          {loading ? (
            [1,2,3].map((i) => (
              <div key={i} className="h-20 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]"
                style={{ animation: 'pulse 1.5s ease infinite' }} />
            ))
          ) : livreurs.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-muted)] text-sm">
              Aucun livreur enregistré
            </div>
          ) : (
            livreurs.map((l) => (
              <div key={l.id}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-sm font-bold text-[var(--text-primary)]">
                    {l.nom.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5">
                    {l.disponible
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 bg-[var(--bg-surface)] rounded-full" />
                      : <XCircle      className="h-3.5 w-3.5 text-red-500  bg-[var(--bg-surface)] rounded-full" />
                    }
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{l.nom}</p>
                  <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                    <Phone className="h-2.5 w-2.5" />{l.telephone}
                  </p>
                  {l.lat && l.lng && (
                    <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                      <MapPin className="h-2.5 w-2.5" />
                      {l.lat.toFixed(4)}, {l.lng.toFixed(4)}
                    </p>
                  )}
                </div>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0',
                  l.disponible
                    ? 'bg-green-500/15 text-green-600'
                    : 'bg-red-500/15 text-red-500',
                )}>
                  {l.disponible ? 'Disponible' : 'Occupé'}
                </span>
              </div>
            ))
          )}

          {/* Assigner commandes sans livreur */}
          {commandes.length > 0 && (
            <div className="mt-4">
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">
                Commandes sans livreur ({commandes.length})
              </h2>
              <div className="space-y-2">
                {commandes.map((cmd) => (
                  <div key={cmd.id}
                    className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">
                          #{cmd.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] truncate max-w-[180px]">
                          {cmd.adresse_livraison}
                        </p>
                      </div>
                      <p className="text-xs font-bold text-[var(--brand)] flex-shrink-0">
                        {cmd.total.toLocaleString('fr-CM')} FCFA
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <select
                        className={cn(
                          'flex-1 px-2 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]',
                          'text-xs text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/50',
                        )}
                        value={selLivreur[cmd.id] ?? ''}
                        onChange={(e) =>
                          setSelLivreur((prev) => ({ ...prev, [cmd.id]: e.target.value }))
                        }
                      >
                        <option value="">Choisir un livreur…</option>
                        {disponibles.map((l) => (
                          <option key={l.id} value={l.id}>{l.nom}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => { void handleAssign(cmd.id) }}
                        disabled={!selLivreur[cmd.id] || assigning === cmd.id}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[var(--brand)] transition-colors',
                          'disabled:opacity-50 disabled:cursor-not-allowed',
                        )}
                      >
                        {assigning === cmd.id ? '…' : 'Assigner'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Carte Mapbox */}
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden" style={{ height: 480 }}>
          {!loading && <LiveMap livreurs={livreurs} />}
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}
