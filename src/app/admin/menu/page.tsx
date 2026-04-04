'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Pencil, Trash2, ImageIcon, ToggleLeft, ToggleRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { logAudit } from '@/lib/db/audit'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { cn, formatPrice } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type Plat = {
  id: string
  nom: string
  description: string
  prix: number
  categorie: string
  image_url: string | null
  disponible: boolean
  temps_preparation: number
  tags: string[]
}

type PlatForm = Omit<Plat, 'id' | 'image_url'> & { image_url: string }

const FORM_EMPTY: PlatForm = {
  nom:               '',
  description:       '',
  prix:              0,
  categorie:         '',
  image_url:         '',
  disponible:        true,
  temps_preparation: 15,
  tags:              [],
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminMenuPage() {
  const { user }   = useAuth()
  const [plats,    setPlats]    = useState<Plat[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,  setEditing]  = useState<Plat | null>(null)
  const [form,     setForm]     = useState<PlatForm>(FORM_EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [formErr,  setFormErr]  = useState<string | null>(null)
  const [imgFile,  setImgFile]  = useState<File | null>(null)
  const [imgPrev,  setImgPrev]  = useState<string | null>(null)
  const fileRef    = useRef<HTMLInputElement>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchPlats = useCallback(async () => {
    const { data } = await supabase
      .from('menus')
      .select('*')
      .order('categorie', { ascending: true })
    setPlats((data as Plat[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void fetchPlats() }, [fetchPlats])

  // ── Toggle disponibilité ───────────────────────────────────────────────────

  const toggleDispo = useCallback(async (plat: Plat) => {
    if (!user?.id) return
    const newVal = !plat.disponible

    setPlats((prev) =>
      prev.map((p) => p.id === plat.id ? { ...p, disponible: newVal } : p)
    )

    const { error } = await supabase
      .from('menus')
      .update({ disponible: newVal })
      .eq('id', plat.id)

    if (error) {
      setPlats((prev) =>
        prev.map((p) => p.id === plat.id ? { ...p, disponible: plat.disponible } : p)
      )
    } else {
      await logAudit({
        userId:    user.id,
        action:    `toggle_disponibilite:${newVal}`,
        tableName: 'menus',
        recordId:  plat.id,
        oldData:   { disponible: plat.disponible },
        newData:   { disponible: newVal },
      })
    }
  }, [user?.id])

  // ── Open modal ─────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null)
    setForm(FORM_EMPTY)
    setImgFile(null)
    setImgPrev(null)
    setFormErr(null)
    setModalOpen(true)
  }

  const openEdit = (plat: Plat) => {
    setEditing(plat)
    setForm({
      nom:               plat.nom,
      description:       plat.description,
      prix:              plat.prix,
      categorie:         plat.categorie,
      image_url:         plat.image_url ?? '',
      disponible:        plat.disponible,
      temps_preparation: plat.temps_preparation,
      tags:              plat.tags,
    })
    setImgFile(null)
    setImgPrev(plat.image_url)
    setFormErr(null)
    setModalOpen(true)
  }

  // ── Image picker ───────────────────────────────────────────────────────────

  const handleImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImgFile(file)
    setImgPrev(URL.createObjectURL(file))
  }

  // ── Upload image Supabase Storage ──────────────────────────────────────────

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext      = file.name.split('.').pop() ?? 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from('menus')
      .upload(filename, file, { upsert: false, contentType: file.type })

    if (error) return null

    const { data: urlData } = supabase.storage.from('menus').getPublicUrl(filename)
    return urlData.publicUrl
  }

  // ── Sauvegarder ────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!user?.id) return
    if (!form.nom.trim() || !form.categorie.trim() || form.prix <= 0) {
      setFormErr('Nom, catégorie et prix sont requis (prix > 0).')
      return
    }

    setSaving(true)
    setFormErr(null)

    let imageUrl = form.image_url || null

    // Upload image si nouveau fichier
    if (imgFile) {
      const uploaded = await uploadImage(imgFile)
      if (!uploaded) {
        setFormErr('Erreur upload image. Vérifiez le bucket "menus" dans Supabase Storage.')
        setSaving(false)
        return
      }
      imageUrl = uploaded
    }

    const payload = {
      nom:               form.nom.trim(),
      description:       form.description.trim(),
      prix:              form.prix,
      categorie:         form.categorie.trim(),
      image_url:         imageUrl,
      disponible:        form.disponible,
      temps_preparation: form.temps_preparation,
      tags:              form.tags,
    }

    if (editing) {
      const { error } = await supabase
        .from('menus')
        .update(payload)
        .eq('id', editing.id)

      if (error) { setFormErr(error.message); setSaving(false); return }

      await logAudit({
        userId: user.id, action: 'update_plat', tableName: 'menus',
        recordId: editing.id, oldData: { ...editing }, newData: payload,
      })
    } else {
      const { data, error } = await supabase
        .from('menus')
        .insert(payload)
        .select()
        .single()

      if (error) { setFormErr(error.message); setSaving(false); return }

      await logAudit({
        userId: user.id, action: 'create_plat', tableName: 'menus',
        recordId: (data as { id: string }).id, newData: payload,
      })
    }

    setSaving(false)
    setModalOpen(false)
    void fetchPlats()
  }

  // ── Soft delete ────────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (plat: Plat) => {
    if (!user?.id) return
    if (!confirm(`Désactiver "${plat.nom}" ? (soft delete)`)) return

    await supabase.from('menus').update({ disponible: false }).eq('id', plat.id)
    await logAudit({
      userId: user.id, action: 'soft_delete_plat', tableName: 'menus',
      recordId: plat.id, oldData: { disponible: true }, newData: { disponible: false },
    })
    void fetchPlats()
  }, [user?.id, fetchPlats])

  // ── Helpers form ───────────────────────────────────────────────────────────

  const inputCls = cn(
    'w-full px-3 py-2 rounded-xl border bg-[var(--bg-elevated)]',
    'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50 border-[var(--border)]',
  )

  const filtered = plats.filter((p) =>
    p.nom.toLowerCase().includes(search.toLowerCase()) ||
    p.categorie.toLowerCase().includes(search.toLowerCase())
  )

  // Group by catégorie
  const byCateg: Record<string, Plat[]> = {}
  for (const p of filtered) {
    if (!byCateg[p.categorie]) byCateg[p.categorie] = []
    byCateg[p.categorie]!.push(p)
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Gestion du menu</h1>
          <p className="text-sm text-[var(--text-muted)]">{plats.length} plats au total</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[var(--brand)] hover:bg-[var(--brand-dark)] transition-colors active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Nouveau plat
        </button>
      </div>

      {/* Recherche */}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un plat ou catégorie…"
        className={cn(inputCls, 'mb-5')}
      />

      {/* Tableau */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-16 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]"
              style={{ animation: 'pulse 1.5s ease infinite' }} />
          ))}
        </div>
      ) : (
        Object.entries(byCateg).map(([cat, items]) => (
          <div key={cat} className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 px-1">
              {cat} ({items.length})
            </h2>
            <div className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--bg-surface)]">
              {items.map((plat, i) => (
                <div
                  key={plat.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3',
                    i < items.length - 1 && 'border-b border-[var(--border)]',
                    !plat.disponible && 'opacity-50',
                  )}
                >
                  {/* Image */}
                  {plat.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={plat.image_url} alt={plat.nom}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="h-5 w-5 text-[var(--text-muted)]" />
                    </div>
                  )}

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{plat.nom}</p>
                    <p className="text-xs text-[var(--text-muted)]">{plat.temps_preparation} min</p>
                  </div>

                  {/* Prix */}
                  <p className="text-sm font-bold text-[var(--brand)] flex-shrink-0 hidden sm:block">
                    {formatPrice(plat.prix)}
                  </p>

                  {/* Toggle dispo */}
                  <button
                    onClick={() => { void toggleDispo(plat) }}
                    className="flex-shrink-0"
                    aria-label={plat.disponible ? 'Désactiver' : 'Activer'}
                    title={plat.disponible ? 'Disponible — cliquer pour désactiver' : 'Indisponible — cliquer pour activer'}
                  >
                    {plat.disponible
                      ? <ToggleRight className="h-6 w-6 text-[var(--brand)]" />
                      : <ToggleLeft  className="h-6 w-6 text-[var(--text-muted)]" />
                    }
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(plat)}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
                      aria-label="Modifier"
                    >
                      <Pencil className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                    </button>
                    <button
                      onClick={() => { void handleDelete(plat) }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal créer/modifier */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Modifier — ${editing.nom}` : 'Nouveau plat'}
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {/* Image */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Image
            </label>
            <div
              className="relative w-full h-32 rounded-xl border-2 border-dashed border-[var(--border)] overflow-hidden cursor-pointer hover:border-[var(--brand)]/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {imgPrev ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgPrev} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1">
                  <ImageIcon className="h-6 w-6 text-[var(--text-muted)]" />
                  <p className="text-xs text-[var(--text-muted)]">Cliquer pour choisir une image</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImgChange}
            />
          </div>

          {/* Nom */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Nom *</label>
            <input type="text" value={form.nom}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              placeholder="Ex: Poulet braisé" className={inputCls} />
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Catégorie *</label>
            <input type="text" value={form.categorie}
              onChange={(e) => setForm((f) => ({ ...f, categorie: e.target.value }))}
              placeholder="Ex: Grillades" className={inputCls} />
          </div>

          {/* Prix */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Prix (FCFA) *</label>
            <input type="number" min="0" value={form.prix}
              onChange={(e) => setForm((f) => ({ ...f, prix: Number(e.target.value) }))}
              className={inputCls} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Description</label>
            <textarea rows={2} value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description courte…" className={cn(inputCls, 'resize-none')} />
          </div>

          {/* Temps préparation */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Temps de préparation (min)
            </label>
            <input type="number" min="1" value={form.temps_preparation}
              onChange={(e) => setForm((f) => ({ ...f, temps_preparation: Number(e.target.value) }))}
              className={inputCls} />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Tags (séparés par virgule)
            </label>
            <input type="text"
              value={form.tags.join(', ')}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) }))}
              placeholder="Ex: épicé, populaire, nouveau" className={inputCls} />
          </div>

          {formErr && <p className="text-sm text-red-500">{formErr}</p>}
        </div>

        <ModalFooter>
          <button onClick={() => setModalOpen(false)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
            Annuler
          </button>
          <button onClick={() => { void handleSave() }} disabled={saving}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all',
              'bg-[var(--brand)] hover:bg-[var(--brand-dark)] active:scale-95',
              saving && 'opacity-60 cursor-not-allowed',
            )}>
            {saving ? 'Enregistrement…' : editing ? 'Sauvegarder' : 'Créer'}
          </button>
        </ModalFooter>
      </Modal>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}
