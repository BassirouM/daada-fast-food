/**
 * Service IA — Assistant conversationnel Daada
 *
 * - Streaming SSE vers /api/ai/chat
 * - Parse les actions JSON dans la réponse de Claude
 * - Met à jour le chatStore en temps réel
 */

import type { ChatMessage, ChatAction } from '@/stores/chatStore'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendMessageOptions {
  message:   string
  history:   ChatMessage[]
  onChunk:   (chunk: string) => void
  onAction:  (action: ChatAction) => void
  onDone:    (fullText: string, action: ChatAction | null) => void
  onError:   (err: string) => void
  signal?:   AbortSignal
}

// ─── Parse ACTION JSON ────────────────────────────────────────────────────────

export function parseAction(text: string): { clean: string; action: ChatAction | null } {
  const actionMatch = text.match(/ACTION:\{[^}]+(?:\{[^}]*\}[^}]*)?\}/)
  if (!actionMatch) return { clean: text.trim(), action: null }

  const jsonStr = actionMatch[0].replace('ACTION:', '')
  try {
    const action = JSON.parse(jsonStr) as ChatAction
    const clean  = text.replace(actionMatch[0], '').trim()
    return { clean, action }
  } catch {
    return { clean: text.replace(actionMatch[0], '').trim(), action: null }
  }
}

// ─── sendMessage ──────────────────────────────────────────────────────────────

export async function sendMessage(opts: SendMessageOptions): Promise<void> {
  const { message, history, onChunk, onAction, onDone, onError, signal } = opts

  try {
    const fetchOpts: RequestInit = {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        message,
        history: history.slice(-10).map((m) => ({
          role:    m.role,
          content: m.content,
        })),
      }),
      ...(signal != null && { signal }),
    }
    const response = await fetch('/api/ai/chat', fetchOpts)

    if (!response.ok) {
      const err = await response.json() as { error?: string }
      onError(err.error ?? 'Erreur serveur')
      return
    }

    if (!response.body) {
      onError('Pas de réponse streaming')
      return
    }

    const reader  = response.body.getReader()
    const decoder = new TextDecoder()
    let   fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })

      // Parse SSE events : "data: ...\n\n"
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data) as { text?: string; done?: boolean }
          if (parsed.text) {
            fullText += parsed.text
            onChunk(parsed.text)
          }
        } catch {
          // Ligne SSE non-JSON (keepalive, etc.)
        }
      }
    }

    // Parser l'action après la fin du stream
    const { clean, action } = parseAction(fullText)
    if (action) onAction(action)
    onDone(clean, action)
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return
    onError('Connexion interrompue. Réessaie.')
  }
}
