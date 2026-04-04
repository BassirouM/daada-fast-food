'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { nanoid } from 'nanoid'
import { useCartStore, FRAIS_LIVRAISON } from '@/stores/cart.store'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice, detectMomoProvider } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const QUARTIERS = [
  'Domayo', 'Kakataré', 'Doualaré', 'Kongola', 'Lopéré',
  'Ouro-Tchédé', 'Pitoare', 'Dougoy', 'Founangué', 'Autres',
]

const FRAIS_QUARTIER: Record<string, number> = {
  Domayo: 500, Kakataré: 500, Doualaré: 500,
  Kongola: 600, Lopéré: 600, 'Ouro-Tchédé': 600, Founangué: 600,
  Pitoare: 700, Dougoy: 700, Autres: 700,
}

const STEP_LABELS = ['Récapitulatif', 'Livraison', 'Paiement'] as const

type PayMethod = 'orange_money' | 'mtn_momo'

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div style={{ padding: '0.875rem 1rem 0', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', maxWidth: 480, margin: '0 auto' }}>
        {STEP_LABELS.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3
          const done = step > n
          const active = step === n
          return (
            <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : undefined }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: done ? 'var(--brand)' : active ? 'var(--brand)' : 'var(--bg-elevated)',
                    color: done || active ? 'white' : 'var(--text-muted)',
                    border: active && !done ? '2px solid var(--brand)' : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {done ? '✓' : n}
                </div>
                <span style={{ fontSize: '0.6875rem', fontWeight: active ? 600 : 400, color: active ? 'var(--brand)' : done ? 'var(--text-secondary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
              </div>
              {i < 2 && (
                <div style={{ flex: 1, height: 2, margin: '0 0.5rem', marginBottom: '1.25rem', background: done ? 'var(--brand)' : 'var(--bg-elevated)', transition: 'background 0.3s ease' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Checkout page ────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { items, adresseLivraison, updateQuantity, removeItem, clearCart } = useCartStore()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [noteCuisinier, setNoteCuisinier] = useState('')

  // Step 2
  const [useMapAddress, setUseMapAddress] = useState(!!adresseLivraison)
  const [quartier, setQuartier] = useState(adresseLivraison?.quartier ?? '')
  const [rue, setRue] = useState(adresseLivraison?.adresse ?? '')
  const [description, setDescription] = useState('')
  const [telephone, setTelephone] = useState(user?.telephone?.replace('+237', '') ?? '')
  const [heureMode, setHeureMode] = useState<'asap' | 'scheduled'>('asap')
  const [heure, setHeure] = useState('')

  // Step 3
  const [payMethod, setPayMethod] = useState<PayMethod>('orange_money')
  const [payPhone, setPayPhone] = useState('')

  // Idempotency key — generated once per session
  const idempotencyKeyRef = useRef<string>(nanoid(21))

  // Redirect if cart empty
  useEffect(() => {
    if (!authLoading && items.length === 0) {
      router.replace('/menu')
    }
  }, [authLoading, items.length, router])

  // Pre-fill phone from user
  useEffect(() => {
    if (user?.telephone) {
      const clean = user.telephone.replace('+237', '').replace('237', '')
      setTelephone(clean)
      setPayPhone(clean)
    }
  }, [user?.telephone])

  // Auto-detect payment method from phone
  useEffect(() => {
    const provider = detectMomoProvider(payPhone)
    if (provider === 'orange') setPayMethod('orange_money')
    else if (provider === 'mtn') setPayMethod('mtn_momo')
  }, [payPhone])

  // Computed totals
  const frais = useMemo(() => {
    if (adresseLivraison && useMapAddress) return adresseLivraison.fraisLivraison
    return FRAIS_QUARTIER[quartier] ?? FRAIS_LIVRAISON
  }, [adresseLivraison, useMapAddress, quartier])

  const sousTotal = useMemo(
    () => items.reduce((acc, i) => acc + i.totalPrice, 0),
    [items]
  )
  const total = sousTotal + frais

  // ── Step navigation ──────────────────────────────────────────────────────────

  const goToStep2 = useCallback(() => {
    if (items.length === 0) return
    setStep(2)
    window.scrollTo(0, 0)
  }, [items.length])

  const goToStep3 = useCallback(() => {
    if (!quartier && !useMapAddress) {
      setError('Veuillez sélectionner un quartier')
      return
    }
    if (!rue.trim() && !useMapAddress) {
      setError('Veuillez saisir votre adresse')
      return
    }
    if (!telephone.trim()) {
      setError('Veuillez saisir votre numéro de téléphone')
      return
    }
    setError('')
    setStep(3)
    window.scrollTo(0, 0)
  }, [quartier, rue, telephone, useMapAddress])

  // ── Payment submit ───────────────────────────────────────────────────────────

  const handlePay = useCallback(async () => {
    setError('')
    setLoading(true)

    const adresseStr = useMapAddress && adresseLivraison
      ? adresseLivraison.adresse
      : `${rue} — ${description}`.trim()

    const quartierFinal = useMapAddress && adresseLivraison
      ? adresseLivraison.quartier
      : quartier

    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          articles: items.map((item) => ({
            menuId: item.menuItem.id,
            quantite: item.quantity,
          })),
          adresseLivraison: adresseStr,
          quartier: quartierFinal,
          telephone: `+237${telephone.replace(/\s/g, '')}`,
          noteCuisinier: noteCuisinier || undefined,
          methode: payMethod,
          telephonePaiement: `+237${payPhone.replace(/\s/g, '')}`,
          idempotencyKey: idempotencyKeyRef.current,
        }),
      })

      const data = await res.json() as { redirectUrl?: string; commandeId?: string; error?: string }

      if (!res.ok || !data.redirectUrl) {
        setError(data.error ?? 'Erreur lors de l\'initiation du paiement')
        setLoading(false)
        return
      }

      clearCart()
      window.location.href = data.redirectUrl
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.')
      setLoading(false)
    }
  }, [useMapAddress, adresseLivraison, rue, description, quartier, telephone, noteCuisinier, payMethod, payPhone, items, clearCart])

  // ── Render helpers ───────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 12,
    border: '1.5px solid var(--border)',
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    fontSize: '0.9375rem',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: '0.375rem',
  }

  const sectionStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    borderRadius: 16,
    padding: '1rem',
    marginBottom: '0.75rem',
    border: '1px solid var(--border)',
  }

  if (authLoading) return null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem' }}>
          <button
            onClick={() => step === 1 ? router.back() : setStep((s) => (s - 1) as 1 | 2 | 3)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.25rem', cursor: 'pointer', padding: '0.25rem' }}
          >
            ←
          </button>
          <h1 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Commande
          </h1>
        </div>
        <ProgressBar step={step} />
      </header>

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '1rem 1rem 6rem' }}>

        {/* ══ ÉTAPE 1 — RÉCAPITULATIF ══════════════════════════════════════════ */}
        {step === 1 && (
          <>
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                🛒 Articles ({items.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {/* Image */}
                    <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-elevated)', position: 'relative' }}>
                      {item.menuItem.image_url ? (
                        <Image
                          src={item.menuItem.image_url}
                          alt={item.menuItem.name}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="56px"
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🍔</div>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.menuItem.name}
                      </p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--brand)', fontWeight: 700 }}>
                        {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                    {/* Qty controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                      <button
                        onClick={() => item.quantity === 1 ? removeItem(item.id) : updateQuantity(item.id, item.quantity - 1)}
                        style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                      >
                        −
                      </button>
                      <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid var(--brand)', background: 'rgba(255,107,0,0.1)', color: 'var(--brand)', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                      >
                        +
                      </button>
                    </div>
                    {/* Item total */}
                    <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', flexShrink: 0, minWidth: 64, textAlign: 'right' }}>
                      {formatPrice(item.totalPrice)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Note cuisinier */}
            <div style={sectionStyle}>
              <label style={labelStyle}>📝 Note pour le cuisinier (optionnel)</label>
              <textarea
                value={noteCuisinier}
                onChange={(e) => setNoteCuisinier(e.target.value.slice(0, 200))}
                placeholder="Sans piment, extra sauce, allergie aux arachides…"
                rows={3}
                style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.25rem' }}>
                {noteCuisinier.length}/200
              </p>
            </div>

            {/* Totaux */}
            <div style={sectionStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Sous-total</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatPrice(sousTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Frais de livraison</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatPrice(frais)}</span>
                </div>
                <div style={{ height: 1, background: 'var(--border)', margin: '0.25rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--brand)' }}>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ ÉTAPE 2 — LIVRAISON ══════════════════════════════════════════════ */}
        {step === 2 && (
          <>
            {/* Address from map */}
            {adresseLivraison && (
              <div style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>📍 Adresse de livraison</h2>
                  <button
                    onClick={() => router.push('/map?returnUrl=/checkout')}
                    style={{ fontSize: '0.8125rem', color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Modifier
                  </button>
                </div>
                {/* Toggle map address / manual */}
                <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 10, padding: 3, marginBottom: '0.75rem' }}>
                  {[{ v: true, label: '📍 Adresse carte' }, { v: false, label: '✏️ Saisie manuelle' }].map(({ v, label }) => (
                    <button
                      key={String(v)}
                      onClick={() => setUseMapAddress(v)}
                      style={{ flex: 1, padding: '0.4rem', borderRadius: 8, border: 'none', background: useMapAddress === v ? 'var(--brand)' : 'transparent', color: useMapAddress === v ? 'white' : 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {useMapAddress && (
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '0.75rem', border: '1.5px solid rgba(255,107,0,0.3)' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{adresseLivraison.label}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{adresseLivraison.quartier} · ~{adresseLivraison.tempsEstime} min · {formatPrice(adresseLivraison.fraisLivraison)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Manual address form */}
            {(!adresseLivraison || !useMapAddress) && (
              <div style={sectionStyle}>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>📍 Adresse de livraison</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Quartier *</label>
                    <select value={quartier} onChange={(e) => setQuartier(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">Choisir un quartier…</option>
                      {QUARTIERS.map((q) => <option key={q} value={q}>{q} — {formatPrice(FRAIS_QUARTIER[q] ?? 700)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Rue / Indication *</label>
                    <input type="text" value={rue} onChange={(e) => setRue(e.target.value)} placeholder="Ex: Face à la pharmacie centrale" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Description complémentaire</label>
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Couleur de la porte, bâtiment…" style={inputStyle} />
                  </div>
                </div>
              </div>
            )}

            {/* Button to open map */}
            {!adresseLivraison && (
              <button
                onClick={() => router.push('/map?returnUrl=/checkout')}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 12, border: '1.5px dashed var(--brand)', background: 'rgba(255,107,0,0.06)', color: 'var(--brand)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', marginBottom: '0.75rem' }}
              >
                🗺️ Choisir sur la carte (recommandé)
              </button>
            )}

            {/* Phone */}
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>📞 Contact livraison</h2>
              <div>
                <label style={labelStyle}>Téléphone *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.9375rem', fontWeight: 600, pointerEvents: 'none' }}>+237</span>
                  <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value.replace(/\D/g, ''))} placeholder="677 123 456" style={{ ...inputStyle, paddingLeft: '3.5rem' }} />
                </div>
              </div>
            </div>

            {/* Heure livraison */}
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>⏱ Heure de livraison</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { v: 'asap' as const, label: '🚀 Dès que possible' },
                  { v: 'scheduled' as const, label: '🕐 Heure planifiée' },
                ].map(({ v, label }) => (
                  <button
                    key={v}
                    onClick={() => setHeureMode(v)}
                    style={{ flex: 1, padding: '0.625rem 0.5rem', borderRadius: 10, border: `1.5px solid ${heureMode === v ? 'var(--brand)' : 'var(--border)'}`, background: heureMode === v ? 'rgba(255,107,0,0.08)' : 'var(--bg-elevated)', color: heureMode === v ? 'var(--brand)' : 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {heureMode === 'scheduled' && (
                <div style={{ marginTop: '0.75rem' }}>
                  <label style={labelStyle}>Heure souhaitée</label>
                  <input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} style={inputStyle} />
                </div>
              )}
            </div>

            {error && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{error}</p>}
          </>
        )}

        {/* ══ ÉTAPE 3 — PAIEMENT ═══════════════════════════════════════════════ */}
        {step === 3 && (
          <>
            {/* Méthode paiement */}
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>💳 Méthode de paiement</h2>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {[
                  { v: 'orange_money' as const, label: 'Orange Money', emoji: '🟠', color: '#FF6600' },
                  { v: 'mtn_momo' as const, label: 'MTN MoMo', emoji: '🟡', color: '#FFCB00' },
                ].map(({ v, label, emoji, color }) => (
                  <button
                    key={v}
                    onClick={() => setPayMethod(v)}
                    style={{
                      flex: 1,
                      padding: '1rem 0.75rem',
                      borderRadius: 14,
                      border: `2px solid ${payMethod === v ? color : 'var(--border)'}`,
                      background: payMethod === v ? `${color}18` : 'var(--bg-elevated)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.375rem' }}>{emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: payMethod === v ? color : 'var(--text-secondary)' }}>{label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Numéro mobile money */}
            <div style={sectionStyle}>
              <label style={labelStyle}>
                {payMethod === 'orange_money' ? '🟠 Numéro Orange Money' : '🟡 Numéro MTN MoMo'}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.9375rem', fontWeight: 600, pointerEvents: 'none' }}>+237</span>
                <input
                  type="tel"
                  value={payPhone}
                  onChange={(e) => setPayPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder={payMethod === 'orange_money' ? '69X XXX XXX' : '65X XXX XXX'}
                  style={{ ...inputStyle, paddingLeft: '3.5rem' }}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                Vous recevrez une invitation de paiement sur ce numéro
              </p>
            </div>

            {/* Récapitulatif final */}
            <div style={sectionStyle}>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>📋 Récapitulatif</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{items.length} article{items.length > 1 ? 's' : ''}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatPrice(sousTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Livraison · {useMapAddress && adresseLivraison ? adresseLivraison.quartier : quartier}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatPrice(frais)}</span>
                </div>
                <div style={{ height: 1, background: 'var(--border)', margin: '0.375rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Total à payer</span>
                  <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--brand)' }}>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {error && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{error}</p>}
          </>
        )}
      </main>

      {/* ── Fixed bottom CTA ───────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom))',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
          zIndex: 20,
        }}
      >
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          {step === 1 && (
            <button
              onClick={goToStep2}
              disabled={items.length === 0}
              style={{ width: '100%', padding: '0.875rem', borderRadius: 14, background: 'linear-gradient(135deg, #FF6B00, #CC5500)', color: 'white', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,107,0,0.4)' }}
            >
              Continuer · {formatPrice(total)}
            </button>
          )}
          {step === 2 && (
            <button
              onClick={goToStep3}
              style={{ width: '100%', padding: '0.875rem', borderRadius: 14, background: 'linear-gradient(135deg, #FF6B00, #CC5500)', color: 'white', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,107,0,0.4)' }}
            >
              Choisir le paiement
            </button>
          )}
          {step === 3 && (
            <button
              onClick={() => void handlePay()}
              disabled={loading || !payPhone.trim()}
              style={{ width: '100%', padding: '0.875rem', borderRadius: 14, background: loading ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #FF6B00, #CC5500)', color: loading ? 'var(--text-muted)' : 'white', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 20px rgba(255,107,0,0.4)', transition: 'all 0.2s' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  Traitement…
                </span>
              ) : `💳 Payer ${formatPrice(total)}`}
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
