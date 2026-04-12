'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { ShoppingBag, TrendingUp, Users, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type KPI = {
  commandesDuJour:   number
  caJour:            number
  nouveauxClients:   number
  delaiMoyenMin:     number
}

type DayData = { date: string; commandes: number; ca: number }
type CatData = { name: string; value: number }
type TopPlat = { nom: string; total: number; image_url: string | null }

// ─── Palette pie chart ────────────────────────────────────────────────────────

const PIE_COLORS = ['#F97316', '#EA580C', '#FF9A45', '#FFB784', '#3B82F6', '#10B981']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CM', { day: '2-digit', month: 'short' })
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div
      className="rounded-2xl border border-[var(--border)] p-4"
      style={{ background: 'var(--bg-surface)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black text-[var(--text-primary)] tabular-nums">{value}</p>
      <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [kpi,      setKpi]      = useState<KPI | null>(null)
  const [days,     setDays]     = useState<DayData[]>([])
  const [cats,     setCats]     = useState<CatData[]>([])
  const [top5,     setTop5]     = useState<TopPlat[]>([])
  const [loading,  setLoading]  = useState(true)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { start, end } = todayRange()
    const sevenDaysAgo   = daysAgo(7)

    // Commandes du jour
    const { data: todayOrders } = await supabase
      .from('commandes')
      .select('total, statut, created_at, updated_at, client_id')
      .gte('created_at', start)
      .lte('created_at', end)

    // Nouveaux clients du jour
    const { count: newClients } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', start)
      .lte('created_at', end)

    // 7 derniers jours
    const { data: weekOrders } = await supabase
      .from('commandes')
      .select('total, created_at, statut')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: true })

    // Top 5 plats
    const { data: articlesData } = await supabase
      .from('commande_articles')
      .select('nom, quantite, menus ( image_url )')
      .gte('created_at' as never, sevenDaysAgo)

    const rows = (todayOrders ?? []) as Array<{
      total: number; statut: string; created_at: string; updated_at: string; client_id: string
    }>

    // KPI délai moyen (created_at → updated_at pour les livrées)
    const delivered = rows.filter((r) => r.statut === 'delivered')
    const delaiMoy  = delivered.length
      ? Math.round(
          delivered.reduce((acc, r) => {
            const ms = new Date(r.updated_at).getTime() - new Date(r.created_at).getTime()
            return acc + ms / 60000
          }, 0) / delivered.length
        )
      : 0

    setKpi({
      commandesDuJour: rows.length,
      caJour:          rows.filter((r) => r.statut !== 'cancelled').reduce((acc, r) => acc + r.total, 0),
      nouveauxClients: newClients ?? 0,
      delaiMoyenMin:   delaiMoy,
    })

    // Données 7 jours — grouper par date
    const byDay: Record<string, { commandes: number; ca: number }> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0)
      byDay[d.toISOString().slice(0, 10)] = { commandes: 0, ca: 0 }
    }
    for (const o of (weekOrders ?? []) as Array<{ total: number; created_at: string; statut: string }>) {
      const key = o.created_at.slice(0, 10)
      if (byDay[key] && o.statut !== 'cancelled') {
        byDay[key]!.commandes++
        byDay[key]!.ca += o.total
      }
    }
    setDays(
      Object.entries(byDay).map(([date, v]) => ({
        date: shortDate(date + 'T00:00:00'),
        ...v,
      }))
    )

    // Agrégation CA par catégorie via commande_articles + menus.categorie
    const { data: catJoin } = await supabase
      .from('commande_articles')
      .select('prix_unitaire, quantite, menus ( categorie )')
      .gte('created_at' as never, sevenDaysAgo)

    const byCateg: Record<string, number> = {}
    for (const row of (catJoin ?? []) as unknown as Array<{
      prix_unitaire: number; quantite: number;
      menus: { categorie: string } | null
    }>) {
      const cat = row.menus?.categorie ?? 'Autre'
      byCateg[cat] = (byCateg[cat] ?? 0) + row.prix_unitaire * row.quantite
    }
    setCats(Object.entries(byCateg).map(([name, value]) => ({ name, value })))

    // Top 5 plats
    const platMap: Record<string, { total: number; image_url: string | null }> = {}
    for (const a of (articlesData ?? []) as unknown as Array<{
      nom: string; quantite: number; menus: { image_url: string | null } | null
    }>) {
      if (!platMap[a.nom]) platMap[a.nom] = { total: 0, image_url: a.menus?.image_url ?? null }
      platMap[a.nom]!.total += a.quantite
    }
    setTop5(
      Object.entries(platMap)
        .map(([nom, v]) => ({ nom, ...v }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
    )

    setLoading(false)
  }, [])

  useEffect(() => { void fetchAll() }, [fetchAll])

  // ── Realtime ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'commandes' }, () => {
        void fetchAll()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'commandes' }, () => {
        void fetchAll()
      })
      .subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [fetchAll])

  // ── Render ─────────────────────────────────────────────────────────────────

  const skBase = 'rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]'

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Vue d&apos;ensemble</h1>
        <p className="text-sm text-[var(--text-muted)]">Données en temps réel</p>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map((i) => (
            <div key={i} className={`${skBase} h-28`} style={{ animation: 'pulse 1.5s ease infinite' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={ShoppingBag}  label="Commandes du jour"      value={String(kpi?.commandesDuJour ?? 0)} color="#F97316" />
          <KpiCard icon={TrendingUp}   label="CA du jour"             value={formatPrice(kpi?.caJour ?? 0)}    color="#10B981" />
          <KpiCard icon={Users}        label="Nouveaux clients"        value={String(kpi?.nouveauxClients ?? 0)} color="#3B82F6" />
          <KpiCard icon={Clock}        label="Délai moyen livraison"   value={`${kpi?.delaiMoyenMin ?? 0} min`} color="#F59E0B" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Graphique commandes 7 jours */}
        <div className={`${skBase} p-4 lg:col-span-2`}>
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-4">
            Commandes — 7 derniers jours
          </p>
          {loading ? (
            <div className="h-48 rounded-xl bg-[var(--bg-elevated)]" style={{ animation: 'pulse 1.5s ease infinite' }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={days} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                />
                <Bar dataKey="commandes" name="Commandes" fill="#F97316" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart CA par catégorie */}
        <div className={`${skBase} p-4`}>
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-4">
            CA par catégorie (7j)
          </p>
          {loading || cats.length === 0 ? (
            <div className="h-48 rounded-xl bg-[var(--bg-elevated)]" style={{ animation: 'pulse 1.5s ease infinite' }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={cats} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {cats.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]!} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatPrice(v as number)}
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 11 }}
                />
                <Legend
                  iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top 5 plats */}
      <div className={`${skBase} p-4`}>
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Top 5 plats commandés (7j)
        </p>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="h-10 rounded-xl bg-[var(--bg-elevated)]" style={{ animation: 'pulse 1.5s ease infinite' }} />
            ))}
          </div>
        ) : top5.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-4 text-center">Aucune donnée</p>
        ) : (
          <div className="space-y-2">
            {top5.map((p, i) => (
              <div key={p.nom} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors">
                <span className="w-5 text-xs font-bold text-[var(--text-muted)] text-center">
                  {i + 1}
                </span>
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-sm">🍽️</div>
                )}
                <span className="flex-1 text-sm text-[var(--text-primary)] truncate">{p.nom}</span>
                <span className="text-sm font-bold text-[var(--brand)]">{p.total}x</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}
