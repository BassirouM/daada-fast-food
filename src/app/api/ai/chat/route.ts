/**
 * POST /api/ai/chat
 *
 * Streaming SSE — assistant conversationnel Daada
 * Utilise Claude claude-sonnet-4-20250514 avec le menu complet en contexte.
 *
 * Sécurité :
 *   - Auth JWT optionnelle (enrichit le contexte si connecté)
 *   - Rate limit : 20 messages/heure/user (ou IP)
 *   - Validation : message max 500 chars
 */

import type { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase'
import { getVerifiedPayload } from '@/services/auth/session'
import { checkRateLimit } from '@/lib/security/rateLimit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ─── Anthropic client ─────────────────────────────────────────────────────────

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) throw new Error('ANTHROPIC_API_KEY non configuré')
    _client = new Anthropic({ apiKey: key })
  }
  return _client
}

// ─── SSE helpers ──────────────────────────────────────────────────────────────

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

function sseDone(): string {
  return 'data: [DONE]\n\n'
}

// ─── Menu context ─────────────────────────────────────────────────────────────

async function getMenuContext(): Promise<string> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('menus')
      .select('id, nom, prix, categorie, disponible, description')
      .eq('disponible', true)
      .order('categorie')
      .limit(50)

    if (!data?.length) return 'Menu non disponible.'

    const lines = (data as Array<{
      id: string; nom: string; prix: number
      categorie: string; description: string
    }>).map((p) => `- [${p.id.slice(0, 8)}] ${p.nom} (${p.categorie}) : ${p.prix} FCFA — ${p.description.slice(0, 60)}`)

    return lines.join('\n')
  } catch {
    return 'Menu temporairement indisponible.'
  }
}

// ─── User context ─────────────────────────────────────────────────────────────

async function getUserContext(userId: string): Promise<string> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('users')
      .select('nom, quartier, points_fidelite, niveau_fidelite')
      .eq('id', userId)
      .single()

    if (!data) return ''
    const row = data as Record<string, unknown>
    return `Client : ${String(row['nom'] ?? 'Inconnu')}, quartier ${String(row['quartier'] ?? '?')}, ${String(row['points_fidelite'] ?? 0)} points fidélité (niveau ${String(row['niveau_fidelite'] ?? 'bronze')}).`
  } catch {
    return ''
  }
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(menuContext: string, userContext: string, heure: string): string {
  return `Tu es Daada, l'assistant de Daada Fast Food à Maroua, Cameroun. Tu es chaleureux, rapide et connais parfaitement le menu. Tu réponds en français, maximum 2-3 phrases par message. Tu peux recommander des plats et ajouter au panier.

Pour ajouter un plat réponds avec cette action JSON à la fin de ton message :
ACTION:{"type":"add_to_cart","menuId":"ID_COMPLET","quantity":1,"nom":"Nom du plat","prix":2500}

Pour suggérer plusieurs plats :
ACTION:{"type":"suggest","items":[{"menuId":"ID","nom":"Nom","prix":2500}]}

Heure actuelle à Maroua : ${heure}
${userContext ? `\n${userContext}` : ''}

Menu disponible (format: [id_court] Nom (catégorie) : prix FCFA) :
${menuContext}

Utilise les IDs complets dans tes actions JSON. Sois concis et enthousiaste !`
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth optionnelle
  let userId: string | null = null
  try {
    const payload = await getVerifiedPayload(req.headers.get('authorization'), req.cookies)
    if (payload?.sub) userId = payload.sub
  } catch { /**/ }

  // Rate limit
  const rlKey = userId
    ? `rl:ai:chat:${userId}`
    : `rl:ai:chat:ip:${req.headers.get('x-forwarded-for') ?? 'unknown'}`

  const rl = await checkRateLimit(rlKey, 20, 3600)
  if (!rl.ok) {
    return new Response(
      sseEvent({ error: 'Limite de 20 messages/heure atteinte. Réessaie plus tard.' }) + sseDone(),
      { status: 429, headers: { 'Content-Type': 'text/event-stream' } }
    )
  }

  let body: { message?: string; history?: Array<{ role: string; content: string }> }
  try {
    body = await req.json() as typeof body
  } catch {
    return new Response(sseEvent({ error: 'Body JSON invalide' }) + sseDone(), {
      status: 400, headers: { 'Content-Type': 'text/event-stream' }
    })
  }

  const message = (body.message ?? '').trim().slice(0, 500)
  if (!message) {
    return new Response(sseEvent({ error: 'Message vide' }) + sseDone(), {
      status: 400, headers: { 'Content-Type': 'text/event-stream' }
    })
  }

  const history = (body.history ?? []).slice(-8)

  // Données contextuelles en parallèle
  const heure = new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Douala'
  })

  const [menuContext, userContext] = await Promise.all([
    getMenuContext(),
    userId ? getUserContext(userId) : Promise.resolve(''),
  ])

  const systemPrompt = buildSystemPrompt(menuContext, userContext, heure)

  // Construire les messages Anthropic
  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({
      role:    (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ]

  // ── Streaming SSE ──────────────────────────────────────────────────────────

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const client = getClient()

        const anthropicStream = await client.messages.stream({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 512,
          system:     systemPrompt,
          messages,
        })

        for await (const event of anthropicStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const chunk = sseEvent({ text: event.delta.text })
            controller.enqueue(encoder.encode(chunk))
          }
        }

        controller.enqueue(encoder.encode(sseDone()))
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur IA'
        controller.enqueue(encoder.encode(sseEvent({ error: msg })))
        controller.enqueue(encoder.encode(sseDone()))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache, no-transform',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
