/**
 * Zustand store — Chat IA assistant
 *
 * Mémoire de session uniquement (pas de localStorage).
 * L'historique est réinitialisé à chaque rechargement de page.
 */

import { create } from 'zustand'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChatRole = 'user' | 'assistant'

export type ChatAction =
  | { type: 'add_to_cart'; menuId: string; quantity: number; nom?: string; prix?: number }
  | { type: 'suggest'; items: Array<{ menuId: string; nom: string; prix: number }> }

export type ChatMessage = {
  id:        string
  role:      ChatRole
  content:   string
  timestamp: number
  action?:   ChatAction
}

type ChatState = {
  messages:    ChatMessage[]
  isOpen:      boolean
  isLoading:   boolean
  isStreaming: boolean
  /** Badge de suggestion disponible */
  hasSuggestion: boolean

  addMessage:    (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => string
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void
  clearHistory:  () => void
  setOpen:       (open: boolean) => void
  setLoading:    (v: boolean) => void
  setStreaming:  (v: boolean) => void
  setSuggestion: (v: boolean) => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

let _msgCounter = 0
function newId() {
  return `msg_${Date.now()}_${++_msgCounter}`
}

export const useChatStore = create<ChatState>((set) => ({
  messages:      [],
  isOpen:        false,
  isLoading:     false,
  isStreaming:   false,
  hasSuggestion: false,

  addMessage: (msg) => {
    const id = newId()
    set((s) => ({
      messages: [...s.messages, { ...msg, id, timestamp: Date.now() }],
    }))
    return id
  },

  updateMessage: (id, patch) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),

  clearHistory: () => set({ messages: [], hasSuggestion: false }),

  setOpen:       (open) => set({ isOpen: open }),
  setLoading:    (v)    => set({ isLoading: v }),
  setStreaming:  (v)    => set({ isStreaming: v }),
  setSuggestion: (v)    => set({ hasSuggestion: v }),
}))
