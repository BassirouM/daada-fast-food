/**
 * POST /api/upload
 * Upload d'image vers Supabase Storage avec redimensionnement sharp.
 *
 * Sécurité :
 *   - Auth JWT requis
 *   - MIME type validé (images uniquement)
 *   - Taille max : 10 MB
 *   - Redimensionnement max 800×800 (sharp)
 *   - Rate limit : 20 uploads / 10 min
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { getVerifiedPayload } from '@/services/auth/session'
import { checkRateLimit } from '@/lib/security/rateLimit'

// Force le runtime Node.js (sharp est un module natif, incompatible Edge)
export const runtime = 'nodejs'

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/jpg', 'image/png',
  'image/webp', 'image/gif',
])
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const MAX_DIMENSION  = 800

export async function POST(req: NextRequest) {
  try {
    // Auth
    const payload = await getVerifiedPayload(req.headers.get('authorization'), req.cookies)
    if (!payload) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Rate limit : 20 uploads / 10 min
    const rl = await checkRateLimit(`rl:upload:${payload.sub}`, 20, 600)
    if (!rl.ok) {
      return NextResponse.json({ error: 'Trop d\'uploads. Réessayez dans quelques minutes.' }, { status: 429 })
    }

    // Parse multipart form
    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return NextResponse.json({ error: 'FormData invalide' }, { status: 400 })
    }

    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Champ "file" manquant' }, { status: 400 })
    }

    // Vérification MIME
    const mimeType = file.type
    if (!ALLOWED_MIME.has(mimeType)) {
      return NextResponse.json(
        { error: `Type de fichier non accepté : ${mimeType}. Formats autorisés : JPEG, PNG, WebP, GIF` },
        { status: 415 }
      )
    }

    // Vérification taille
    const arrayBuffer = await file.arrayBuffer()
    if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 10 MB)' },
        { status: 413 }
      )
    }

    const inputBuffer = Buffer.from(arrayBuffer)

    // ── Redimensionnement avec sharp ──────────────────────────────────────────
    let processedBuffer: Buffer
    let outputMime = 'image/webp'

    try {
      const sharp = (await import('sharp')).default

      processedBuffer = await sharp(inputBuffer)
        .resize(MAX_DIMENSION, MAX_DIMENSION, {
          fit:        'inside',       // respecte le ratio, ne dépasse jamais 800×800
          withoutEnlargement: true,   // ne pas agrandir les petites images
        })
        .webp({ quality: 85 })       // conversion WebP pour réduire la taille
        .toBuffer()

      outputMime = 'image/webp'
    } catch (sharpErr) {
      console.error('[upload] sharp error:', sharpErr)
      // Fallback : upload sans redimensionnement
      processedBuffer = inputBuffer
      outputMime      = mimeType
    }

    // ── Upload vers Supabase Storage ──────────────────────────────────────────
    const ext       = outputMime === 'image/webp' ? 'webp' : 'jpg'
    const bucket    = (formData.get('bucket') as string | null) ?? 'menus'
    const filename  = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const admin = createAdminClient()
    const { error: uploadErr } = await admin.storage
      .from(bucket)
      .upload(filename, processedBuffer, {
        contentType: outputMime,
        upsert:      false,
      })

    if (uploadErr) {
      console.error('[upload] Supabase Storage error:', uploadErr)
      return NextResponse.json(
        { error: `Upload Storage échoué : ${uploadErr.message}` },
        { status: 500 }
      )
    }

    const { data: urlData } = admin.storage.from(bucket).getPublicUrl(filename)

    return NextResponse.json({
      url:      urlData.publicUrl,
      filename,
      bucket,
      size:     processedBuffer.byteLength,
      mimeType: outputMime,
    })
  } catch (err) {
    console.error('[POST /api/upload]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
