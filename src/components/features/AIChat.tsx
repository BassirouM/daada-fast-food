'use client'

/**
 * Assistant IA Chat — Daada
 *
 * - Bouton flottant 🤖 bottom-left
 * - Chat modal avec streaming SSE
 * - Actions IA → add_to_cart / suggest
 * - Suggestions rapides initiales
 * - Typing indicator 3 dots CSS
 * - Auto-scroll
 * - Analytics PostHog
 */

import {
  useEffect, useRef, useCallback, useState,
} from 'react'
import { useChatStore } from '@/stores/chatStore'
import { useCartStore } from '@/stores/cart.store'
import { sendMessage, parseAction } from '@/services/ai/assistant'
import { formatPrice } from '@/lib/utils'
import { trackEvent } from '@/lib/monitoring/posthog'
import type { ChatAction, ChatMessage } from '@/stores/chatStore'

// ─── Quick suggestions ────────────────────────────────────────────────────────

const QUICK_SUGGESTIONS = [
  "J'ai 2000 FCFA 💰",
  'Pas épicé 🌿',
  'Pour 2 personnes 👫',
  'Surprise-moi ! 🎲',
]

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 14px', alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width:            7,
            height:           7,
            borderRadius:     '50%',
            background:       'var(--text-muted)',
            display:          'inline-block',
            animation:        'daaadaDot 1.2s infinite ease-in-out',
            animationDelay:   `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes daaadaDot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40%            { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionButton({ action, onExecute }: {
  action: ChatAction
  onExecute: (a: ChatAction) => void
}) {
  const [done, setDone] = useState(false)

  function handleClick() {
    if (done) return
    setDone(true)
    onExecute(action)
  }

  if (action.type === 'add_to_cart') {
    return (
      <button
        onClick={handleClick}
        disabled={done}
        style={{
          marginTop:     8,
          padding:       '8px 14px',
          borderRadius:  999,
          border:        'none',
          background:    done ? 'var(--bg-elevated)' : 'var(--brand)',
          color:         done ? 'var(--text-muted)' : 'white',
          fontSize:      '0.8125rem',
          fontWeight:    700,
          cursor:        done ? 'default' : 'pointer',
          display:       'flex',
          alignItems:    'center',
          gap:           6,
          transition:    'background 0.2s',
        }}
      >
        {done ? '✓ Ajouté' : `➕ Ajouter ${action.nom ?? ''} — ${action.prix ? formatPrice(action.prix) : ''}`}
      </button>
    )
  }

  if (action.type === 'suggest' && action.items?.length) {
    return (
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {action.items.map((item) => (
          <button
            key={item.menuId}
            onClick={() => {
              if (!done) {
                onExecute({ type: 'add_to_cart', menuId: item.menuId, quantity: 1, nom: item.nom, prix: item.prix })
              }
            }}
            disabled={done}
            style={{
              padding:      '8px 14px',
              borderRadius: 999,
              border:       '1.5px solid var(--brand)',
              background:   'transparent',
              color:        'var(--brand)',
              fontSize:     '0.8125rem',
              fontWeight:   700,
              cursor:       done ? 'default' : 'pointer',
              textAlign:    'left',
            }}
          >
            ➕ {item.nom} — {formatPrice(item.prix)}
          </button>
        ))}
      </div>
    )
  }

  return null
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  streaming,
  onExecuteAction,
}: {
  msg: ChatMessage
  streaming: boolean
  onExecuteAction: (a: ChatAction) => void
}) {
  const isUser = msg.role === 'user'

  return (
    <div style={{
      display:        'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom:   12,
    }}>
      {!isUser && (
        <div style={{
          width:        32,
          height:       32,
          borderRadius: '50%',
          background:   'linear-gradient(135deg, #FF6B00, #CC5500)',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          fontSize:     '1rem',
          flexShrink:   0,
          marginRight:  8,
          marginTop:    2,
        }}>
          🤖
        </div>
      )}

      <div style={{ maxWidth: '80%' }}>
        <div style={{
          padding:      '10px 14px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background:   isUser ? 'var(--brand)' : 'var(--bg-elevated)',
          color:        isUser ? 'white' : 'var(--text-primary)',
          fontSize:     '0.875rem',
          lineHeight:   1.5,
          wordBreak:    'break-word',
          border:       isUser ? 'none' : '1px solid var(--border)',
        }}>
          {msg.content}
          {streaming && !isUser && (
            <span style={{
              display:    'inline-block',
              width:      2,
              height:     14,
              background: 'var(--text-primary)',
              marginLeft: 2,
              animation:  'blink 1s steps(1) infinite',
            }} />
          )}
        </div>

        {/* Action buttons */}
        {msg.action && !isUser && (
          <ActionButton action={msg.action} onExecute={onExecuteAction} />
        )}

        <span style={{
          display:    'block',
          fontSize:   '0.6875rem',
          color:      'var(--text-muted)',
          marginTop:  4,
          textAlign:  isUser ? 'right' : 'left',
        }}>
          {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AIChat() {
  const {
    messages, isOpen, isLoading, isStreaming, hasSuggestion,
    addMessage, updateMessage, clearHistory,
    setOpen, setLoading, setStreaming, setSuggestion,
  } = useChatStore()

  const addItem       = useCartStore((s) => s.addItem)
  const [input, setInput] = useState('')
  const messagesEndRef    = useRef<HTMLDivElement>(null)
  const inputRef          = useRef<HTMLInputElement>(null)
  const abortRef          = useRef<AbortController | null>(null)
  const streamingIdRef    = useRef<string | null>(null)

  // ── Auto-scroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ── Focus input on open ───────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // ── Haptic feedback ───────────────────────────────────────────────────────

  const haptic = useCallback(() => {
    // Vibration API — disponible sur mobile web et Capacitor
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10)
      }
    } catch { /**/ }
  }, [])

  // ── Execute action ────────────────────────────────────────────────────────

  const executeAction = useCallback((action: ChatAction) => {
    if (action.type === 'add_to_cart') {
      addItem({
        id:       action.menuId,
        menuItem: {
          id:                       action.menuId,
          name:                     action.nom ?? 'Plat',
          price:                    action.prix ?? 0,
          category_id:              '',
          slug:                     action.menuId,
          description:              '',
          option_groups:            [],
          is_available:             true,
          is_featured:              false,
          preparation_time_minutes: 15,
          tags:                     [],
          created_at:               new Date().toISOString(),
        },
        quantity:        action.quantity ?? 1,
        selectedOptions: [],
        unitPrice:       action.prix ?? 0,
        totalPrice:      (action.prix ?? 0) * (action.quantity ?? 1),
      })
      haptic()

      trackEvent('item_added_to_cart', {
        item_id: action.menuId,
        ...(action.nom  !== undefined && { item_nom: action.nom }),
        ...(action.prix !== undefined && { montant:  action.prix }),
      })

      trackEvent('order_placed', {
        commande_id: `chat_${Date.now()}`,
      })
    }
  }, [addItem, haptic])

  // ── Send message ──────────────────────────────────────────────────────────

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || isLoading || isStreaming) return

    setInput('')
    setLoading(true)
    setSuggestion(false)
    haptic()

    // Ajouter message user
    addMessage({ role: 'user', content: msg })

    trackEvent('menu_searched', { query: msg })

    // Créer le placeholder message IA
    const aiId = addMessage({ role: 'assistant', content: '' })
    streamingIdRef.current = aiId

    // Annuler toute requête en cours
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    let streamedText = ''

    await sendMessage({
      message:  msg,
      history:  messages,
      signal:   abortRef.current.signal,

      onChunk: (chunk) => {
        streamedText += chunk
        setStreaming(true)
        // Mettre à jour le message au fil du streaming (sans l'action)
        const { clean } = parseAction(streamedText)
        updateMessage(aiId, { content: clean })
      },

      onAction: (action) => {
        setSuggestion(true)
        updateMessage(aiId, { action })
      },

      onDone: (fullText, action) => {
        updateMessage(aiId, {
          content: fullText,
          ...(action !== null && { action }),
        })
        setStreaming(false)
        setLoading(false)
        haptic()
      },

      onError: (err) => {
        updateMessage(aiId, { content: `⚠️ ${err}` })
        setStreaming(false)
        setLoading(false)
      },
    })
  }, [input, isLoading, isStreaming, messages, addMessage, updateMessage, setLoading, setStreaming, setSuggestion, haptic])

  // ── Key handler ───────────────────────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Floating button ───────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes slideUpChat {
          from { opacity:0; transform: translateY(20px) scale(0.97); }
          to   { opacity:1; transform: translateY(0)    scale(1);    }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1);    opacity: 0.8; }
          100% { transform: scale(1.5);  opacity: 0;   }
        }
      `}</style>

      {/* ── Floating button ─── */}
      <button
        onClick={() => setOpen(!isOpen)}
        aria-label="Ouvrir l'assistant Daada IA"
        style={{
          position:        'fixed',
          bottom:          'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)',
          left:            '1rem',
          zIndex:          40,
          width:           52,
          height:          52,
          borderRadius:    '50%',
          background:      isOpen
            ? 'var(--bg-elevated)'
            : 'linear-gradient(135deg, #FF6B00, #CC5500)',
          border:          isOpen ? '1.5px solid var(--border)' : 'none',
          color:           isOpen ? 'var(--text-secondary)' : 'white',
          fontSize:        isOpen ? '1.25rem' : '1.5rem',
          cursor:          'pointer',
          boxShadow:       '0 4px 20px rgba(255,107,0,0.4)',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          transition:      'all 0.2s',
        }}
      >
        {isOpen ? '✕' : '🤖'}

        {/* Badge suggestion */}
        {hasSuggestion && !isOpen && (
          <>
            <span style={{
              position:   'absolute',
              top:        2,
              right:      2,
              width:      12,
              height:     12,
              borderRadius: '50%',
              background: '#10B981',
              border:     '2px solid var(--bg-base)',
            }} />
            <span style={{
              position:   'absolute',
              top:        2,
              right:      2,
              width:      12,
              height:     12,
              borderRadius: '50%',
              background: '#10B981',
              animation:  'pulseRing 1.5s infinite',
            }} />
          </>
        )}
      </button>

      {/* ── Chat modal ─── */}
      {isOpen && (
        <div
          style={{
            position:     'fixed',
            bottom:       'calc(env(safe-area-inset-bottom, 0px) + 8.5rem)',
            left:         '1rem',
            right:        '1rem',
            maxWidth:     400,
            zIndex:       50,
            borderRadius: 20,
            overflow:     'hidden',
            background:   'var(--bg-surface)',
            border:       '1px solid var(--border)',
            boxShadow:    '0 8px 40px rgba(0,0,0,0.4)',
            display:      'flex',
            flexDirection:'column',
            maxHeight:    '70vh',
            animation:    'slideUpChat 0.25s ease',
          }}
        >
          {/* Header */}
          <div style={{
            padding:        '12px 16px',
            background:     'linear-gradient(135deg, #FF6B00, #CC5500)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            flexShrink:     0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width:        32,
                height:       32,
                borderRadius: '50%',
                background:   'rgba(255,255,255,0.2)',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                fontSize:     '1.125rem',
              }}>
                🤖
              </div>
              <div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'white' }}>
                  Daada IA
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.8)' }}>
                  {isStreaming ? 'En train d\'écrire...' : 'En ligne ✓'}
                </div>
              </div>
            </div>

            <button
              onClick={clearHistory}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border:     'none',
                borderRadius: 8,
                color:      'rgba(255,255,255,0.9)',
                fontSize:   '0.6875rem',
                fontWeight: 600,
                padding:    '4px 10px',
                cursor:     'pointer',
              }}
            >
              Effacer
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex:       1,
            overflowY:  'auto',
            padding:    '16px',
            display:    'flex',
            flexDirection: 'column',
          }}>
            {/* Message d'accueil */}
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🤖</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>
                  Bonjour ! Je suis Daada 👋
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Dis-moi ce dont tu as envie et je t&apos;aide à commander !
                </p>

                {/* Suggestions rapides */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {QUICK_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      style={{
                        padding:      '8px 14px',
                        borderRadius: 999,
                        border:       '1.5px solid var(--border)',
                        background:   'var(--bg-elevated)',
                        color:        'var(--text-primary)',
                        fontSize:     '0.8125rem',
                        fontWeight:   600,
                        cursor:       'pointer',
                        transition:   'all 0.15s',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Liste des messages */}
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                streaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
                onExecuteAction={executeAction}
              />
            ))}

            {/* Typing indicator */}
            {isLoading && !isStreaming && (
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF6B00, #CC5500)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', flexShrink: 0, marginRight: 8,
                }}>
                  🤖
                </div>
                <div style={{
                  background: 'var(--bg-elevated)',
                  borderRadius: '18px 18px 18px 4px',
                  border: '1px solid var(--border)',
                }}>
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding:     '10px 12px',
            borderTop:   '1px solid var(--border)',
            display:     'flex',
            gap:         8,
            flexShrink:  0,
            background:  'var(--bg-surface)',
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 500))}
              onKeyDown={handleKeyDown}
              placeholder="Tape ton message..."
              disabled={isLoading || isStreaming}
              style={{
                flex:         1,
                padding:      '10px 14px',
                borderRadius: 999,
                border:       '1.5px solid var(--border)',
                background:   'var(--bg-elevated)',
                color:        'var(--text-primary)',
                fontSize:     '0.875rem',
                outline:      'none',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading || isStreaming}
              style={{
                width:        42,
                height:       42,
                borderRadius: '50%',
                border:       'none',
                background:   (!input.trim() || isLoading || isStreaming)
                  ? 'var(--bg-elevated)'
                  : 'var(--brand)',
                color:        (!input.trim() || isLoading || isStreaming)
                  ? 'var(--text-muted)'
                  : 'white',
                fontSize:     '1.125rem',
                cursor:       (!input.trim() || isLoading || isStreaming) ? 'default' : 'pointer',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                flexShrink:   0,
                transition:   'all 0.15s',
              }}
              aria-label="Envoyer"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  )
}
