'use client'

import * as React from 'react'
import { cn } from '../utils'
import { PlayIcon, SendIcon, MicIcon } from '../icons'
import { Avatar } from '../atoms/Avatar'

export interface StreamReaction {
  id:        string
  emoji:     string
  userId?:   string
}

export interface StreamMessage {
  id:        string
  userId:    string
  userName:  string
  userAvatar?: string
  message:   string
  createdAt: string
}

export interface LiveStreamPlayerProps {
  playbackId?:    string   // Mux playback ID
  viewersCount?:  number
  reactions?:     StreamReaction[]
  messages?:      StreamMessage[]
  onReact?:       (emoji: string) => void
  onMessage?:     (message: string) => void
  isLive?:        boolean
  title?:         string
  className?:     string
}

const REACTION_EMOJIS = ['❤️', '🔥', '😍', '👏', '🤤', '💯']

/**
 * LiveStreamPlayer — shell component.
 *
 * The video player requires Mux Player (@mux/mux-player-react).
 * Replace the placeholder <div> with:
 * ```tsx
 * import MuxPlayer from '@mux/mux-player-react'
 * <MuxPlayer playbackId={playbackId} streamType="live" autoPlay muted />
 * ```
 */
export function LiveStreamPlayer({
  playbackId,
  viewersCount = 0,
  reactions = [],
  messages = [],
  onReact,
  onMessage,
  isLive = false,
  title,
  className,
}: LiveStreamPlayerProps) {
  const [msgInput, setMsgInput] = React.useState('')
  const [floatingReactions, setFloatingReactions] = React.useState<{ id: string; emoji: string; x: number }[]>([])
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Incoming reactions float up
  React.useEffect(() => {
    if (reactions.length === 0) return
    const latest = reactions[reactions.length - 1]
    const floating = { id: latest.id, emoji: latest.emoji, x: Math.random() * 80 + 10 }
    setFloatingReactions((v) => [...v.slice(-9), floating])
    const t = setTimeout(() => {
      setFloatingReactions((v) => v.filter((r) => r.id !== floating.id))
    }, 1200)
    return () => clearTimeout(t)
  }, [reactions])

  function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = msgInput.trim()
    if (!trimmed) return
    onMessage?.(trimmed)
    setMsgInput('')
  }

  return (
    <div className={cn('flex flex-col rounded-2xl overflow-hidden bg-[var(--bg-base)] border border-[var(--border)]', className)}>
      {/* Video area */}
      <div className="relative w-full aspect-video bg-black overflow-hidden">
        {/* Placeholder — replace with <MuxPlayer> in production */}
        {playbackId ? (
          <div className="w-full h-full flex items-center justify-center bg-[var(--bg-elevated)]">
            <div className="flex flex-col items-center gap-3 text-[var(--text-muted)]">
              <PlayIcon size={48} />
              <p className="text-sm">Mux Player — playbackId: {playbackId}</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[var(--bg-black)] to-[#1a0800]">
            <div className="text-4xl animate-pulse">🍳</div>
          </div>
        )}

        {/* Live badge */}
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            DIRECT
          </div>
        )}

        {/* Viewers */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 text-white text-[10px]">
          👁 {viewersCount.toLocaleString('fr-FR')}
        </div>

        {/* Title */}
        {title && (
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-sm font-semibold text-white truncate">{title}</p>
          </div>
        )}

        {/* Floating reactions */}
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            aria-hidden
            className="absolute bottom-16 text-2xl animate-slide-up pointer-events-none"
            style={{ left: `${r.x}%`, transform: 'translateX(-50%)' }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Reactions bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onReact?.(emoji)}
            aria-label={`Réagir ${emoji}`}
            className={cn(
              'text-xl w-9 h-9 rounded-xl flex items-center justify-center',
              'hover:bg-[var(--bg-elevated)] active:scale-125',
              'transition-all duration-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]'
            )}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Chat messages */}
      <div
        className="flex flex-col gap-2 px-3 py-2 h-48 overflow-y-auto overscroll-contain"
        aria-label="Chat en direct"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] text-center py-4">
            Soyez le premier à commenter !
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2">
              <Avatar src={msg.userAvatar} fallback={msg.userName} size="xs" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-[var(--brand)]">{msg.userName} </span>
                <span className="text-xs text-[var(--text-secondary)]">{msg.message}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} aria-hidden />
      </div>

      {/* Message input */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 px-3 py-2.5 border-t border-[var(--border)]"
      >
        <input
          type="text"
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
          placeholder="Écrire un message…"
          maxLength={200}
          aria-label="Message"
          className={cn(
            'flex-1 h-9 px-3 rounded-xl text-sm',
            'bg-[var(--bg-input)] text-[var(--text-primary)]',
            'border border-[var(--border)]',
            'placeholder:text-[var(--text-muted)]',
            'focus:outline-none focus:border-[var(--brand)]',
            'transition-colors duration-100'
          )}
        />
        <button
          type="submit"
          disabled={!msgInput.trim()}
          aria-label="Envoyer"
          className={cn(
            'w-9 h-9 flex items-center justify-center rounded-xl',
            'bg-[var(--brand)] text-white',
            'hover:bg-[var(--brand-light)]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'transition-colors duration-[120ms]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]'
          )}
        >
          <SendIcon size={14} />
        </button>
      </form>
    </div>
  )
}
