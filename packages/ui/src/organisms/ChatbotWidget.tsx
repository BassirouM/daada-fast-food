'use client'

import * as React from 'react'
import { cn } from '../utils'
import { XIcon, SendIcon, MicIcon, ChefHatIcon, PackageIcon } from '../icons'
import { Avatar } from '../atoms/Avatar'
import { Spinner } from '../atoms/Spinner'

export type ChatbotType = 'order' | 'chef'

export interface ChatMessage {
  id:        string
  role:      'user' | 'assistant'
  content:   string
  createdAt: Date
}

export interface ChatbotWidgetProps {
  type?:        ChatbotType
  context?:     Record<string, unknown> | null
  onSend?:      (message: string, messages: ChatMessage[]) => Promise<string>
  className?:   string
}

const BOT_CONFIG: Record<ChatbotType, { name: string; emoji: string; welcome: string; placeholder: string }> = {
  order: {
    name:        'Assistant Daada',
    emoji:       '🛵',
    welcome:     'Bonjour ! Je suis votre assistant commande. Comment puis-je vous aider ?',
    placeholder: 'Suivi de commande, paiement, livraison…',
  },
  chef: {
    name:        'Chef Daada',
    emoji:       '👨‍🍳',
    welcome:     'Bonjour ! Je suis le Chef Daada. Posez-moi vos questions sur les recettes, les ingrédients ou les techniques de cuisine camerounaise.',
    placeholder: 'Ingrédients, techniques, recettes…',
  },
}

export function ChatbotWidget({
  type = 'order',
  context,
  onSend,
  className,
}: ChatbotWidgetProps) {
  const [open, setOpen]       = React.useState(false)
  const [input, setInput]     = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const cfg = BOT_CONFIG[type]

  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id:        'welcome',
      role:      'assistant',
      content:   cfg.welcome,
      createdAt: new Date(),
    },
  ])

  const endRef      = React.useRef<HTMLDivElement>(null)
  const inputRef    = React.useRef<HTMLInputElement>(null)
  const drawerRef   = React.useRef<HTMLDivElement>(null)

  // Auto-scroll
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, loading])

  // Focus input when opened
  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  // Close on Escape
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = {
      id:        Date.now().toString(),
      role:      'user',
      content:   text,
      createdAt: new Date(),
    }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const reply = await onSend?.(text, nextMessages)
      if (reply) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString() + '-r', role: 'assistant', content: reply, createdAt: new Date() },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + '-err', role: 'assistant', content: 'Désolé, une erreur est survenue. Réessayez.', createdAt: new Date() },
      ])
    } finally {
      setLoading(false)
    }
  }

  function formatTime(d: Date): string {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ouvrir le chat avec ${cfg.name}`}
        aria-expanded={open}
        className={cn(
          'fixed bottom-20 right-4 z-[350]',
          'w-14 h-14 rounded-full',
          'bg-[var(--brand)] text-white',
          'shadow-[var(--shadow-brand)]',
          'flex items-center justify-center text-2xl',
          'transition-all duration-200',
          'hover:scale-110 hover:shadow-[0_8px_30px_rgba(255,107,0,0.5)]',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-glow)]',
          open && 'opacity-0 pointer-events-none scale-90',
          className
        )}
      >
        <span aria-hidden>{cfg.emoji}</span>
      </button>

      {/* Drawer */}
      {open && (
        <div
          className="fixed inset-0 z-[400] flex items-end sm:items-center sm:justify-end sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={cfg.name}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          {/* Panel */}
          <div
            ref={drawerRef}
            className={cn(
              'relative flex flex-col',
              'w-full sm:w-96',
              'h-[80dvh] sm:h-[600px]',
              'bg-[var(--bg-base)] border border-[var(--border)]',
              'rounded-t-3xl sm:rounded-2xl',
              'shadow-[var(--shadow-lg)]',
              'animate-slide-up sm:animate-scale-in'
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[var(--brand-subtle)] flex items-center justify-center text-xl" aria-hidden>
                {cfg.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{cfg.name}</p>
                <p className="text-xs text-[var(--success)] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" aria-hidden />
                  En ligne
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer le chat"
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center',
                  'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                  'hover:bg-[var(--bg-elevated)]',
                  'transition-colors duration-100',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]'
                )}
              >
                <XIcon size={16} />
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 flex flex-col gap-3"
              aria-live="polite"
              aria-atomic="false"
              aria-label="Messages"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-2 items-end max-w-[85%]',
                    msg.role === 'user' && 'self-end flex-row-reverse'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center text-sm" aria-hidden>
                      {cfg.emoji}
                    </span>
                  )}
                  <div
                    className={cn(
                      'px-3 py-2 rounded-2xl text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-[var(--brand)] text-white rounded-br-sm'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-bl-sm'
                    )}
                  >
                    {msg.content}
                    <span className={cn(
                      'block text-[10px] mt-0.5',
                      msg.role === 'user' ? 'text-white/60 text-right' : 'text-[var(--text-muted)]'
                    )}>
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2 items-end self-start">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center text-sm" aria-hidden>
                    {cfg.emoji}
                  </span>
                  <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-[var(--bg-elevated)] flex items-center gap-1.5">
                    <Spinner size="sm" label="L'assistant répond…" />
                    <span className="text-xs text-[var(--text-muted)]">En train d'écrire…</span>
                  </div>
                </div>
              )}

              <div ref={endRef} aria-hidden />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 px-3 py-3 border-t border-[var(--border)] shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={cfg.placeholder}
                disabled={loading}
                maxLength={500}
                aria-label="Message"
                className={cn(
                  'flex-1 h-10 px-4 rounded-xl text-sm',
                  'bg-[var(--bg-input)] text-[var(--text-primary)]',
                  'border border-[var(--border)]',
                  'placeholder:text-[var(--text-muted)]',
                  'focus:outline-none focus:border-[var(--brand)]',
                  'disabled:opacity-50',
                  'transition-colors duration-100'
                )}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Envoyer"
                className={cn(
                  'w-10 h-10 flex items-center justify-center rounded-xl shrink-0',
                  'bg-[var(--brand)] text-white',
                  'hover:bg-[var(--brand-light)]',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  'transition-all duration-[120ms]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]'
                )}
              >
                <SendIcon size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
