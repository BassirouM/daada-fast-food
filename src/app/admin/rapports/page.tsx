'use client'

import { useState, useCallback } from 'react'
import { Download, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type PeriodFilter = 'today' | 'week' | 'month'

type VenteLigne = {
  id:               string
  created_at:       string
  statut:           string
  total:            number
  sous_total:       number
  frais_livraison:  number
  adresse_livraison: string
  client_nom:       string
  client_tel:       string
  articles_resume:  string
  methode_paiement: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeriodRange(period: PeriodFilter): { start: string; end: string } {
  const now   = new Date()
  const end   = new Date(now)
  end.setHours(23, 59, 59, 999)

  const start = new Date(now)
  if (period === 'today') {
    start.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
  } else {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
  }

  return { start: start.toISOString(), end: end.toISOString() }
}

function formatDT(iso: string) {
  return new Date(iso).toLocaleString('fr-CM', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function exportCSV(rows: VenteLigne[]) {
  const headers = [
    'ID', 'Date', 'Statut', 'Client', 'Téléphone',
    'Articles', 'Sous-total', 'Frais livraison', 'Total',
    'Paiement', 'Adresse',
  ]

  const lines = rows.map((r) => [
    r.id.slice(0, 8).toUpperCase(),
    new Date(r.created_at).toLocaleString('fr-CM'),
    r.statut,
    `"${r.client_nom.replace(/"/g, '""')}"`,
    r.client_tel,
    `"${r.articles_resume.replace(/"/g, '""')}"`,
    r.sous_total,
    r.frais_livraison,
    r.total,
    r.methode_paiement ?? 'N/A',
    `"${r.adresse_livraison.replace(/"/g, '""')}"`,
  ].join(','))

  const csv  = [headers.join(','), ...lines].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `daada-rapports-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminRapportsPage() {
  const [period,  setPeriod]  = useState<PeriodFilter>('week')
  const [rows,    setRows]    = useState<VenteLigne[]>([])
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  const TABS: Array<{ v: PeriodFilter; label: string }> = [
    { v: 'today', label: "Aujourd'hui" },
    { v: 'week',  label: 'Semaine'     },
    { v: 'month', label: 'Mois'        },
  ]

  const fetchReport = useCallback(async (p: PeriodFilter) => {
    setLoading(true)
    const { start, end } = getPeriodRange(p)

    const { data: cmds } = await supabase
      .from('commandes')
      .select(`
        id, created_at, statut, total, sous_total, frais_livraison, adresse_livraison,
        users!commandes_client_id_fkey ( nom, telephone ),
        commande_articles ( nom, quantite, prix_unitaire ),
        paiements ( methode )
      `)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false })
      .limit(500)

    const mapped: VenteLigne[] = ((cmds ?? []) as Array<Record<string, unknown>>).map((r) => {
      const client    = r['users']   as { nom: string; telephone: string } | null
      const articles  = (r['commande_articles'] as Array<{ nom: string; quantite: number }>) ?? []
      const paiements = (r['paiements'] as Array<{ methode: string }>) ?? []

      return {
        id:               r['id']              as string,
        created_at:       r['created_at']      as string,
        statut:           r['statut']          as string,
        total:            r['total']           as number,
        sous_total:       r['sous_total']      as number,
        frais_livraison:  r['frais_livraison'] as number,
        adresse_livraison: r['adresse_livraison'] as string,
        client_nom:       client?.nom       ?? 'Inconnu',
        client_tel:       client?.telephone ?? '',
        articles_resume:  articles.map((a) => `${a.nom} ×${a.quantite}`).join(', '),
        methode_paiement: paiements[0]?.methode ?? null,
      }
    })

    setRows(mapped)
    setLoading(false)
    setFetched(true)
  }, [])

  const handlePeriod = (p: PeriodFilter) => {
    setPeriod(p)
    void fetchReport(p)
  }

  // ── Stats récap ────────────────────────────────────────────────────────────

  const total         = rows.reduce((acc, r) => acc + (r.statut !== 'cancelled' ? r.total : 0), 0)
  const nbCommandes   = rows.filter((r) => r.statut !== 'cancelled').length
  const nbAnnulees    = rows.filter((r) => r.statut === 'cancelled').length
  const panierMoyen   = nbCommandes > 0 ? Math.round(total / nbCommandes) : 0

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Rapports</h1>
          <p className="text-sm text-[var(--text-muted)]">Historique des ventes</p>
        </div>
        {rows.length > 0 && (
          <button
            onClick={() => exportCSV(rows)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[var(--brand)] border border-[var(--brand)]/40 hover:bg-[var(--brand)]/10 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Filtres période */}
      <div className="flex items-center gap-2 mb-5">
        <Filter className="h-4 w-4 text-[var(--text-muted)]" />
        {TABS.map(({ v, label }) => (
          <button
            key={v}
            onClick={() => handlePeriod(v)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold border transition-all',
              period === v
                ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Récap */}
      {fetched && !loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Commandes', value: String(nbCommandes) },
            { label: 'CA Total',  value: formatPrice(total)  },
            { label: 'Panier moyen', value: formatPrice(panierMoyen) },
            { label: 'Annulées', value: String(nbAnnulees) },
          ].map(({ label, value }) => (
            <div key={label}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
              <p className="text-xl font-black text-[var(--text-primary)] tabular-nums">{value}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tableau */}
      {!fetched && !loading ? (
        <div className="text-center py-16">
          <p className="text-[var(--text-muted)] text-sm mb-3">Sélectionnez une période ci-dessus</p>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="h-12 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]"
              style={{ animation: 'pulse 1.5s ease infinite' }} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)] text-sm">
          Aucune vente sur cette période.
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--bg-surface)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]" style={{ background: 'var(--bg-elevated)' }}>
                  {['#', 'Date', 'Client', 'Articles', 'Total', 'Paiement', 'Statut'].map((h) => (
                    <th key={h}
                      className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, _i) => (
                  <tr key={r.id}
                    className={cn(
                      'border-b border-[var(--border)] last:border-0 transition-colors',
                      'hover:bg-[var(--bg-elevated)]',
                      r.statut === 'cancelled' && 'opacity-50',
                    )}
                  >
                    <td className="px-3 py-2.5 text-xs font-mono text-[var(--text-muted)] whitespace-nowrap">
                      #{r.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                      {formatDT(r.created_at)}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-xs font-medium text-[var(--text-primary)]">{r.client_nom}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{r.client_tel}</p>
                    </td>
                    <td className="px-3 py-2.5 max-w-[200px]">
                      <p className="text-[10px] text-[var(--text-secondary)] truncate" title={r.articles_resume}>
                        {r.articles_resume}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-sm font-bold text-[var(--brand)] whitespace-nowrap">
                      {formatPrice(r.total)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[var(--text-secondary)] whitespace-nowrap capitalize">
                      {r.methode_paiement?.replace('_', ' ') ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold',
                        r.statut === 'delivered'  && 'bg-green-500/15 text-green-600',
                        r.statut === 'cancelled'  && 'bg-red-500/15 text-red-500',
                        r.statut === 'picked_up'  && 'bg-blue-500/15 text-blue-500',
                        !['delivered','cancelled','picked_up'].includes(r.statut)
                          && 'bg-[var(--brand)]/15 text-[var(--brand)]',
                      )}>
                        {r.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-[var(--border)] flex justify-between items-center">
            <p className="text-xs text-[var(--text-muted)]">{rows.length} lignes</p>
            <button
              onClick={() => exportCSV(rows)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)] hover:underline"
            >
              <Download className="h-3 w-3" /> Exporter CSV
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}
